import type {
  CompoundInterestInput,
  CompoundInterestResult,
  SipInput,
  SipResult,
  LoanInput,
  LoanResult,
  LoanYearlyEntry,
  RetirementInput,
  RetirementResult,
  YearlyLedgerEntry,
} from './calculations.types.js';

/**
 * Calculation engine — Vriddhi
 * -----------------------------
 * Every function here is pure: same input always produces the same
 * output, no I/O, no side effects. This is the ONLY place financial
 * math happens in the app. The frontend never recomputes these values,
 * and the AI advisor is only ever given the *output* of these
 * functions as context — it never does math on its own.
 *
 * Rounding: all currency values are rounded to the nearest rupee
 * at the point of output, to avoid floating point drift accumulating
 * across yearly breakdowns.
 */

function roundCurrency(value: number): number {
  return Math.round(value);
}

// ---------- Compound interest ----------

export function calculateCompoundInterest(
  input: CompoundInterestInput,
): CompoundInterestResult {
  const { principal, annualRatePercent, years, compoundingsPerYear } = input;
  const r = annualRatePercent / 100;
  const n = compoundingsPerYear;

  const yearlyBreakdown: YearlyLedgerEntry[] = [];

  for (let year = 1; year <= years; year++) {
    const balance = principal * Math.pow(1 + r / n, n * year);
    yearlyBreakdown.push({
      year,
      deposited: roundCurrency(principal),
      interestEarned: roundCurrency(balance - principal),
      balance: roundCurrency(balance),
    });
  }

  const last = yearlyBreakdown[yearlyBreakdown.length - 1];
  const finalAmount = last ? last.balance : principal;

  return {
    finalAmount,
    totalDeposited: roundCurrency(principal),
    totalInterest: roundCurrency(finalAmount - principal),
    yearlyBreakdown,
  };
}

// ---------- SIP (systematic investment plan) ----------

export function calculateSip(input: SipInput): SipResult {
  const {
    monthlyContribution,
    annualRatePercent,
    years,
    annualStepUpPercent = 0,
  } = input;

  const monthlyRate = annualRatePercent / 100 / 12;
  const yearlyBreakdown: YearlyLedgerEntry[] = [];

  let balance = 0;
  let cumulativeDeposited = 0;
  let currentMonthlyContribution = monthlyContribution;

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) + currentMonthlyContribution;
      cumulativeDeposited += currentMonthlyContribution;
    }

    yearlyBreakdown.push({
      year,
      deposited: roundCurrency(cumulativeDeposited),
      interestEarned: roundCurrency(balance - cumulativeDeposited),
      balance: roundCurrency(balance),
    });

    // Apply step-up for the next year's contributions
    currentMonthlyContribution =
      currentMonthlyContribution * (1 + annualStepUpPercent / 100);
  }

  const last = yearlyBreakdown[yearlyBreakdown.length - 1];
  const finalAmount = last ? last.balance : 0;
  const totalDeposited = last ? last.deposited : 0;

  return {
    finalAmount,
    totalDeposited,
    totalInterest: roundCurrency(finalAmount - totalDeposited),
    yearlyBreakdown,
  };
}

// ---------- Loan / EMI ----------

export function calculateLoan(input: LoanInput): LoanResult {
  const { principal, annualRatePercent, years } = input;
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = years * 12;

  const emi =
    monthlyRate === 0
      ? principal / totalMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

  let remainingBalance = principal;
  const yearlyBreakdown: LoanYearlyEntry[] = [];

  for (let year = 1; year <= years; year++) {
    let yearPrincipalPaid = 0;
    let yearInterestPaid = 0;

    for (let month = 1; month <= 12; month++) {
      const interestForMonth = remainingBalance * monthlyRate;
      const principalForMonth = emi - interestForMonth;

      remainingBalance -= principalForMonth;
      yearPrincipalPaid += principalForMonth;
      yearInterestPaid += interestForMonth;
    }

    yearlyBreakdown.push({
      year,
      principalPaid: roundCurrency(yearPrincipalPaid),
      interestPaid: roundCurrency(yearInterestPaid),
      remainingBalance: roundCurrency(Math.max(remainingBalance, 0)),
    });
  }

  const totalPaid = emi * totalMonths;

  return {
    monthlyEmi: roundCurrency(emi),
    totalPaid: roundCurrency(totalPaid),
    totalInterest: roundCurrency(totalPaid - principal),
    yearlyBreakdown,
  };
}

// ---------- Retirement corpus ----------

export function calculateRetirementCorpus(
  input: RetirementInput,
): RetirementResult {
  const {
    currentAge,
    retirementAge,
    monthlyContribution,
    annualRatePercent,
    annualStepUpPercent = 0,
  } = input;

  const years = retirementAge - currentAge;

  // Retirement corpus is mathematically the same engine as SIP —
  // reuse it rather than duplicating the compounding loop.
  const sipResult = calculateSip({
    monthlyContribution,
    annualRatePercent,
    years,
    annualStepUpPercent,
  });

  return {
    corpusAtRetirement: sipResult.finalAmount,
    totalDeposited: sipResult.totalDeposited,
    totalInterest: sipResult.totalInterest,
    yearlyBreakdown: sipResult.yearlyBreakdown,
  };
}
