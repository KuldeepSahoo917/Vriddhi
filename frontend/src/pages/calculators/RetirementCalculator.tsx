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
import { fetchRetirement } from '../../lib/api';

function numOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export interface RetirementCalculatorProps {
  initialInput?: Record<string, unknown>;
  existingScenarioId?: string;
  existingLabel?: string;
}

export function RetirementCalculator({
  initialInput,
  existingScenarioId,
  existingLabel,
}: RetirementCalculatorProps) {
  const [currentAge, setCurrentAge] = useState(numOr(initialInput?.currentAge, 28));
  const [retirementAge, setRetirementAge] = useState(
    numOr(initialInput?.retirementAge, 60),
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    numOr(initialInput?.monthlyContribution, 10000),
  );
  const [rate, setRate] = useState(numOr(initialInput?.annualRatePercent, 11));
  const [stepUp, setStepUp] = useState(numOr(initialInput?.annualStepUpPercent, 0));

  const debouncedCurrentAge = useDebouncedValue(currentAge, 400);
  const debouncedRetirementAge = useDebouncedValue(retirementAge, 400);
  const debouncedContribution = useDebouncedValue(monthlyContribution, 400);
  const debouncedRate = useDebouncedValue(rate, 400);
  const debouncedStepUp = useDebouncedValue(stepUp, 400);

  const agesValid = debouncedRetirementAge > debouncedCurrentAge;

  const { result, status, errorMessage, retry } = useLiveCalculation(
    () =>
      agesValid
        ? fetchRetirement({
            currentAge: debouncedCurrentAge,
            retirementAge: debouncedRetirementAge,
            monthlyContribution: debouncedContribution,
            annualRatePercent: debouncedRate,
            annualStepUpPercent: debouncedStepUp,
          })
        : Promise.reject(new Error('Retirement age must be after current age.')),
    [debouncedCurrentAge, debouncedRetirementAge, debouncedContribution, debouncedRate, debouncedStepUp],
  );

  const growthMultiple = result
    ? (result.corpusAtRetirement / result.totalDeposited).toFixed(1)
    : null;

  return (
    <>
      <div className="calculator-page__grid">
        <div>
          <SliderField label="Current age" value={currentAge} min={18} max={65} onChange={setCurrentAge} />
          <SliderField label="Retirement age" value={retirementAge} min={30} max={75} onChange={setRetirementAge} />

          <div className="calculator-page__field">
            <label className="calculator-page__field-label" htmlFor="ret-contribution">Monthly contribution</label>
            <input
              id="ret-contribution"
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
          <SliderField label="Annual step-up" value={stepUp} min={0} max={25} unit="%" onChange={setStepUp} />
        </div>

        <div className="calculator-page__result">
          {!agesValid && (
            <LedgerErrorState message="Retirement age must be after current age." />
          )}
          {agesValid && status === 'error' && (
            <LedgerErrorState message={errorMessage} onRetry={retry} />
          )}
          {agesValid && status === 'loading' && !result && <LedgerSkeleton rows={3} />}

          {agesValid && result && (
            <>
              <p className="calculator-page__result-label">Corpus at retirement</p>
              <p className="calculator-page__result-value mono">
                ₹{result.corpusAtRetirement.toLocaleString('en-IN')}
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

      {agesValid && (
        <SaveScenarioBar
          type="retirement"
          existingScenarioId={existingScenarioId}
          existingLabel={existingLabel}
          input={{
            currentAge: debouncedCurrentAge,
            retirementAge: debouncedRetirementAge,
            monthlyContribution: debouncedContribution,
            annualRatePercent: debouncedRate,
            annualStepUpPercent: debouncedStepUp,
          }}
          result={result as unknown as Record<string, unknown> | null}
          placeholder="Name this plan, e.g. Retirement fund"
        />
      )}

      {agesValid && result && (
        <AdvisorPanel
          scenarioType="retirement"
          input={{
            currentAge: debouncedCurrentAge,
            retirementAge: debouncedRetirementAge,
            monthlyContribution: debouncedContribution,
            annualRatePercent: debouncedRate,
            annualStepUpPercent: debouncedStepUp,
          }}
          result={result as unknown as Record<string, unknown> | null}
        />
      )}

      {agesValid && result && (
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
