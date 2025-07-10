// Landing Page
{
  /* Feature Carousel */
  /* <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
              See How It Works
            </h3>
            <FeatureCarousel />
          </div> */
}

// Profile
{
  /*      Connected Accounts
  <div className="bg-card rounded-xl shadow-lg border p-6">
    <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
      <Mail className="w-5 h-5 mr-2" />
      Connected Accounts
    </h2>

    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border border-input rounded-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-card-foreground">
              Google Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Connected as {email}
            </p>
          </div>
        </div>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          Connected
        </span>
      </div>

      <div className="flex items-center justify-between p-4 border border-input rounded-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-gray-600"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-card-foreground">
              Apple Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Not connected
            </p>
          </div>
        </div>
        <button className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1 rounded-full transition-colors">
          Connect
        </button>
      </div>
    </div>
  </div> 

*/
}
{
  /* Prefreences 
    <div className="bg-card rounded-xl shadow-lg border p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-6">
        Preferences
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-input rounded-lg">
          <div className="flex items-center">
            {isDarkMode ? (
              <Moon className="w-5 h-5 mr-3 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 mr-3 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-medium text-card-foreground">
                Theme
              </h3>
              <p className="text-sm text-muted-foreground">
                {isDarkMode ? "Dark mode" : "Light mode"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDarkMode ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  */
}

// Google + Apple Login
{
  /*
  <div className="mt-6">
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-card text-muted-foreground">
          Or continue with
        </span>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-2 gap-3">
      <button
        type="button"
        aria-label="Continue with Google"
        className="flex items-center justify-center px-4 py-3 border border-input rounded-lg hover:bg-accent transition-all"
      >
        <GoogleIcon /> Google
      </button>

      <button
        type="button"
        aria-label="Continue with Apple"
        className="flex items-center justify-center px-4 py-3 border border-<div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-label="Continue with Google"
                  className="flex items-center justify-center px-4 py-3 border border-input rounded-lg hover:bg-accent transition-all"
                >
                  <GoogleIcon /> Google
                </button>

                <button
                  type="button"
                  aria-label="Continue with Apple"
                  className="flex items-center justify-center px-4 py-3 border border-input rounded-lg hover:bg-accent transition-all"
                >
                  <AppleIcon /> Apple
                </button>
              </div>
            </div>input rounded-lg hover:bg-accent transition-all"
      >
        <AppleIcon /> Apple
      </button>
    </div>
  </div>
  */
}
