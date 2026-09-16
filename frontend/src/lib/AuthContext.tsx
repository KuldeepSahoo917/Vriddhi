import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as authApi from './authApi';
import type { PublicUser } from './authApi';

interface AuthContextValue {
  user: PublicUser | null;
  accessToken: string | null;
  status: 'loading' | 'signed-in' | 'signed-out';
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<{ linked: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Module-level, not React state: lets api.ts read the current token
// without prop-drilling it into every fetch call.
let currentAccessToken: string | null = null;
export function getAccessToken(): string | null {
  return currentAccessToken;
}

// Usable outside the component tree (by scenarioApi.ts, advisorApi.ts)
// so a 401 mid-request can silently refresh and retry once, instead
// of surfacing "session expired" for a user whose refresh cookie is
// still perfectly valid — only the short-lived access token expired.
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const { accessToken } = await authApi.refresh();
    currentAccessToken = accessToken;
    return accessToken;
  } catch {
    currentAccessToken = null;
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [, setAccessTokenState] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'signed-in' | 'signed-out'>(
    'loading',
  );

  const setAccessToken = useCallback((token: string | null) => {
    currentAccessToken = token;
    setAccessTokenState(token);
  }, []);

  // On first load, try to silently refresh using the httpOnly cookie —
  // this restores the session without ever storing the access token
  // in localStorage. Also fetch the user profile, since /refresh only
  // returns a new access token, not who the user is.
  useEffect(() => {
    authApi
      .refresh()
      .then(async ({ accessToken }) => {
        setAccessToken(accessToken);
        try {
          const profile = await authApi.getMe(accessToken);
          setUser(profile);
        } catch {
          // Token refresh worked but profile fetch failed — still
          // treat as signed in; user's name just won't show until
          // next successful fetch.
        }
        setStatus('signed-in');
      })
      .catch(() => {
        setStatus('signed-out');
      });
  }, [setAccessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      setUser(res.user);
      setAccessToken(res.accessToken);
      setStatus('signed-in');
    },
    [setAccessToken],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authApi.register(name, email, password);
      setUser(res.user);
      setAccessToken(res.accessToken);
      setStatus('signed-in');
    },
    [setAccessToken],
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      const res = await authApi.googleLogin(credential);
      setUser(res.user);
      setAccessToken(res.accessToken);
      setStatus('signed-in');
      return { linked: res.linked ?? false };
    },
    [setAccessToken],
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    setAccessToken(null);
    setStatus('signed-out');
  }, [setAccessToken]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken: currentAccessToken, status, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
