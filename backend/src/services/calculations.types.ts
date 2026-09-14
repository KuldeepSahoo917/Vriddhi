/**
 * Shared calculation types.
 * These describe pure data — no framework/DB concerns here.
 * Frontend should mirror this shape via a shared types package later.
 */

export interface YearlyLedgerEntry {
  year: number;
  deposited: number; // cumulative principal deposited by this year
  interestEarned: number; // cumulative interest earned by this year
  balance: number; // deposited + interestEarned
}

export interface CompoundInterestInput {
  principal: number; // one-time deposit
  annualRatePercent: number; // e.g. 9 for 9%
  years: number;
  compoundingsPerYear: number; // 1 = annually, 12 = monthly
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
  /** Percentage step-up applied to the monthly contribution every 12 months. 0 = flat SIP. */
  annualStepUpPercent?: number | undefined;
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
  principalPaid: number; // this year
  interestPaid: number; // this year
  remainingBalance: number; // at year end
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
  annualStepUpPercent?: number | undefined;
}

export interface RetirementResult {
  corpusAtRetirement: number;
  totalDeposited: number;
  totalInterest: number;
  yearlyBreakdown: YearlyLedgerEntry[];
}
