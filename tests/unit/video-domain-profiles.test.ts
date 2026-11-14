import { describe, expect, it } from 'vitest';

import {
  resolveInstructionalDomainProfile,
  type InstructionalDomainKey,
} from '@/server/video-generator/domain-profiles';
import { buildSceneGenerationUserPrompt } from '@/server/video-generator/prompts';

const supported: InstructionalDomainKey[] = [
  'barbering',
  'cosmetology',
  'esthetics',
  'nail_technology',
  'hvac_epa608',
  'healthcare',
  'business',
  'general',
];

describe('instructional video domain profiles', () => {
  it.each(supported)('resolves the explicit %s profile', (key) => {
    expect(resolveInstructionalDomainProfile(key).key).toBe(key);
  });

  it('uses a neutral fallback rather than title matching', () => {
    expect(resolveInstructionalDomainProfile('unknown-course')).toMatchObject({ key: 'general' });
  });

  it.each([
    ['indiana_barber_apprenticeship', 'barbering'],
    ['indiana_cosmetologist_license', 'cosmetology'],
    ['esthetician_state_board', 'esthetics'],
    ['manicurist_apprenticeship', 'nail_technology'],
    ['epa_608_universal', 'hvac_epa608'],
    ['cna_clinical_skills', 'healthcare'],
    ['business_workforce_certificate', 'business'],
  ])('resolves persisted compliance profile %s to %s', (profileKey, expected) => {
    expect(resolveInstructionalDomainProfile(profileKey).key).toBe(expected);
  });

  it('creates cosmetology instruction without barber-only language', () => {
    const prompt = buildSceneGenerationUserPrompt({
      lessonId: 'cos-lesson-1',
      title: 'Chemical service preparation',
      content: 'Teach consultation, strand testing, PPE, and infection control.',
      seed: 'fixed-test-seed',
      sceneCount: 8,
      lessonType: 'skill',
      profile: resolveInstructionalDomainProfile('cosmetology'),
    });

    expect(prompt).toContain('Cosmetology');
    expect(prompt).toContain('chemical service setup');
    expect(prompt.toLowerCase()).not.toContain('barber apprenticeship');
    expect(prompt).not.toContain('gpt-4o');
  });

  it('keeps barbering available as an explicit profile', () => {
    const profile = resolveInstructionalDomainProfile('barbering');
    expect(profile.visualVocabulary).toContain('licensed barber demonstrations');
    expect(profile.videoStyle).toBe('trade_demonstration');
  });
});
