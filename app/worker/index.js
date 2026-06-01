// Serves the static app and handles all GitHub access on the same origin.
//
//   GET  /auth      redirects the popup to GitHub to identify the user
//   GET  /callback  exchanges the code for the user's identity, mints a session
//                   cookie, and posts the user back to the app. No GitHub token
//                   ever reaches the browser.
//   GET  /api/me    returns the signed-in user, or 401
//   POST /api/commit  validates the session, then commits products.json to the
//                   repo using a GitHub App installation token (server-side)
//   POST /api/logout  clears the session cookie
//   everything else is served from the built static assets
//
// Required secrets (set via wrangler secret put):
//   GITHUB_CLIENT_ID            the GitHub App's client id (user web flow)
//   GITHUB_CLIENT_SECRET        the GitHub App's client secret
//   GITHUB_APP_ID               the GitHub App's numeric App ID
//   GITHUB_APP_INSTALLATION_ID  the installation id on this repo
//   GITHUB_APP_PRIVATE_KEY      the App private key, PKCS#8 PEM
//   SESSION_SECRET              random string used to sign session cookies

const REPO = 'MaxwellRiess/GDS-product-map'
const DATA_FILE_PATH = 'app/public/products.json'
const STATE_COOKIE = 'gds_oauth_state'
const SESSION_COOKIE = 'gds_session'
const SESSION_TTL = 60 * 60 * 8 // 8 hours
const UA = 'gds-product-map-worker'

function cookie(name, value, maxAge) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    out[k] = v.join('=')
  }
  return out
}

function b64urlEncode(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

// --- session cookie (HMAC-signed, holds only the user identity) ---

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function signSession(env, payloadObj) {
  const payload = b64urlEncode(JSON.stringify(payloadObj))
  const key = await hmacKey(env.SESSION_SECRET)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return `${payload}.${b64urlEncode(sig)}`
}

async function verifySession(env, token) {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const key = await hmacKey(env.SESSION_SECRET)
  const ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(sig), new TextEncoder().encode(payload))
  if (!ok) return null
  let data
  try {
    data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)))
  } catch {
    return null
  }
  if (!data.exp || Date.now() / 1000 > data.exp) return null
  return data
}

// --- GitHub App installation token (server-side commit credential) ---

async function appJwt(env) {
  if (!env.GITHUB_APP_PRIVATE_KEY || !env.GITHUB_APP_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    throw new Error('private_key_not_pkcs8')
  }
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = { iat: now - 60, exp: now + 540, iss: env.GITHUB_APP_ID }
  const data = `${b64urlEncode(JSON.stringify(header))}.${b64urlEncode(JSON.stringify(payload))}`
  let key
  try {
    key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(env.GITHUB_APP_PRIVATE_KEY),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  } catch {
    throw new Error('private_key_import_failed')
  }
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data))
  return `${data}.${b64urlEncode(sig)}`
}

async function installationToken(env) {
  const jwt = await appJwt(env)
  const res = await fetch(
    `https://api.github.com/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': UA,
      },
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`installation_token_${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.token
}

// Rejects anything that is not the shape we expect, so a bad request can't
// overwrite products.json with garbage.
function isValidProductData(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.directorates)) return false
  return d.directorates.every(
    dir =>
      dir && typeof dir.id === 'string' && Array.isArray(dir.programmes) &&
      dir.programmes.every(p => p && Array.isArray(p.products)),
  )
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID()
      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`)
      authUrl.searchParams.set('state', state)
      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl.toString(),
          'Set-Cookie': cookie(STATE_COOKIE, state, 600),
        },
      })
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const cookies = parseCookies(request.headers.get('Cookie'))

      let payload
      const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
      headers.append('Set-Cookie', cookie(STATE_COOKIE, '', 0))

      if (!code || !state || state !== cookies[STATE_COOKIE]) {
        payload = { type: 'github-oauth', error: 'invalid_state' }
      } else {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${url.origin}/callback`,
          }),
        })
        const tokenData = await tokenRes.json()

        if (!tokenData.access_token) {
          payload = { type: 'github-oauth', error: tokenData.error || 'no_token' }
        } else {
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `token ${tokenData.access_token}`,
              Accept: 'application/vnd.github+json',
              'User-Agent': UA,
            },
          })
          if (!userRes.ok) {
            payload = { type: 'github-oauth', error: 'identity_failed' }
          } else {
            const u = await userRes.json()
            const user = { login: u.login, id: u.id, name: u.name || u.login, avatar_url: u.avatar_url }
            const session = await signSession(env, {
              ...user,
              exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
            })
            headers.append('Set-Cookie', cookie(SESSION_COOKIE, session, SESSION_TTL))
            payload = { type: 'github-oauth', user }
            // The GitHub user token has done its job (identity). Drop it.
          }
        }
      }

      const html = `<!doctype html>
<meta charset="utf-8">
<title>Signing in</title>
<body style="font-family: system-ui, sans-serif; padding: 2rem;">
<p>Authentication complete. You can close this window.</p>
<script>
(function () {
  var payload = ${JSON.stringify(payload)};
  if (window.opener) {
    window.opener.postMessage(payload, ${JSON.stringify(url.origin)});
  }
  window.close();
})();
</script>
</body>`
      return new Response(html, { headers })
    }

    if (url.pathname === '/api/me') {
      const cookies = parseCookies(request.headers.get('Cookie'))
      const session = await verifySession(env, cookies[SESSION_COOKIE])
      if (!session) return json({ error: 'unauthenticated' }, 401)
      return json({ user: { login: session.login, id: session.id, name: session.name, avatar_url: session.avatar_url } })
    }

    if (url.pathname === '/api/logout') {
      return json({ ok: true }, 200, { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0) })
    }

    if (url.pathname === '/api/commit') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

      const cookies = parseCookies(request.headers.get('Cookie'))
      const session = await verifySession(env, cookies[SESSION_COOKIE])
      if (!session) return json({ error: 'unauthenticated' }, 401)

      let newData
      try {
        newData = await request.json()
      } catch {
        return json({ error: 'invalid_json' }, 400)
      }
      if (!isValidProductData(newData)) return json({ error: 'invalid_shape' }, 422)

      let token
      try {
        token = await installationToken(env)
      } catch (e) {
        return json({ error: 'app_auth_failed', detail: e.message }, 502)
      }

      const apiUrl = `https://api.github.com/repos/${REPO}/contents/${DATA_FILE_PATH}`
      const ghHeaders = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': UA,
      }

      const getRes = await fetch(apiUrl, { headers: ghHeaders })
      if (!getRes.ok) return json({ error: 'read_failed' }, 502)
      const current = await getRes.json()

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))))
      // Attribute the commit to the signed-in user via their GitHub noreply email.
      const author = {
        name: session.name || session.login,
        email: `${session.id}+${session.login}@users.noreply.github.com`,
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: `Update product data via GDS Product Map (by @${session.login})`,
          content,
          sha: current.sha,
          author,
          committer: author,
        }),
      })
      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}))
        return json({ error: err.message || 'write_failed' }, 502)
      }
      return json({ ok: true })
    }

    return env.ASSETS.fetch(request)
  },
}
