import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, AuthApiError } from '../lib/authApi';
import { AuthPageDecor } from '../components/AuthPageDecor';
import './AuthPage.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
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
          <p className="auth-page__subtitle">Reset your password</p>

          {submitted ? (
            <p className="auth-page__linked" role="status">
              If an account exists for that email, we've sent a reset link. It expires in 1 hour.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-page__form">
              <div className="auth-page__field">
                <label className="auth-page__label" htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="auth-page__error" role="alert">{error}</p>}

              <button type="submit" className="auth-page__submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
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
