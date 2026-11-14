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

  it('routes practical evidence to automated review without auto-approving it', () => {
    const intelligence = compileLearningIntelligence({
      lessonSlug: 'chemical-service-practical',
      lessonTitle: 'Chemical Service Practical',
      domainKey: 'chemical-services',
      objectives: ['Demonstrate safe client protection.'],
      assessment: false,
      practical: true,
    });

    expect(intelligence.collaboration.expertReviewRequired).toBe(true);
    expect(intelligence.collaboration.automatedEvidenceReview).toBe(true);
    expect(intelligence.automations).toContainEqual(
      expect.objectContaining({
        trigger: 'practical_submitted',
        actions: [
          { type: 'request_automated_review', target: 'chemical-service-practical' },
          { type: 'request_expert_review', target: 'chemical-service-practical' },
        ],
      }),
    );
    expect(JSON.stringify(intelligence)).not.toContain('issue_completion');
  });

  it('requires 100 percent runtime mastery for critical competencies', () => {
    const intelligence = compileLearningIntelligence({
      lessonSlug: 'electrical-safety-checkpoint',
      lessonTitle: 'Electrical Safety Checkpoint',
      domainKey: 'hvac-safety',
      competencyKeys: ['hvac.lockout-tagout'],
      objectives: ['Apply lockout and tagout before electrical testing.'],
      masteryThreshold: 80,
      critical: true,
      criticalMasteryThreshold: 100,
      assessment: true,
      practical: false,
    });

    expect(intelligence.adaptivePath.masteryThreshold).toBe(100);
    expect(intelligence.automations[0].onlyIf).toMatchObject({
      metric: 'score',
      operator: 'gte',
      value: 100,
    });
    expect(intelligence.automations[1].onlyIf).toMatchObject({
      metric: 'score',
      operator: 'lt',
      value: 100,
    });
  });
});
