import { useState } from 'react'
import { validateToken } from '../hooks/useGitHub'

export default function GitHubAuth({ onAuth, onClose }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      await validateToken(token.trim())
      onAuth(token.trim())
    } catch {
      setError('That token didn\'t work. Check it has the "repo" scope and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gds-dark text-lg">Sign in with GitHub</h2>
          <button onClick={onClose} className="text-gds-grey hover:text-gds-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gds-grey mb-4">
          Edits are saved as commits to the GitHub repo. You need a personal access token with the <code className="bg-gds-light-grey px-1 py-0.5 rounded text-xs">repo</code> scope.
        </p>

        <ol className="text-sm text-gds-grey space-y-1 mb-5 list-decimal list-inside">
          <li>Go to <strong>GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)</strong></li>
          <li>Click <strong>Generate new token</strong></li>
          <li>Give it a name, select the <code className="bg-gds-light-grey px-1 rounded text-xs">repo</code> scope</li>
          <li>Copy the token and paste it below</li>
        </ol>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gds-dark mb-1">Personal access token</label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full border-2 border-gds-dark rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-gds-blue"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-gds-red-light text-gds-red text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full bg-gds-dark text-white font-medium py-2 rounded hover:bg-gds-grey transition disabled:opacity-40"
          >
            {loading ? 'Checking...' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-gds-mid-grey mt-4">
          Your token is stored in this browser only and never sent anywhere except the GitHub API.
        </p>
      </div>
    </div>
  )
}
