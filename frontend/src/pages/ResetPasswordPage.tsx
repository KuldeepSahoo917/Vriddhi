import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword, AuthApiError } from '../lib/authApi';
import { AuthPageDecor } from '../components/AuthPageDecor';
import './AuthPage.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSubmitted(true);
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
          <p className="auth-page__subtitle">Set a new password</p>

          {!token && (
            <p className="auth-page__error" role="alert">
              This reset link is missing its token. Request a new one from the sign-in page.
            </p>
          )}

          {submitted ? (
            <>
              <p className="auth-page__linked" role="status">
                Your password has been reset.
              </p>
              <button
                className="auth-page__submit"
                onClick={() => navigate('/auth')}
              >
                Go to sign in
              </button>
            </>
          ) : (
            token && (
              <form onSubmit={handleSubmit} className="auth-page__form">
                <div className="auth-page__field">
                  <label className="auth-page__label" htmlFor="reset-password">New password</label>
                  <input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <div className="auth-page__field">
                  <label className="auth-page__label" htmlFor="reset-confirm">Confirm password</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                {error && <p className="auth-page__error" role="alert">{error}</p>}

                <button type="submit" className="auth-page__submit" disabled={submitting}>
                  {submitting ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            )
          )}

          <p className="auth-page__switch-line">
            <Link to="/auth" className="auth-page__switch-link">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
