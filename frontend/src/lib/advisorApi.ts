import { getAccessToken, refreshAccessToken } from './AuthContext';
import type { ScenarioType } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class AdvisorApiError extends Error {}

interface AskParams {
  scenarioType: ScenarioType;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  question: string;
}

async function doFetch(params: AskParams, token: string): Promise<Response> {
  return fetch(`${API_BASE}/api/advisor/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(params),
  });
}

export async function askAdvisor(params: AskParams): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new AdvisorApiError('Sign in to ask the advisor.');

  let response: Response;
  try {
    response = await doFetch(params, token);
  } catch {
    throw new AdvisorApiError('Could not reach the server. Check your connection.');
  }

  // Same silent refresh-and-retry as scenarioApi — a 401 here usually
  // just means the 15-minute access token expired mid-session, not
  // that the user needs to sign in again.
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      try {
        response = await doFetch(params, newToken);
      } catch {
        throw new AdvisorApiError('Could not reach the server. Check your connection.');
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AdvisorApiError('Your session expired. Sign in again.');
    }
    if (response.status === 429) {
      throw new AdvisorApiError("You've asked a lot of questions — try again in a bit.");
    }
    throw new AdvisorApiError("The advisor couldn't respond right now. Try again.");
  }

  const data = await response.json();
  return data.answer as string;
}
