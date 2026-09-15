import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import './GoogleSignInButton.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton({
  onError,
  onLinked,
}: {
  onError: (message: string) => void;
  onLinked?: () => void;
}) {
  const realButtonRef = useRef<HTMLDivElement>(null);
  const { googleLogin } = useAuth();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !realButtonRef.current) return;

    function tryInit() {
      if (!window.google || !realButtonRef.current) {
        setTimeout(tryInit, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: (response) => {
          googleLogin(response.credential)
            .then(({ linked }) => {
              if (linked) onLinked?.();
            })
            .catch(() => {
              onError('Could not sign in with Google. Try again.');
            });
        },
      });
      window.google.accounts.id.renderButton(realButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: realButtonRef.current.offsetWidth || 320,
        text: 'continue_with',
      });
    }
    tryInit();
  }, [googleLogin, onError, onLinked]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="google-btn-wrapper">
      {/* Visual button matching our dark theme — purely decorative. */}
      <div className="google-btn-visual" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        <span>Continue with Google</span>
      </div>
      {/* Real Google button, invisible, layered on top to capture the click. */}
      <div className="google-btn-real" ref={realButtonRef} />
    </div>
  );
}
