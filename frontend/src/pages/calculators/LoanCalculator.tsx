import { useState } from 'react';
import { SliderField } from '../../components/SliderField';
import { GrowthChart } from '../../components/GrowthChart';
import { LedgerRow } from '../../components/LedgerRow';
import { LedgerSkeleton, LedgerErrorState } from '../../components/LedgerStates';
import { SaveScenarioBar } from '../../components/SaveScenarioBar';
import { AdvisorPanel } from '../../components/AdvisorPanel';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useLiveCalculation } from '../../lib/useLiveCalculation';
import { fetchLoan } from '../../lib/api';

function numOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export interface LoanCalculatorProps {
  initialInput?: Record<string, unknown>;
  existingScenarioId?: string;
  existingLabel?: string;
}

export function LoanCalculator({
  initialInput,
  existingScenarioId,
  existingLabel,
}: LoanCalculatorProps) {
  const [principal, setPrincipal] = useState(numOr(initialInput?.principal, 2000000));
  const [rate, setRate] = useState(numOr(initialInput?.annualRatePercent, 9));
  const [years, setYears] = useState(numOr(initialInput?.years, 20));

  const debouncedPrincipal = useDebouncedValue(principal, 400);
  const debouncedRate = useDebouncedValue(rate, 400);
  const debouncedYears = useDebouncedValue(years, 400);

  const { result, status, errorMessage, retry } = useLiveCalculation(
    () =>
      fetchLoan({
        principal: debouncedPrincipal,
        annualRatePercent: debouncedRate,
        years: debouncedYears,
      }),
    [debouncedPrincipal, debouncedRate, debouncedYears],
  );

  return (
    <>
      <div className="calculator-page__grid">
        <div>
          <div className="calculator-page__field">
            <label className="calculator-page__field-label" htmlFor="loan-principal">Loan amount</label>
            <input
              id="loan-principal"
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
          <SliderField label="Years" value={years} min={1} max={30} onChange={setYears} />
        </div>

        <div className="calculator-page__result">
          {status === 'error' && <LedgerErrorState message={errorMessage} onRetry={retry} />}
          {status === 'loading' && !result && <LedgerSkeleton rows={3} />}

          {result && (
            <>
              <p className="calculator-page__result-label">Monthly EMI</p>
              <p className="calculator-page__result-value mono">
                ₹{result.monthlyEmi.toLocaleString('en-IN')}
              </p>

              <GrowthChart
                data={result.yearlyBreakdown as unknown as Record<string, number>[]}
                dataKey="remainingBalance"
              />

              <div className="calculator-page__breakdown mono">
                <div className="calculator-page__breakdown-row">
                  <span>Total paid</span>
                  <span>₹{result.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="calculator-page__breakdown-row">
                  <span>Total interest</span>
                  <span>₹{result.totalInterest.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <SaveScenarioBar
        type="loan"
        existingScenarioId={existingScenarioId}
        existingLabel={existingLabel}
        input={{
          principal: debouncedPrincipal,
          annualRatePercent: debouncedRate,
          years: debouncedYears,
        }}
        result={result as unknown as Record<string, unknown> | null}
        placeholder="Name this loan, e.g. Home loan"
      />

      <AdvisorPanel
        scenarioType="loan"
        input={{
          principal: debouncedPrincipal,
          annualRatePercent: debouncedRate,
          years: debouncedYears,
        }}
        result={result as unknown as Record<string, unknown> | null}
      />

      {result && (
        <div className="calculator-page__ledger">
          <LedgerRow
            variant="header"
            columns={[
              { key: 'y', value: 'Year' },
              { key: 'p', value: 'Principal paid', align: 'right' },
              { key: 'i', value: 'Interest paid', align: 'right' },
              { key: 'b', value: 'Remaining', align: 'right' },
            ]}
          />
          {result.yearlyBreakdown.map((entry, i) => (
            <LedgerRow
              key={entry.year}
              isLast={i === result.yearlyBreakdown.length - 1}
              columns={[
                { key: 'y', value: String(entry.year).padStart(2, '0') },
                { key: 'p', value: `₹${entry.principalPaid.toLocaleString('en-IN')}`, align: 'right' },
                { key: 'i', value: `₹${entry.interestPaid.toLocaleString('en-IN')}`, align: 'right' },
                { key: 'b', value: `₹${entry.remainingBalance.toLocaleString('en-IN')}`, align: 'right', emphasize: true },
              ]}
            />
          ))}
        </div>
      )}
    </>
  );
}
