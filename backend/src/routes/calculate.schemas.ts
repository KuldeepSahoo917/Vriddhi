import { z } from 'zod';

export const compoundInterestSchema = z.object({
  principal: z.number().positive().max(1_000_000_000),
  annualRatePercent: z.number().min(0).max(50),
  years: z.number().int().min(1).max(50),
  compoundingsPerYear: z.number().int().min(1).max(365),
});

export const sipSchema = z.object({
  monthlyContribution: z.number().positive().max(10_000_000),
  annualRatePercent: z.number().min(0).max(50),
  years: z.number().int().min(1).max(50),
  annualStepUpPercent: z.number().min(0).max(100).optional(),
});

export const loanSchema = z.object({
  principal: z.number().positive().max(1_000_000_000),
  annualRatePercent: z.number().min(0).max(50),
  years: z.number().int().min(1).max(40),
});

export const retirementSchema = z
  .object({
    currentAge: z.number().int().min(15).max(80),
    retirementAge: z.number().int().min(16).max(85),
    monthlyContribution: z.number().positive().max(10_000_000),
    annualRatePercent: z.number().min(0).max(50),
    annualStepUpPercent: z.number().min(0).max(100).optional(),
  })
  .refine((data) => data.retirementAge > data.currentAge, {
    message: 'retirementAge must be greater than currentAge',
    path: ['retirementAge'],
  });
