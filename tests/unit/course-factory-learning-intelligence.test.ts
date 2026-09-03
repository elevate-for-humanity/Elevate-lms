import { describe, expect, it } from 'vitest';

import {
  compileLearningIntelligence,
  LearningIntelligenceSchema,
} from '@/lib/course-factory/learning-intelligence';

describe('Course Factory learning intelligence', () => {
  it('compiles traceable skills and adaptive assessment automations without AI', () => {
    const intelligence = compileLearningIntelligence({
      lessonSlug: 'infection-control-checkpoint',
      lessonTitle: 'Infection Control Checkpoint',
      domainKey: 'infection-control',
      competencyKeys: ['infection-control.disinfection'],
      objectives: ['Apply the required disinfection contact time.'],
      masteryThreshold: 80,
      assessment: true,
      practical: false,
    });

    expect(LearningIntelligenceSchema.safeParse(intelligence).success).toBe(true);
    expect(intelligence.skills[0]).toMatchObject({
      key: 'infection-control.disinfection',
      source: 'blueprint',
    });
    expect(intelligence.automations.map((rule) => rule.trigger)).toEqual([
      'assessment_passed',
      'assessment_failed',
    ]);
  });

  it('routes practical evidence to a human expert instead of auto-approving it', () => {
    const intelligence = compileLearningIntelligence({
      lessonSlug: 'chemical-service-practical',
      lessonTitle: 'Chemical Service Practical',
      domainKey: 'chemical-services',
      objectives: ['Demonstrate safe client protection.'],
      assessment: false,
      practical: true,
    });

    expect(intelligence.collaboration.expertReviewRequired).toBe(true);
    expect(intelligence.automations).toContainEqual(expect.objectContaining({
      trigger: 'practical_submitted',
      actions: [{ type: 'request_expert_review', target: 'chemical-service-practical' }],
    }));
    expect(JSON.stringify(intelligence)).not.toContain('issue_completion');
  });
});
