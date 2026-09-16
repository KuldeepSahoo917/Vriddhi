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
import { fetchSip } from '../../lib/api';

function numOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export interface SipCalculatorProps {
  initialInput?: Record<string, unknown>;
  existingScenarioId?: string;
  existingLabel?: string;
}

export function SipCalculator({
  initialInput,
  existingScenarioId,
  existingLabel,
}: SipCalculatorProps) {
  const [monthlyContribution, setMonthlyContribution] = useState(
    numOr(initialInput?.monthlyContribution, 5000),
  );
  const [rate, setRate] = useState(numOr(initialInput?.annualRatePercent, 12));
  const [years, setYears] = useState(numOr(initialInput?.years, 15));
  const [stepUp, setStepUp] = useState(numOr(initialInput?.annualStepUpPercent, 0));

  const debouncedContribution = useDebouncedValue(monthlyContribution, 400);
  const debouncedRate = useDebouncedValue(rate, 400);
  const debouncedYears = useDebouncedValue(years, 400);
  const debouncedStepUp = useDebouncedValue(stepUp, 400);

  const { result, status, errorMessage, retry } = useLiveCalculation(
    () =>
      fetchSip({
        monthlyContribution: debouncedContribution,
        annualRatePercent: debouncedRate,
        years: debouncedYears,
        annualStepUpPercent: debouncedStepUp,
      }),
    [debouncedContribution, debouncedRate, debouncedYears, debouncedStepUp],
  );

  const growthMultiple = result
    ? (result.finalAmount / result.totalDeposited).toFixed(1)
    : null;

  return (
    <>
      <div className="calculator-page__grid">
        <div>
          <div className="calculator-page__field">
            <label className="calculator-page__field-label" htmlFor="sip-contribution">Monthly contribution</label>
            <input
              id="sip-contribution"
              type="text"
              inputMode="numeric"
              value={monthlyContribution.toLocaleString('en-IN')}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setMonthlyContribution(raw ? Number(raw) : 0);
              }}
            />
          </div>

          <SliderField label="Annual rate" value={rate} min={1} max={20} unit="%" onChange={setRate} />
          <SliderField label="Years" value={years} min={1} max={40} onChange={setYears} />
          <SliderField
            label="Annual step-up"
            value={stepUp}
            min={0}
            max={25}
            unit="%"
            onChange={setStepUp}
          />
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
        type="sip"
        existingScenarioId={existingScenarioId}
        existingLabel={existingLabel}
        input={{
          monthlyContribution: debouncedContribution,
          annualRatePercent: debouncedRate,
          years: debouncedYears,
          annualStepUpPercent: debouncedStepUp,
        }}
        result={result as unknown as Record<string, unknown> | null}
      />

      <AdvisorPanel
        scenarioType="sip"
        input={{
          monthlyContribution: debouncedContribution,
          annualRatePercent: debouncedRate,
          years: debouncedYears,
          annualStepUpPercent: debouncedStepUp,
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
