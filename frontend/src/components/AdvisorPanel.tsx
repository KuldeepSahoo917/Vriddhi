import { useState, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { askAdvisor, AdvisorApiError } from '../lib/advisorApi';
import type { ScenarioType } from '../lib/types';
import './AdvisorPanel.css';

export interface AdvisorPanelProps {
  scenarioType: ScenarioType;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
}

interface QaPair {
  question: string;
  answer: string;
}

const MAX_HISTORY = 3;

export function AdvisorPanel({ scenarioType, input, result }: AdvisorPanelProps) {
  const { status: authStatus } = useAuth();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<QaPair[]>([]);
  const [status, setStatus] = useState<'idle' | 'asking' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  if (!result) return null;

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    const asked = question.trim();
    if (!asked || !result) return;

    setStatus('asking');
    try {
      const answer = await askAdvisor({
        scenarioType,
        input,
        result,
        question: asked,
      });
      setHistory((prev) => [...prev, { question: asked, answer }].slice(-MAX_HISTORY));
      setQuestion('');
      setStatus('idle');
      // Return focus to the input so a follow-up question doesn't need a re-click.
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err) {
      setErrorMessage(
        err instanceof AdvisorApiError ? err.message : 'Something went wrong.',
      );
      setStatus('error');
    }
  }

  return (
    <div className="advisor-panel">
      <div className="advisor-panel__heading">
        <span className="advisor-panel__icon" aria-hidden="true">✦</span>
        <span>Ask the advisor</span>
      </div>

      {authStatus !== 'signed-in' ? (
        <p className="advisor-panel__prompt">
          <Link to="/auth">Sign in</Link> to ask questions about this scenario.
        </p>
      ) : (
        <>
          <form onSubmit={handleAsk} className="advisor-panel__form">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why does growth speed up later on?"
              className="advisor-panel__input"
              disabled={status === 'asking'}
            />
            <button
              type="submit"
              disabled={!question.trim() || status === 'asking'}
              className="advisor-panel__button"
            >
              {status === 'asking' ? 'Asking…' : 'Ask'}
            </button>
          </form>

          {status === 'error' && (
            <p className="advisor-panel__error" role="alert">{errorMessage}</p>
          )}

          {history.length > 0 && (
            <div className="advisor-panel__history">
              {history.map((pair, i) => (
                <div className="advisor-panel__qa" key={i}>
                  <p className="advisor-panel__question">{pair.question}</p>
                  <div className="advisor-panel__answer">
                    <span className="advisor-panel__answer-icon" aria-hidden="true">✦</span>
                    <p>{pair.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
