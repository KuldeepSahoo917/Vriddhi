import { useEffect, useState } from 'react';
import { StampBadge } from '../components/StampBadge';
import { ComparisonChart } from '../components/ComparisonChart';
import { LedgerSkeleton, LedgerErrorState, LedgerEmptyState } from '../components/LedgerStates';
import { listScenarios, type Scenario } from '../lib/scenarioApi';
import { ScenarioApiError } from '../lib/scenarioApi';
import { TYPE_LABELS, formatRupees, headlineValue, chartDataKey } from '../lib/scenarioDisplay';
import './ComparePage.css';

export function ComparePage() {
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  function load() {
    setStatus('loading');
    listScenarios()
      .then(({ scenarios }) => {
        setScenarios(scenarios);
        if (scenarios.length >= 2) {
          setIdA((prev) => prev || scenarios[0]!._id);
          setIdB((prev) => prev || scenarios[1]!._id);
        }
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

  const scenarioA = scenarios?.find((s) => s._id === idA);
  const scenarioB = scenarios?.find((s) => s._id === idB);

  const chartData = (() => {
    if (!scenarioA || !scenarioB) return [];
    const breakdownA = (scenarioA.result as Record<string, unknown>)
      .yearlyBreakdown as Array<Record<string, unknown>> | undefined;
    const breakdownB = (scenarioB.result as Record<string, unknown>)
      .yearlyBreakdown as Array<Record<string, unknown>> | undefined;
    if (!breakdownA || !breakdownB) return [];

    const keyA = chartDataKey(scenarioA.type);
    const keyB = chartDataKey(scenarioB.type);
    const maxYears = Math.max(breakdownA.length, breakdownB.length);

    return Array.from({ length: maxYears }, (_, i) => ({
      year: i + 1,
      planA: breakdownA[i] ? Number(breakdownA[i]![keyA]) : undefined,
      planB: breakdownB[i] ? Number(breakdownB[i]![keyB]) : undefined,
    }));
  })();

  const deltaText = (() => {
    if (!scenarioA || !scenarioB) return null;
    const valA = Number(headlineValue(scenarioA));
    const valB = Number(headlineValue(scenarioB));
    if (!Number.isFinite(valA) || !Number.isFinite(valB)) return null;
    const diff = valB - valA;
    const sign = diff >= 0 ? '+' : '−';
    return `${sign}${formatRupees(Math.abs(diff))}`;
  })();

  return (
    <div className="compare-page">
      <h2 className="compare-page__title">Compare plans</h2>

      {status === 'loading' && <LedgerSkeleton rows={3} />}
      {status === 'error' && <LedgerErrorState message={errorMessage} onRetry={load} />}
      {status === 'idle' && scenarios && scenarios.length < 2 && (
        <LedgerEmptyState
          title="Not enough plans yet"
          message="Save at least two plans to compare them side by side."
        />
      )}

      {status === 'idle' && scenarios && scenarios.length >= 2 && (
        <>
          <div className="compare-page__pickers">
            <select value={idA} onChange={(e) => setIdA(e.target.value)} aria-label="First plan to compare">
              {scenarios.map((s) => (
                <option key={s._id} value={s._id} disabled={s._id === idB}>
                  {s.label} · {TYPE_LABELS[s.type]}
                </option>
              ))}
            </select>
            <span className="compare-page__vs">vs</span>
            <select value={idB} onChange={(e) => setIdB(e.target.value)} aria-label="Second plan to compare">
              {scenarios.map((s) => (
                <option key={s._id} value={s._id} disabled={s._id === idA}>
                  {s.label} · {TYPE_LABELS[s.type]}
                </option>
              ))}
            </select>
          </div>

          {scenarioA && scenarioB && (
            <>
              <div className="compare-page__cards">
                <div className="compare-page__card">
                  <p className="compare-page__card-label">{scenarioA.label}</p>
                  <p className="compare-page__card-type">{TYPE_LABELS[scenarioA.type]}</p>
                  <p className="compare-page__card-value mono">
                    {formatRupees(headlineValue(scenarioA))}
                  </p>
                </div>

                <div className="compare-page__delta">
                  {deltaText && (
                    <StampBadge label={deltaText} sublabel="DIFF" status="reached" rotate={0} />
                  )}
                </div>

                <div className="compare-page__card">
                  <p className="compare-page__card-label">{scenarioB.label}</p>
                  <p className="compare-page__card-type">{TYPE_LABELS[scenarioB.type]}</p>
                  <p className="compare-page__card-value mono">
                    {formatRupees(headlineValue(scenarioB))}
                  </p>
                </div>
              </div>

              {chartData.length > 0 && (
                <ComparisonChart
                  data={chartData}
                  labelA={scenarioA.label}
                  labelB={scenarioB.label}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
