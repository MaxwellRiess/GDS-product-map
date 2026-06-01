// GitHub OAuth proxy for the GDS Product Map.
// Holds the OAuth client secret server-side so it never reaches the browser.
// Two routes:
//   GET /auth      redirects the popup to GitHub's consent screen
//   GET /callback  exchanges the code for a token and posts it back to the app
//
// Required config (set via wrangler):
//   GITHUB_CLIENT_ID      secret  - OAuth App client ID
//   GITHUB_CLIENT_SECRET  secret  - OAuth App client secret
//   ALLOWED_ORIGIN        var     - the app's origin, e.g. https://maxwellriess.github.io

const COOKIE_NAME = 'gds_oauth_state'

function setCookie(name, value, maxAge) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const redirectUri = `${url.origin}/callback`

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID()
      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', 'public_repo')
      authUrl.searchParams.set('state', state)
      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl.toString(),
          'Set-Cookie': setCookie(COOKIE_NAME, state, 600),
        },
      })
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const cookies = parseCookies(request.headers.get('Cookie'))

      let payload
      if (!code || !state || state !== cookies[COOKIE_NAME]) {
        payload = { type: 'github-oauth', error: 'invalid_state' }
      } else {
        const res = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
          }),
        })
        const data = await res.json()
        payload = data.access_token
          ? { type: 'github-oauth', token: data.access_token }
          : { type: 'github-oauth', error: data.error || 'no_token' }
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
    window.opener.postMessage(payload, ${JSON.stringify(env.ALLOWED_ORIGIN)});
  }
  window.close();
})();
</script>
</body>`
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': setCookie(COOKIE_NAME, '', 0),
        },
      })
    }

    return new Response('Not found', { status: 404 })
  },
}
