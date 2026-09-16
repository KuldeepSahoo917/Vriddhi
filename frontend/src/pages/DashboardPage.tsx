import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StampBadge } from '../components/StampBadge';
import {
  LedgerSkeleton,
  LedgerEmptyState,
  LedgerErrorState,
} from '../components/LedgerStates';
import { listScenarios, deleteScenario, type Scenario } from '../lib/scenarioApi';
import { ScenarioApiError } from '../lib/scenarioApi';
import { TYPE_LABELS, formatRupees, headlineValue } from '../lib/scenarioDisplay';
import './DashboardPage.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  function load() {
    setStatus('loading');
    listScenarios()
      .then(({ scenarios }) => {
        setScenarios(scenarios);
        setStatus('idle');
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof ScenarioApiError ? err.message : 'Something went wrong.',
        );
        setStatus('error');
      });
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    // Optimistic removal — the whole point of the save/load flow is to
    // feel instant, not to make the user wait on a network round trip.
    const previous = scenarios;
    setScenarios((s) => s?.filter((sc) => sc._id !== id) ?? null);
    try {
      await deleteScenario(id);
    } catch {
      setScenarios(previous ?? null); // revert on failure
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h2 className="dashboard-page__title">Your plans</h2>
        {scenarios && scenarios.length >= 2 && (
          <Link to="/compare" className="dashboard-page__compare-link">
            Compare plans
          </Link>
        )}
      </div>

      {status === 'loading' && <LedgerSkeleton rows={3} />}
      {status === 'error' && <LedgerErrorState message={errorMessage} onRetry={load} />}
      {status === 'idle' && scenarios?.length === 0 && (
        <LedgerEmptyState message="Save a scenario from any calculator to see it here." />
      )}

      {status === 'idle' && scenarios && scenarios.length > 0 && (
        <div className="dashboard-page__grid">
          {scenarios.map((s) => (
            <div
              className="dashboard-page__card dashboard-page__card--clickable"
              key={s._id}
              role="button"
              tabIndex={0}
              onClick={() =>
                navigate('/calculator', { state: { scenarioType: s.type, input: s.input, scenarioId: s._id, label: s.label } })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/calculator', { state: { scenarioType: s.type, input: s.input, scenarioId: s._id, label: s.label } });
                }
              }}
            >
              <div className="dashboard-page__card-top">
                <StampBadge label={TYPE_LABELS[s.type]?.slice(0, 6).toUpperCase() ?? 'PLAN'} status="reached" rotate={-4} size="sm" />
                <button
                  className="dashboard-page__delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s._id);
                  }}
                  aria-label={`Delete ${s.label}`}
                >
                  ×
                </button>
              </div>
              <p className="dashboard-page__card-label">{s.label}</p>
              <p className="dashboard-page__card-type">{TYPE_LABELS[s.type] ?? s.type}</p>
              <p className="dashboard-page__card-value mono">
                {formatRupees(headlineValue(s))}
                {s.type === 'loan' && <span className="dashboard-page__card-suffix">/mo</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
