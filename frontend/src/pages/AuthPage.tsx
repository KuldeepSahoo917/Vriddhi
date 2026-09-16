import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { AuthApiError } from '../lib/authApi';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { AuthPageDecor } from '../components/AuthPageDecor';
import './AuthPage.css';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [linkedMessage, setLinkedMessage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, register, status } = useAuth();
  const navigate = useNavigate();

  // If already signed in (e.g. a stale bookmark, or browser back
  // button), don't show the login form — just leave.
  useEffect(() => {
    if (status === 'signed-in') {
      navigate('/dashboard', { replace: true });
    }
  }, [status, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-scene">
      <AuthPageDecor />
      <div className="auth-page">
        <div className="auth-page__card">
        <div className="auth-page__brand">
          <img src="/logo-icon.png" alt="Vriddhi" className="auth-page__logo" />
          <span className="auth-page__wordmark">Vriddhi</span>
        </div>
        <p className="auth-page__subtitle">
          {mode === 'login'
            ? 'Welcome back to your passbook'
            : 'Start your growth passbook'}
        </p>

        {linkedMessage && (
          <p className="auth-page__linked" role="status">
            Your existing account is now linked to Google — sign in with either from now on.
          </p>
        )}

        <div className="auth-page__google">
          <GoogleSignInButton onError={setError} onLinked={() => setLinkedMessage(true)} />
        </div>

        <div className="auth-page__divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-page__form">
          {mode === 'register' && (
            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-page__field">
            <label className="auth-page__label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-page__field">
            <label className="auth-page__label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {mode === 'login' && (
              <Link to="/forgot-password" className="auth-page__forgot-link">
                Forgot password?
              </Link>
            )}
          </div>

          {error && <p className="auth-page__error" role="alert">{error}</p>}

          <button type="submit" className="auth-page__submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-page__switch-line">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="auth-page__switch-link"
            onClick={() => {
              setMode((m) => (m === 'login' ? 'register' : 'login'));
              setError(null);
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
        </div>
      </div>
    </div>
  );
}
