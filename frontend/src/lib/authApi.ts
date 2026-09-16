const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  linked?: boolean;
}

export class AuthApiError extends Error {
  fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'AuthApiError';
    this.fieldErrors = fieldErrors;
  }
}

async function authFetch<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send/receive the httpOnly refresh cookie
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AuthApiError('Could not reach the server. Check your connection.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error?.formErrors?.[0] ??
      payload?.error?.fieldErrors?.[Object.keys(payload?.error?.fieldErrors ?? {})[0] ?? '']?.[0] ??
      'Something went wrong.';
    throw new AuthApiError(message, payload?.error?.fieldErrors);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function register(name: string, email: string, password: string) {
  return authFetch<AuthResponse>('/api/auth/register', { name, email, password });
}

export function login(email: string, password: string) {
  return authFetch<AuthResponse>('/api/auth/login', { email, password });
}

export function googleLogin(credential: string) {
  return authFetch<AuthResponse>('/api/auth/google', { credential });
}

export function forgotPassword(email: string) {
  return authFetch<{ message: string }>('/api/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string) {
  return authFetch<{ message: string }>('/api/auth/reset-password', {
    token,
    newPassword,
  });
}

export function refresh() {
  return authFetch<{ accessToken: string }>('/api/auth/refresh');
}

export async function getMe(accessToken: string): Promise<PublicUser> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) throw new AuthApiError('Could not load your profile.');
  const data = await response.json();
  return data.user as PublicUser;
}

export function logout() {
  return authFetch<void>('/api/auth/logout');
}
