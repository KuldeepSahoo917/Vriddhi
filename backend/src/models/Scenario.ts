import { Schema, model, Types, type InferSchemaType } from 'mongoose';

export const SCENARIO_TYPES = [
  'compound-interest',
  'sip',
  'loan',
  'retirement',
] as const;
export type ScenarioType = (typeof SCENARIO_TYPES)[number];

const scenarioSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: SCENARIO_TYPES, required: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    // Store the exact input and the exact computed result at save time.
    // We do NOT recompute from input alone later — the saved result is
    // the source of truth, so old scenarios don't silently change if
    // the calculation engine's formulas are ever revised.
    input: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export type ScenarioDocument = InferSchemaType<typeof scenarioSchema> & {
  _id: Types.ObjectId;
};
export const Scenario = model('Scenario', scenarioSchema);
