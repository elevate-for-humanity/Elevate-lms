/**
 * lib/curriculum/lesson-content-schema.ts
 *
 * Zod schema for structured lesson content stored in course_lessons.content_structured.
 *
 * Every lesson type uses this schema. Fields that are not applicable to a given
 * lesson type are left at their defaults (empty string, empty array, false).
 *
 * The schema is versioned (version: 1) so future migrations can detect and
 * upgrade old content without breaking existing lessons.
 */

import { z } from 'zod';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const EvidenceRequirementSchema = z.object({
  enabled:          z.boolean().default(false),
  submissionModes:  z.array(z.enum(['text', 'file', 'image', 'video', 'audio', 'url'])).default([]),
  minItems:         z.number().int().min(0).default(0),
  reviewerRequired: z.boolean().default(false),
  instructions:     z.string().default(''),
});

export const RubricCriterionSchema = z.object({
  key:         z.string().min(1),
  label:       z.string().min(1),
  description: z.string().min(1),
  points:      z.number().min(0),
  required:    z.boolean().default(true),
});

export const VideoConfigSchema = z.object({
  videoFile:                  z.string().optional(),
  posterImage:                z.string().optional(),
  transcript:                 z.string().default(''),
  captionsFile:               z.string().optional(),
  runtimeSeconds:             z.number().int().min(0).default(0),
  completionThresholdPercent: z.number().min(1).max(100).default(90),
});

export const PracticalConfigSchema = z.object({
  requiredHours:              z.number().min(0).default(0),
  requiredAttempts:           z.number().int().min(0).default(0),
  requiresEvaluatorApproval:  z.boolean().default(false),
  requiresSkillSignoff:       z.boolean().default(false),
  safetyGuidance:             z.string().default(''),
  materialsNeeded:            z.array(z.string()).default([]),
});

export const CompletionRuleSchema = z.object({
  minMinutes:               z.number().min(0).default(0),
  requiresQuizPass:         z.boolean().default(false),
  requiresEvidenceApproval: z.boolean().default(false),
  requiresSignoff:          z.boolean().default(false),
  requiresHours:            z.number().min(0).default(0),
  requiresAttempts:         z.number().int().min(0).default(0),
});

// ─── Root schema ──────────────────────────────────────────────────────────────

export const LessonContentSchema = z.object({
  version:               z.literal(1),
  summary:               z.string().default(''),
  objectives:            z.array(z.string().min(1)).default([]),
  instructionalContent:  z.string().default(''),
  transcript:            z.string().default(''),
  materials:             z.array(z.string()).default([]),
  activityInstructions:  z.string().default(''),
  evidence:              EvidenceRequirementSchema.default({
    enabled: false, submissionModes: [], minItems: 0,
    reviewerRequired: false, instructions: '',
  }),
  rubric:                z.array(RubricCriterionSchema).default([]),
  video:                 VideoConfigSchema.optional(),
  practical:             PracticalConfigSchema.optional(),
  completionRule:        CompletionRuleSchema.default({
    minMinutes: 0, requiresQuizPass: false, requiresEvidenceApproval: false,
    requiresSignoff: false, requiresHours: 0, requiresAttempts: 0,
  }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LessonContent        = z.infer<typeof LessonContentSchema>;
export type EvidenceRequirement  = z.infer<typeof EvidenceRequirementSchema>;
export type RubricCriterion      = z.infer<typeof RubricCriterionSchema>;
export type VideoConfig          = z.infer<typeof VideoConfigSchema>;
export type PracticalConfig      = z.infer<typeof PracticalConfigSchema>;
export type CompletionRule       = z.infer<typeof CompletionRuleSchema>;

// ─── Empty defaults ───────────────────────────────────────────────────────────

export function emptyLessonContent(): LessonContent {
  return LessonContentSchema.parse({ version: 1 });
}
