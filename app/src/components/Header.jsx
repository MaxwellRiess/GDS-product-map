export default function Header({ authenticated, githubUser, onAuthClick, onSignOut }) {
  return (
    <header className="bg-gds-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-0">
        {/* Main header row */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">GDS Product Map</h1>
            <p className="text-white/60 text-sm mt-0.5">What we build, who builds it</p>
          </div>
          <div className="flex items-center gap-3">
            {authenticated ? (
              <div className="flex items-center gap-3">
                {githubUser && (
                  <span className="text-white/70 text-sm">
                    Signed in as <span className="text-white font-medium">{githubUser.login}</span>
                  </span>
                )}
                <button
                  onClick={onSignOut}
                  className="text-sm text-white/70 hover:text-white underline"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-gds-blue hover:bg-gds-blue-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors"
              >
                Sign in to edit
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
