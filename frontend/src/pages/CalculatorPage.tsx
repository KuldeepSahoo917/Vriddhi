import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CompoundInterestCalculator } from './calculators/CompoundInterestCalculator';
import { SipCalculator } from './calculators/SipCalculator';
import { LoanCalculator } from './calculators/LoanCalculator';
import { RetirementCalculator } from './calculators/RetirementCalculator';
import type { ScenarioType } from '../lib/types';
import './CalculatorPage.css';

const TABS = [
  { key: 'compound-interest', label: 'Compound interest' },
  { key: 'sip', label: 'SIP' },
  { key: 'loan', label: 'Loan / EMI' },
  { key: 'retirement', label: 'Retirement' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface ReopenState {
  scenarioType: ScenarioType;
  input?: Record<string, unknown>;
  scenarioId?: string;
  label?: string;
}

export function CalculatorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const incoming = location.state as ReopenState | undefined;
  const [activeTab, setActiveTab] = useState<TabKey>(
    (incoming?.scenarioType as TabKey) ?? 'compound-interest',
  );
  // Keep the loaded scenario around for this mount only — once
  // consumed, clear router state so switching tabs away and back
  // doesn't keep re-applying a stale reopened scenario.
  const [reopened] = useState<ReopenState | undefined>(incoming);

  useEffect(() => {
    if (incoming) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reopenProps(tab: TabKey) {
    if (tab !== reopened?.scenarioType) return {};
    return {
      initialInput: reopened.input,
      existingScenarioId: reopened.scenarioId,
      existingLabel: reopened.label,
    };
  }

  return (
    <div className="calculator-page">
      <div className="calculator-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`calculator-page__tab ${
              activeTab === tab.key ? 'calculator-page__tab--active' : ''
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'compound-interest' && (
        <CompoundInterestCalculator {...reopenProps('compound-interest')} />
      )}
      {activeTab === 'sip' && <SipCalculator {...reopenProps('sip')} />}
      {activeTab === 'loan' && <LoanCalculator {...reopenProps('loan')} />}
      {activeTab === 'retirement' && (
        <RetirementCalculator {...reopenProps('retirement')} />
      )}
    </div>
  );
}
