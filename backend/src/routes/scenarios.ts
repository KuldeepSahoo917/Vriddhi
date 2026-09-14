import { Router, type Response } from 'express';
import { Scenario } from '../models/Scenario.js';
import { createScenarioSchema } from './scenarios.schemas.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const scenariosRouter = Router();

// Every route here requires auth — a user can only ever see/modify
// their own scenarios (enforced via userId in every query, never
// trusting an id from the request body).
scenariosRouter.use(requireAuth);

scenariosRouter.get('/', async (req: AuthedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Sign in to continue.' });
  const scenarios = await Scenario.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json({ scenarios });
});

scenariosRouter.post('/', async (req: AuthedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Sign in to continue.' });
  const parsed = createScenarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const scenario = await Scenario.create({ ...parsed.data, userId: req.userId });
  res.status(201).json({ scenario });
});

scenariosRouter.patch('/:id', async (req: AuthedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Sign in to continue.' });
  const parsed = createScenarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const scenario = await Scenario.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { ...parsed.data },
    { new: true },
  );
  if (!scenario) {
    return res.status(404).json({ error: "This entry couldn't be found." });
  }
  res.json({ scenario });
});

scenariosRouter.delete('/:id', async (req: AuthedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Sign in to continue.' });
  const result = await Scenario.deleteOne({ _id: req.params.id, userId: req.userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "This entry couldn't be found." });
  }
  res.status(204).send();
});
