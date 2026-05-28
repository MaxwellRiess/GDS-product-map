export default function Header({ authenticated, githubUser, onAuthClick, onSignOut }) {
  return (
    <header className="bg-gds-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-0">
        {/* Crown copyright bar */}
        <div className="flex items-center gap-2 py-2 border-b border-white/20 text-sm">
          <svg viewBox="0 0 132 97" className="h-8 w-auto fill-white" aria-hidden="true">
            <path d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.5-1.3-7.5.2-9.1 3.9-1.6 3.7.1 7.7 3.9 9zM9 39.5c3.7 1.5 7.9-.2 9.4-3.7 1.5-3.6-.2-7.8-3.9-9.1C10.8 25.1 6.8 26.6 5 30.3c-1.6 3.8.1 7.8 4 9.2zm-4.4 7.4c.2-.8.5-1.6 1-2.3 1.7-2.6 5.5-3.4 8.2-1.7 1 .6 1.7 1.5 2.1 2.4l.5-.3 9.3-5.8c-3-3.3-8.4-4.3-12.5-2.1C10.7 39 8.4 43.3 9 47.5c-.3.3-.5.7-.6 1.1l.2-.2c-.6.2-1.2.3-1.8.2-3.8-.6-6.4-4.2-5.8-8 .1-.8.4-1.5.7-2.1-1-.2-2-.4-3-.5C-2 40.3-2.4 45 .6 48c1.4 1.4 3.3 2.2 5.2 2.3l-1.2-.4zm35.4 6.9c-3.8 1.2-5.9 5.3-4.6 9.2 1.2 3.9 5.3 6 9.2 4.8 3.8-1.2 6-5.4 4.7-9.2-1.3-3.8-5.4-6-9.3-4.8zm14.4-7.4c-2 .6-3.5 2.3-3.7 4.4-.3 2 .7 4 2.5 5l.5-.8 3.2-5.2c-.7-1.5-1.3-2.7-1.3-2.7l-1.2-.7zm-3.7-26.8c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.5-1.3-7.5.2-9.1 3.9-1.5 3.7.2 7.7 3.9 9zm14-8.4c.3 4 3.7 7.1 7.7 7 4-.1 7.2-3.5 7-7.5-.2-4-3.6-7.1-7.7-7-4 .2-7.1 3.5-7 7.5zm2.3 13.7c-3.6 1.3-5.4 5.3-4.1 8.9 1.3 3.6 5.3 5.4 8.9 4.1 3.5-1.3 5.3-5.3 4-8.9-1.3-3.6-5.2-5.4-8.8-4.1zm15.7-14.1c3.5 1.5 7.7-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.5-1.3-7.5.2-9.1 3.9-1.6 3.7.1 7.7 3.8 9zm14-8.4c.2 4 3.6 7.1 7.6 7 4-.1 7.2-3.5 7.1-7.5-.2-4-3.6-7.1-7.7-7-4 .2-7.1 3.5-7 7.5zm-5.4 13.9c-3.6 1.3-5.4 5.3-4.1 8.9 1.3 3.6 5.4 5.4 9 4.1 3.5-1.3 5.3-5.3 4-8.9-1.3-3.6-5.3-5.4-8.9-4.1zm18.1 5.5c.5 4 4.2 6.9 8.2 6.4 4-.5 6.9-4.2 6.4-8.2-.5-4-4.2-6.9-8.2-6.4-4 .5-7 4.2-6.4 8.2zm-9.7 26.2c-3.7 1.2-5.8 5.2-4.6 9 1.2 3.8 5.2 5.9 9 4.7 3.7-1.2 5.8-5.3 4.6-9-1.2-3.8-5.2-5.9-9-4.7zM31.5 72.6c-3.8 1.2-5.9 5.2-4.7 9 1.2 3.8 5.3 5.9 9.1 4.7 3.8-1.2 5.9-5.3 4.7-9-1.3-3.8-5.3-5.9-9.1-4.7zm45.5.1c-3.8 1.2-5.9 5.2-4.7 9 1.2 3.8 5.3 5.9 9.1 4.7 3.8-1.2 5.9-5.3 4.7-9.1-1.3-3.7-5.3-5.8-9.1-4.6zM66 95.8c2.2 0 4-.8 5.4-2.3L66 93l-5.4.5c1.4 1.5 3.3 2.3 5.4 2.3zm-29-17.2c1.2 3.8 5.3 5.9 9.1 4.7 3.8-1.2 5.9-5.3 4.7-9.1-1.2-3.8-5.3-5.9-9.1-4.7-3.7 1.3-5.8 5.3-4.7 9.1zm70.7-.1c-1.3 3.8.9 7.8 4.7 9.1 3.8 1.2 7.8-.9 9.1-4.7 1.2-3.8-.9-7.8-4.7-9-3.9-1.3-7.9.8-9.1 4.6zm-14.1-7.2c-3.7 1.2-5.8 5.2-4.6 9 1.2 3.8 5.2 5.9 9 4.7 3.7-1.2 5.8-5.3 4.6-9-1.2-3.8-5.2-5.9-9-4.7z" />
          </svg>
          <span className="text-white/80 text-xs">Government Digital Service</span>
        </div>
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
