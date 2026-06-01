// All GitHub access goes through the Worker on the same origin. The browser
// never holds a GitHub token: it holds an HttpOnly session cookie the Worker
// issued, and the Worker commits on the user's behalf via a GitHub App.

// Opens the GitHub consent popup and resolves with the signed-in user.
// /auth and /callback are served by the same Worker as this app.
export function loginWithGitHub() {
  return new Promise((resolve, reject) => {
    const popup = window.open('/auth', 'github-oauth', 'width=620,height=720')
    if (!popup) {
      reject(new Error('Popup blocked. Allow popups for this site and try again.'))
      return
    }
    function handler(event) {
      if (event.origin !== window.location.origin) return
      if (!event.data || event.data.type !== 'github-oauth') return
      window.removeEventListener('message', handler)
      try { popup.close() } catch { /* ignore */ }
      if (event.data.error) reject(new Error(event.data.error))
      else resolve(event.data.user)
    }
    window.addEventListener('message', handler)
  })
}

// Returns the signed-in user from the session cookie, or null.
export async function fetchSession() {
  const res = await fetch('/api/me', { credentials: 'same-origin' })
  if (!res.ok) return null
  const data = await res.json()
  return data.user
}

export async function logout() {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
}

// Sends the proposed data to the Worker, which validates the session and
// commits server-side. No token is passed from the browser.
export async function commitProductData(newData) {
  const res = await fetch('/api/commit', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newData),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('Your session has expired. Please sign in again.')
    throw new Error(err.error || 'Failed to save changes')
  }
}
