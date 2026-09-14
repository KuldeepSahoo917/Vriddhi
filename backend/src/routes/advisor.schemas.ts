import { z } from 'zod';
import { SCENARIO_TYPES } from '../models/Scenario.js';

export const askAdvisorSchema = z.object({
  scenarioType: z.enum(SCENARIO_TYPES),
  input: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
  question: z.string().trim().min(1, 'Ask something first').max(500),
});
