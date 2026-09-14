import { describe, it, expect } from 'vitest';
import {
  calculateCompoundInterest,
  calculateSip,
  calculateLoan,
  calculateRetirementCorpus,
} from '../services/calculations.js';

describe('calculateCompoundInterest', () => {
  it('matches the standard compound interest formula for a known case', () => {
    // A = P(1 + r/n)^(nt) => 1,00,000 * (1.09)^1 = 1,09,000 after 1 year, annual compounding
    const result = calculateCompoundInterest({
      principal: 100000,
      annualRatePercent: 9,
      years: 1,
      compoundingsPerYear: 1,
    });
    expect(result.finalAmount).toBe(109000);
    expect(result.totalDeposited).toBe(100000);
    expect(result.totalInterest).toBe(9000);
  });

  it('produces one yearly breakdown entry per year, in order', () => {
    const result = calculateCompoundInterest({
      principal: 50000,
      annualRatePercent: 8,
      years: 5,
      compoundingsPerYear: 1,
    });
    expect(result.yearlyBreakdown).toHaveLength(5);
    expect(result.yearlyBreakdown.map((e) => e.year)).toEqual([1, 2, 3, 4, 5]);
    // balance should be strictly increasing
    for (let i = 1; i < result.yearlyBreakdown.length; i++) {
      expect(result.yearlyBreakdown[i]!.balance).toBeGreaterThan(
        result.yearlyBreakdown[i - 1]!.balance,
      );
    }
  });

  it('monthly compounding yields more than annual compounding at the same nominal rate', () => {
    const annual = calculateCompoundInterest({
      principal: 100000,
      annualRatePercent: 10,
      years: 10,
      compoundingsPerYear: 1,
    });
    const monthly = calculateCompoundInterest({
      principal: 100000,
      annualRatePercent: 10,
      years: 10,
      compoundingsPerYear: 12,
    });
    expect(monthly.finalAmount).toBeGreaterThan(annual.finalAmount);
  });

  it('handles zero interest rate without throwing (balance stays flat)', () => {
    const result = calculateCompoundInterest({
      principal: 10000,
      annualRatePercent: 0,
      years: 3,
      compoundingsPerYear: 1,
    });
    expect(result.finalAmount).toBe(10000);
    expect(result.totalInterest).toBe(0);
  });
});

describe('calculateSip', () => {
  it('total deposited equals monthlyContribution * months for a flat SIP', () => {
    const result = calculateSip({
      monthlyContribution: 5000,
      annualRatePercent: 12,
      years: 10,
      annualStepUpPercent: 0,
    });
    expect(result.totalDeposited).toBe(5000 * 12 * 10);
  });

  it('a step-up SIP deposits more than a flat SIP over the same period', () => {
    const flat = calculateSip({
      monthlyContribution: 5000,
      annualRatePercent: 12,
      years: 10,
    });
    const steppedUp = calculateSip({
      monthlyContribution: 5000,
      annualRatePercent: 12,
      years: 10,
      annualStepUpPercent: 10,
    });
    expect(steppedUp.totalDeposited).toBeGreaterThan(flat.totalDeposited);
    expect(steppedUp.finalAmount).toBeGreaterThan(flat.finalAmount);
  });

  it('yearly breakdown balance is monotonically increasing', () => {
    const result = calculateSip({
      monthlyContribution: 3000,
      annualRatePercent: 9,
      years: 6,
    });
    for (let i = 1; i < result.yearlyBreakdown.length; i++) {
      expect(result.yearlyBreakdown[i]!.balance).toBeGreaterThan(
        result.yearlyBreakdown[i - 1]!.balance,
      );
    }
  });
});

describe('calculateLoan', () => {
  it('computes a known EMI correctly (₹10L, 10%, 10yr ≈ ₹13,215/mo)', () => {
    const result = calculateLoan({
      principal: 1000000,
      annualRatePercent: 10,
      years: 10,
    });
    // Standard EMI formula result for these inputs, rounded to nearest rupee
    expect(result.monthlyEmi).toBeGreaterThanOrEqual(13213);
    expect(result.monthlyEmi).toBeLessThanOrEqual(13217);
  });

  it('remaining balance reaches ~0 by the final year', () => {
    const result = calculateLoan({
      principal: 500000,
      annualRatePercent: 8.5,
      years: 5,
    });
    const lastEntry = result.yearlyBreakdown[result.yearlyBreakdown.length - 1]!;
    expect(lastEntry.remainingBalance).toBeLessThan(1); // rounding dust only
  });

  it('total interest paid is totalPaid minus principal', () => {
    const result = calculateLoan({
      principal: 200000,
      annualRatePercent: 9,
      years: 3,
    });
    expect(result.totalInterest).toBe(result.totalPaid - 200000);
  });

  it('handles a zero interest rate loan (pure principal division)', () => {
    const result = calculateLoan({
      principal: 120000,
      annualRatePercent: 0,
      years: 1,
    });
    expect(result.monthlyEmi).toBe(10000);
    expect(result.totalInterest).toBe(0);
  });
});

describe('calculateRetirementCorpus', () => {
  it('derives years correctly from currentAge/retirementAge and matches SIP engine', () => {
    const retirement = calculateRetirementCorpus({
      currentAge: 25,
      retirementAge: 35,
      monthlyContribution: 5000,
      annualRatePercent: 12,
    });
    const equivalentSip = calculateSip({
      monthlyContribution: 5000,
      annualRatePercent: 12,
      years: 10,
    });
    expect(retirement.corpusAtRetirement).toBe(equivalentSip.finalAmount);
    expect(retirement.yearlyBreakdown).toHaveLength(10);
  });
});
