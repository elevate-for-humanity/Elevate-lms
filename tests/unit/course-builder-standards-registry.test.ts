import { describe, expect, it } from 'vitest';
import {
  getCredentialFromConfig,
  validateCredentialAuthority,
} from '@/lib/course-builder/credential-engine/registry-loader';
import {
  buildObjectiveCoverageReport,
  fingerprintCredentialStandard,
} from '@/lib/course-builder/standards-registry';

describe('versioned credential standards registry', () => {
  it('loads current Microsoft objectives and rejects retired standards', () => {
    const az900 = getCredentialFromConfig('microsoft-az-900');
    const ai900 = getCredentialFromConfig('microsoft-ai-900');
    expect(az900?.authority?.registryKey).toBe('microsoft:az-900:2026-07-20');
    expect(validateCredentialAuthority(az900!)).toEqual([]);
    expect(validateCredentialAuthority(ai900!)).toContain('credential standard is retired');
  });

  it('blocks publication until every objective has instruction, assessment, and required lab evidence', () => {
    const standard = getCredentialFromConfig('microsoft-az-900')!;
    const fingerprint = fingerprintCredentialStandard(standard);
    const lesson = (domainKey: string, practicalRequired = false) => ({
      slug: domainKey,
      title: domainKey,
      orderIndex: 1,
      lessonType: practicalRequired ? 'lab' : 'lesson',
      durationMinutes: 30,
      learningObjectives: ['Demonstrate the objective'],
      content: { body: 'Instruction' },
      domainKey,
      practicalRequired,
      quizQuestions: [1, 2].map((n) => ({
        id: `${domainKey}-${n}`,
        prompt: 'Question',
        type: 'multiple_choice',
        options: ['A', 'B'],
        correctAnswer: 0,
        explanation: 'Because',
        domainKey,
        competencyKeys: [domainKey],
      })),
    });
    const template = {
      status: 'published',
      regulatory: {
        standardRegistryKey: standard.authority!.registryKey,
        governingStandardVersion: standard.authority!.version,
        standardFingerprint: fingerprint,
      },
      modules: [
        {
          lessons: [
            lesson('cloud-concepts'),
            lesson('azure-architecture-services', true),
            lesson('azure-management-governance', true),
          ],
        },
      ],
    } as any;
    expect(buildObjectiveCoverageReport(template, standard)).toMatchObject({
      publishable: true,
      coveragePercent: 100,
    });
    template.modules[0].lessons.pop();
    expect(buildObjectiveCoverageReport(template, standard)).toMatchObject({
      publishable: false,
      coveragePercent: 67,
    });
  });
});
