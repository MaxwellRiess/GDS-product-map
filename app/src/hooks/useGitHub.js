const DATA_FILE_PATH = 'app/public/products.json'

// Set this to your deployed Cloudflare Worker URL (no trailing slash).
export const OAUTH_WORKER_URL = 'https://gds-product-map-oauth.REPLACE-ME.workers.dev'

// Opens the GitHub consent popup and resolves with an access token.
export function loginWithGitHub() {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      `${OAUTH_WORKER_URL}/auth`,
      'github-oauth',
      'width=620,height=720',
    )
    if (!popup) {
      reject(new Error('Popup blocked. Allow popups for this site and try again.'))
      return
    }
    const workerOrigin = new URL(OAUTH_WORKER_URL).origin
    function handler(event) {
      if (event.origin !== workerOrigin) return
      if (!event.data || event.data.type !== 'github-oauth') return
      window.removeEventListener('message', handler)
      try { popup.close() } catch { /* ignore */ }
      if (event.data.error) reject(new Error(event.data.error))
      else resolve(event.data.token)
    }
    window.addEventListener('message', handler)
  })
}

export async function commitProductData(token, repo, newData) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${DATA_FILE_PATH}`
  const headers = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json',
  }

  const getRes = await fetch(apiUrl, { headers })
  if (!getRes.ok) {
    const err = await getRes.json()
    throw new Error(err.message || 'Could not read current file from GitHub')
  }
  const current = await getRes.json()

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))))

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Update product data via GDS Product Map',
      content,
      sha: current.sha,
    }),
  })

  if (!putRes.ok) {
    const err = await putRes.json()
    throw new Error(err.message || 'Failed to save changes to GitHub')
  }
}

export async function validateToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}` },
  })
  if (!res.ok) throw new Error('Invalid token')
  return res.json()
}
