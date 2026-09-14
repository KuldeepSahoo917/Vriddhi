import { Router, type Response } from 'express';
import { askAdvisorSchema } from './advisor.schemas.js';
import { askAdvisor } from '../services/advisor.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const advisorRouter = Router();

// Signed-in only: this endpoint costs real money per call, so it
// piggybacks on our existing auth system rather than being open to
// anonymous traffic.
advisorRouter.use(requireAuth);

advisorRouter.post('/ask', async (req: AuthedRequest, res: Response) => {
  const parsed = askAdvisorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const answer = await askAdvisor(parsed.data);
    res.json({ answer });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Advisor request failed:', detail);
    res.status(502).json({ error: "The advisor couldn't respond right now. Try again." });
  }
});
