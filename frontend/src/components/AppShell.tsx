import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../lib/AuthContext';
import './AppShell.css';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link to="/" className="app-shell__brand">
          <img src="/logo-icon.png" alt="Vriddhi" className="app-shell__logo" />
          <div>
            <h1 className="app-shell__name">Vriddhi</h1>
            <p className="app-shell__tagline">every rupee, accounted for</p>
          </div>
        </Link>

        <nav className="app-shell__nav">
          <Link to="/calculator" className="app-shell__nav-link">
            Calculator
          </Link>
          {status === 'signed-in' && (
            <>
              <Link to="/dashboard" className="app-shell__nav-link">
                {user?.name ? `${user.name.split(' ')[0]}'s plans` : 'Your plans'}
              </Link>
              <button className="app-shell__nav-link app-shell__nav-button" onClick={() => logout()}>
                Sign out
              </button>
            </>
          )}
          {status === 'signed-out' && (
            <Link to="/auth" className="app-shell__nav-link">
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </header>

      <main className="app-shell__main">{children}</main>

      <footer className="app-shell__footer">
        <div className="app-shell__footer-row">
          <p className="app-shell__footer-copy">
            © {new Date().getFullYear()} Vriddhi · Built for anyone who wants
            to see their money grow.
          </p>
          {/* TODO: replace these with your real profile URLs */}
          <div className="app-shell__footer-social">
            <a
              href="https://www.linkedin.com/in/piyush-rathwe-11628b216/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="app-shell__footer-icon"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.15 1.45-2.15 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
              </svg>
            </a>
            <a
              href="https://github.com/piyush-3020"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="app-shell__footer-icon"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.58 2 12.21c0 4.51 2.87 8.33 6.84 9.68.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.21C22 6.58 17.52 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://x.com/PiyushRathwe"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="app-shell__footer-icon"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.6L4.8 22H1.6l8.1-9.3L1 2h7l4.9 6.1L18.9 2zm-1.2 18h1.9L7.4 4H5.3l12.4 16z" />
              </svg>
            </a>
            <a 
            href="https://piyushrathwe.netlify.app/"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Portfolio"
  className="app-shell__footer-icon"
>
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 3a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v3h20V8a2 2 0 0 0-2-2h-3V5a2 2 0 0 0-2-2H9zm0 2h6v1H9V5zM2 12v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7H2zm8 2h4v2h-4v-2z" />
  </svg>
</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
