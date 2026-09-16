import { getAccessToken, refreshAccessToken } from './AuthContext';
import type { ScenarioType } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface Scenario {
  _id: string;
  type: ScenarioType;
  label: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export class ScenarioApiError extends Error {}

async function doFetch(
  path: string,
  options: { method?: string; body?: unknown },
  token: string,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function authedFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new ScenarioApiError('Sign in to continue.');

  let response: Response;
  try {
    response = await doFetch(path, options, token);
  } catch {
    throw new ScenarioApiError('Could not reach the server. Check your connection.');
  }

  // Access token likely expired mid-session (15 min lifetime) while
  // the refresh cookie is still valid — refresh silently and retry
  // once rather than telling the user their session ended.
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      try {
        response = await doFetch(path, options, newToken);
      } catch {
        throw new ScenarioApiError('Could not reach the server. Check your connection.');
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ScenarioApiError('Your session expired. Sign in again.');
    }
    throw new ScenarioApiError("This entry couldn't be saved.");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function listScenarios(): Promise<{ scenarios: Scenario[] }> {
  return authedFetch('/api/scenarios');
}

export function saveScenario(input: {
  type: ScenarioType;
  label: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}): Promise<{ scenario: Scenario }> {
  return authedFetch('/api/scenarios', { method: 'POST', body: input });
}

export function updateScenario(
  id: string,
  input: {
    type: ScenarioType;
    label: string;
    input: Record<string, unknown>;
    result: Record<string, unknown>;
  },
): Promise<{ scenario: Scenario }> {
  return authedFetch(`/api/scenarios/${id}`, { method: 'PATCH', body: input });
}

export function deleteScenario(id: string): Promise<void> {
  return authedFetch(`/api/scenarios/${id}`, { method: 'DELETE' });
}
