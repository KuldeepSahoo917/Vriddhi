export type ScenarioType = 'compound-interest' | 'sip' | 'loan' | 'retirement';

export interface YearlyLedgerEntry {
  year: number;
  deposited: number;
  interestEarned: number;
  balance: number;
}

export interface CompoundInterestInput {
  principal: number;
  annualRatePercent: number;
  years: number;
  compoundingsPerYear: number;
}

export interface CompoundInterestResult {
  finalAmount: number;
  totalDeposited: number;
  totalInterest: number;
  yearlyBreakdown: YearlyLedgerEntry[];
}

export interface SipInput {
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  annualStepUpPercent?: number;
}

export interface SipResult {
  finalAmount: number;
  totalDeposited: number;
  totalInterest: number;
  yearlyBreakdown: YearlyLedgerEntry[];
}

export interface LoanInput {
  principal: number;
  annualRatePercent: number;
  years: number;
}

export interface LoanYearlyEntry {
  year: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface LoanResult {
  monthlyEmi: number;
  totalPaid: number;
  totalInterest: number;
  yearlyBreakdown: LoanYearlyEntry[];
}

export interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  monthlyContribution: number;
  annualRatePercent: number;
  annualStepUpPercent?: number;
}

export interface RetirementResult {
  corpusAtRetirement: number;
  totalDeposited: number;
  totalInterest: number;
  yearlyBreakdown: YearlyLedgerEntry[];
}
