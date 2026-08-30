import { z } from 'zod';

const IntelligenceActionSchema = z.object({
  type: z.enum([
    'unlock_next',
    'assign_remediation',
    'request_expert_review',
    'record_mastery',
    'issue_completion',
  ]),
  target: z.string().trim().min(1),
});

export const LearningIntelligenceSchema = z.object({
  version: z.literal(1),
  skills: z.array(z.object({
    key: z.string().trim().min(1),
    label: z.string().trim().min(1),
    source: z.enum(['blueprint', 'objective', 'domain']),
    required: z.boolean(),
  })).min(1),
  adaptivePath: z.object({
    masteryThreshold: z.number().int().min(1).max(100),
    remediationTargets: z.array(z.string().trim().min(1)).min(1),
    nextActionOnMastery: z.literal('unlock_next'),
    nextActionBelowMastery: z.literal('assign_remediation'),
  }),
  collaboration: z.object({
    reflectionPrompt: z.string().trim().min(20),
    expertFeedbackPrompt: z.string().trim().min(20),
    expertReviewRequired: z.boolean(),
  }),
  automations: z.array(z.object({
    trigger: z.enum([
      'lesson_completed',
      'assessment_passed',
      'assessment_failed',
      'practical_submitted',
    ]),
    onlyIf: z.object({
      metric: z.enum(['completion', 'score', 'evidence_status']),
      operator: z.enum(['eq', 'gte', 'lt']),
      value: z.union([z.string(), z.number()]),
    }),
    actions: z.array(IntelligenceActionSchema).min(1),
  })).min(2),
});

export type LearningIntelligence = z.infer<typeof LearningIntelligenceSchema>;

function readableLabel(value: string): string {
  return value
    .replace(/[_:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Compiles the best learning-orchestration patterns into deterministic metadata.
 * This intentionally performs no model call: skills and workflow rules must be
 * traceable to the approved blueprint and generated objective, not AI guesses.
 */
export function compileLearningIntelligence(input: {
  lessonSlug: string;
  lessonTitle: string;
  domainKey: string;
  competencyKeys?: string[];
  objectives?: string[];
  masteryThreshold?: number;
  assessment: boolean;
  practical: boolean;
}): LearningIntelligence {
  const competencyKeys = unique(input.competencyKeys ?? []);
  const objectives = unique(input.objectives ?? []);
  const skills = competencyKeys.length
    ? competencyKeys.map((key) => ({ key, label: readableLabel(key), source: 'blueprint' as const, required: true }))
    : objectives.length
      ? objectives.slice(0, 5).map((objective, index) => ({
          key: `${input.domainKey}:${input.lessonSlug}:objective-${index + 1}`,
          label: objective,
          source: 'objective' as const,
          required: true,
        }))
      : [{
          key: `${input.domainKey}:${input.lessonSlug}`,
          label: input.lessonTitle,
          source: 'domain' as const,
          required: true,
        }];
  const masteryThreshold = Math.max(1, Math.min(100, Math.round(input.masteryThreshold ?? 80)));
  const remediationTargets = objectives.length ? objectives.slice(0, 5) : skills.map((skill) => skill.label);

  const automations: LearningIntelligence['automations'] = [
    {
      trigger: input.assessment ? 'assessment_passed' : 'lesson_completed',
      onlyIf: {
        metric: input.assessment ? 'score' : 'completion',
        operator: input.assessment ? 'gte' : 'eq',
        value: input.assessment ? masteryThreshold : 100,
      },
      actions: [
        { type: 'record_mastery', target: input.domainKey },
        { type: 'unlock_next', target: 'next_required_lesson' },
      ],
    },
    {
      trigger: input.assessment ? 'assessment_failed' : 'lesson_completed',
      onlyIf: {
        metric: input.assessment ? 'score' : 'completion',
        operator: 'lt',
        value: input.assessment ? masteryThreshold : 100,
      },
      actions: [{ type: 'assign_remediation', target: input.lessonSlug }],
    },
  ];

  if (input.practical) {
    automations.push({
      trigger: 'practical_submitted',
      onlyIf: { metric: 'evidence_status', operator: 'eq', value: 'submitted' },
      actions: [{ type: 'request_expert_review', target: input.lessonSlug }],
    });
  }

  return LearningIntelligenceSchema.parse({
    version: 1,
    skills,
    adaptivePath: {
      masteryThreshold,
      remediationTargets,
      nextActionOnMastery: 'unlock_next',
      nextActionBelowMastery: 'assign_remediation',
    },
    collaboration: {
      reflectionPrompt: `Explain how you would apply ${input.lessonTitle} during real work and identify one area where you need more practice.`,
      expertFeedbackPrompt: `Review the learner's evidence for ${input.lessonTitle} and give specific feedback tied to the required skills.`,
      expertReviewRequired: input.practical,
    },
    automations,
  });
}
