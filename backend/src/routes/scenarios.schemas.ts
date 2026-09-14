import { z } from 'zod';
import { SCENARIO_TYPES } from '../models/Scenario.js';

export const createScenarioSchema = z.object({
  type: z.enum(SCENARIO_TYPES),
  label: z.string().trim().min(1, 'Give this plan a name').max(80),
  input: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
});
