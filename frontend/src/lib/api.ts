import type {
  CompoundInterestInput,
  CompoundInterestResult,
  SipInput,
  SipResult,
  LoanInput,
  LoanResult,
  RetirementInput,
  RetirementResult,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.fieldErrors = fieldErrors;
  }
}

async function post<TInput, TResult>(path: string, body: TInput): Promise<TResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      'This entry could not be calculated. Check your inputs.',
      payload?.error?.fieldErrors,
    );
  }

  return response.json();
}

export function fetchCompoundInterest(
  input: CompoundInterestInput,
): Promise<CompoundInterestResult> {
  return post('/api/calculate/compound-interest', input);
}

export function fetchSip(input: SipInput): Promise<SipResult> {
  return post('/api/calculate/sip', input);
}

export function fetchLoan(input: LoanInput): Promise<LoanResult> {
  return post('/api/calculate/loan', input);
}

export function fetchRetirement(input: RetirementInput): Promise<RetirementResult> {
  return post('/api/calculate/retirement', input);
}
