import { useEffect, useState } from 'react';
import { ApiError } from './api';

export type CalculationStatus = 'loading' | 'idle' | 'error';

/**
 * Runs `fetcher` whenever `deps` change, handling loading/error state
 * and ignoring stale responses if deps change again before the
 * previous request resolves. Callers are responsible for debouncing
 * their own input values before passing them into deps.
 */
export function useLiveCalculation<TResult>(
  fetcher: () => Promise<TResult>,
  deps: unknown[],
) {
  const [result, setResult] = useState<TResult | null>(null);
  const [status, setStatus] = useState<CalculationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetcher()
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setStatus('idle');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiError ? err.message : 'Something went wrong.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { result, status, errorMessage, retry: () => setStatus('loading') };
}
