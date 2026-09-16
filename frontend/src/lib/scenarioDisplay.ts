import type { Scenario } from './scenarioApi';

export const TYPE_LABELS: Record<string, string> = {
  'compound-interest': 'Compound interest',
  sip: 'SIP',
  loan: 'Loan / EMI',
  retirement: 'Retirement',
};

export function formatRupees(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

/** The single headline number for a scenario card — differs per type
 * since the calculation engine returns different result shapes. */
export function headlineValue(scenario: Scenario): unknown {
  const result = scenario.result as Record<string, unknown>;
  switch (scenario.type) {
    case 'loan':
      return result.monthlyEmi;
    case 'retirement':
      return result.corpusAtRetirement;
    default:
      return result.finalAmount;
  }
}

/** Which field in yearlyBreakdown represents "the line to chart" —
 * growing balance for everything except Loan, which charts a
 * declining remaining balance instead. */
export function chartDataKey(type: Scenario['type']): string {
  return type === 'loan' ? 'remainingBalance' : 'balance';
}
