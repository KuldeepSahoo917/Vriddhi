import { useState } from 'react';
import { SliderField } from '../../components/SliderField';
import { GrowthChart } from '../../components/GrowthChart';
import { LedgerRow } from '../../components/LedgerRow';
import { StampBadge } from '../../components/StampBadge';
import { LedgerSkeleton, LedgerErrorState } from '../../components/LedgerStates';
import { SaveScenarioBar } from '../../components/SaveScenarioBar';
import { AdvisorPanel } from '../../components/AdvisorPanel';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useLiveCalculation } from '../../lib/useLiveCalculation';
import { fetchCompoundInterest } from '../../lib/api';

const COMPOUNDING_OPTIONS = [
  { label: 'Annually', value: 1 },
  { label: 'Monthly', value: 12 },
];

function numOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export interface CompoundInterestCalculatorProps {
  initialInput?: Record<string, unknown>;
  existingScenarioId?: string;
  existingLabel?: string;
}

export function CompoundInterestCalculator({
  initialInput,
  existingScenarioId,
  existingLabel,
}: CompoundInterestCalculatorProps) {
  const [principal, setPrincipal] = useState(
    numOr(initialInput?.principal, 100000),
  );
  const [rate, setRate] = useState(numOr(initialInput?.annualRatePercent, 9));
  const [years, setYears] = useState(numOr(initialInput?.years, 15));
  const [compoundingsPerYear, setCompoundingsPerYear] = useState(
    numOr(initialInput?.compoundingsPerYear, 1),
  );

  const debouncedPrincipal = useDebouncedValue(principal, 400);
  const debouncedRate = useDebouncedValue(rate, 400);
  const debouncedYears = useDebouncedValue(years, 400);

  const { result, status, errorMessage, retry } = useLiveCalculation(
    () =>
      fetchCompoundInterest({
        principal: debouncedPrincipal,
        annualRatePercent: debouncedRate,
        years: debouncedYears,
        compoundingsPerYear,
      }),
    [debouncedPrincipal, debouncedRate, debouncedYears, compoundingsPerYear],
  );

  const growthMultiple = result
    ? (result.finalAmount / result.totalDeposited).toFixed(1)
    : null;

  return (
    <>
      <div className="calculator-page__grid">
        <div>
          <div className="calculator-page__field">
            <label className="calculator-page__field-label" htmlFor="ci-principal">Principal amount</label>
            <input
              id="ci-principal"
              type="text"
              inputMode="numeric"
              value={principal.toLocaleString('en-IN')}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setPrincipal(raw ? Number(raw) : 0);
              }}
            />
          </div>

          <SliderField label="Annual rate" value={rate} min={1} max={20} unit="%" onChange={setRate} />
          <SliderField label="Years" value={years} min={1} max={40} onChange={setYears} />

          <div className="calculator-page__field">
            <label className="calculator-page__field-label" htmlFor="ci-compounding">Compounding</label>
            <select
              id="ci-compounding"
              value={compoundingsPerYear}
              onChange={(e) => setCompoundingsPerYear(Number(e.target.value))}
            >
              {COMPOUNDING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="calculator-page__result">
          {status === 'error' && <LedgerErrorState message={errorMessage} onRetry={retry} />}
          {status === 'loading' && !result && <LedgerSkeleton rows={3} />}

          {result && (
            <>
              <p className="calculator-page__result-label">Final amount</p>
              <p className="calculator-page__result-value mono">
                ₹{result.finalAmount.toLocaleString('en-IN')}
              </p>

              <GrowthChart data={result.yearlyBreakdown as unknown as Record<string, number>[]} dataKey="balance" />

              <div className="calculator-page__breakdown mono">
                <div className="calculator-page__breakdown-row">
                  <span>Deposited</span>
                  <span>₹{result.totalDeposited.toLocaleString('en-IN')}</span>
                </div>
                <div className="calculator-page__breakdown-row">
                  <span>Interest earned</span>
                  <span>₹{result.totalInterest.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {growthMultiple && (
                <div className="calculator-page__stamp">
                  <StampBadge label={`${growthMultiple}×`} sublabel="GROWTH" status="reached" rotate={10} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SaveScenarioBar
        type="compound-interest"
        existingScenarioId={existingScenarioId}
        existingLabel={existingLabel}
        input={{
          principal: debouncedPrincipal,
          annualRatePercent: debouncedRate,
          years: debouncedYears,
          compoundingsPerYear,
        }}
        result={result as unknown as Record<string, unknown> | null}
      />

      <AdvisorPanel
        scenarioType="compound-interest"
        input={{
          principal: debouncedPrincipal,
          annualRatePercent: debouncedRate,
          years: debouncedYears,
          compoundingsPerYear,
        }}
        result={result as unknown as Record<string, unknown> | null}
      />

      {result && (
        <div className="calculator-page__ledger">
          <LedgerRow
            variant="header"
            columns={[
              { key: 'y', value: 'Year' },
              { key: 'd', value: 'Deposited', align: 'right' },
              { key: 'i', value: 'Interest', align: 'right' },
              { key: 'b', value: 'Balance', align: 'right' },
            ]}
          />
          {result.yearlyBreakdown.map((entry, i) => (
            <LedgerRow
              key={entry.year}
              isLast={i === result.yearlyBreakdown.length - 1}
              columns={[
                { key: 'y', value: String(entry.year).padStart(2, '0') },
                { key: 'd', value: `₹${entry.deposited.toLocaleString('en-IN')}`, align: 'right' },
                { key: 'i', value: `₹${entry.interestEarned.toLocaleString('en-IN')}`, align: 'right' },
                { key: 'b', value: `₹${entry.balance.toLocaleString('en-IN')}`, align: 'right', emphasize: true },
              ]}
            />
          ))}
        </div>
      )}
    </>
  );
}
