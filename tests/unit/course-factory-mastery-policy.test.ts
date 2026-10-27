import { describe, expect, it } from 'vitest';

import {
  resolveDomainMasteryThresholds,
  resolveLessonMasteryPolicy,
  resolveStoredLessonExperience,
} from '@/lib/course-factory/mastery-policy';

describe('Course Factory runtime mastery policy', () => {
  it('uses governed learning intelligence instead of a fixed endpoint threshold', () => {
    const policy = resolveLessonMasteryPolicy({
      remediation: { passingScore: 80 },
      intelligence: {
        version: 1,
        skills: [
          { key: 'hvac.lockout', label: 'Lockout Tagout', source: 'blueprint', required: true },
        ],
        adaptivePath: {
          masteryThreshold: 100,
          remediationTargets: ['Apply lockout and tagout.'],
          nextActionOnMastery: 'unlock_next',
          nextActionBelowMastery: 'assign_remediation',
        },
        collaboration: {
          reflectionPrompt: 'Explain how you apply the required safety procedure at work.',
          expertFeedbackPrompt: 'Review the submitted evidence against every required safety step.',
          expertReviewRequired: true,
          automatedEvidenceReview: true,
        },
        automations: [
          {
            trigger: 'assessment_passed',
            onlyIf: { metric: 'score', operator: 'gte', value: 100 },
            actions: [{ type: 'unlock_next', target: 'next_required_lesson' }],
          },
          {
            trigger: 'assessment_failed',
            onlyIf: { metric: 'score', operator: 'lt', value: 100 },
            actions: [{ type: 'assign_remediation', target: 'electrical-safety' }],
          },
        ],
      },
    });

    expect(policy.threshold).toBe(100);
    expect(policy.expertReviewRequired).toBe(true);
    expect(policy.skills[0].key).toBe('hvac.lockout');
  });

  it('reads canonical content_json before legacy content', () => {
    const experience = resolveStoredLessonExperience(
      { experience: { remediation: { passingScore: 90 } } },
      JSON.stringify({ experience: { remediation: { passingScore: 70 } } }),
    );
    expect(resolveLessonMasteryPolicy(experience).threshold).toBe(90);
  });

  it('uses the strictest lesson threshold for each competency domain', () => {
    const thresholds = resolveDomainMasteryThresholds([
      { domain_key: 'safety', content_json: { experience: { remediation: { passingScore: 80 } } } },
      {
        domain_key: 'safety',
        content_json: { experience: { readiness: { masteryThreshold: 100 } } },
      },
      {
        domain_key: 'service',
        content_json: { experience: { remediation: { passingScore: 85 } } },
      },
    ]);
    expect(Object.fromEntries(thresholds)).toEqual({ safety: 100, service: 85 });
  });
});
