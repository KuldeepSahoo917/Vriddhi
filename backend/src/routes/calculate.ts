import { Router, type Request, type Response } from 'express';
import {
  calculateCompoundInterest,
  calculateSip,
  calculateLoan,
  calculateRetirementCorpus,
} from '../services/calculations.js';
import {
  compoundInterestSchema,
  sipSchema,
  loanSchema,
  retirementSchema,
} from './calculate.schemas.js';

export const calculateRouter = Router();

/**
 * Every route follows the same shape: validate with zod -> call the
 * pure calculation function -> return its result untouched. Routes
 * never do math themselves. On validation failure we return the
 * flattened zod error so the frontend can show inline field errors.
 */

calculateRouter.post('/compound-interest', (req: Request, res: Response) => {
  const parsed = compoundInterestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json(calculateCompoundInterest(parsed.data));
});

calculateRouter.post('/sip', (req: Request, res: Response) => {
  const parsed = sipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json(calculateSip(parsed.data));
});

calculateRouter.post('/loan', (req: Request, res: Response) => {
  const parsed = loanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json(calculateLoan(parsed.data));
});

calculateRouter.post('/retirement', (req: Request, res: Response) => {
  const parsed = retirementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json(calculateRetirementCorpus(parsed.data));
});
