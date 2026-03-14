import { z } from 'zod';

// Option shape — each choice in a diagnostic step.
export const SimOptionSchema = z.object({
  label:   z.string().min(1),
  next:    z.string().min(1),
  correct: z.boolean().optional(),
});

// Step shape — one node in the branching diagnostic tree.
export const SimStepSchema = z.object({
  id:       z.string().min(1),
  prompt:   z.string().min(1),
  options:  z.array(SimOptionSchema),
  feedback: z.string().optional(),
});

// Top-level sim shape.
export const SimSchema = z.object({
  id:          z.string().regex(/^sim-\d{2}$/, 'id must match sim-NN'),
  title:       z.string().min(1),
  system:      z.string().min(1),
  complaint:   z.string().min(1),
  initialData: z.array(z.string()).min(1),
  steps:       z.record(z.string(), SimStepSchema),
  entryStep:   z.string().min(1),
  passingStep: z.string().min(1),
});

export type SimOption        = z.infer<typeof SimOptionSchema>;
export type SimStep          = z.infer<typeof SimStepSchema>;
export type TroubleshootingSim = z.infer<typeof SimSchema>;

// Validates a raw JSON object and throws a descriptive ZodError on failure.
export function parseSim(raw: unknown, sourceHint?: string): TroubleshootingSim {
  const result = SimSchema.safeParse(raw);
  if (!result.success) {
    const prefix = sourceHint ? `[${sourceHint}] ` : '';
    throw new Error(`${prefix}Invalid sim data:\n${result.error.toString()}`);
  }
  return result.data;
}
