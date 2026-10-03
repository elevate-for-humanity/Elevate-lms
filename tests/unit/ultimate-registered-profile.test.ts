import { describe, expect, it } from 'vitest';
import { UltimateAppendixAStandardsSource } from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import { verifyRegisteredProfile } from '../../lib/ultimate-course-builder/credential/verify-registered-profile';
import { hydrateUltimateProfileSources } from '../../lib/ultimate-course-builder/core/course-profile';

describe('Barber standards lock', () => {
  it('matches the registered Appendix A contract and rejects altered competencies', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    expect(verifyRegisteredProfile(profile).rapidsCode).toBe('0030CB');
    expect(profile.instructionalSources).toHaveLength(profile.competencies.length);
    expect(profile.instructionalSources?.map((source) => source.id)).toEqual(
      profile.competencies.map((competency) => competency.id),
    );
    const legacyProfile = { ...profile, instructionalSources: undefined };
    const db = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    };
    const repaired = await hydrateUltimateProfileSources(db as never, 'course', legacyProfile);
    expect(repaired.instructionalSources).toHaveLength(profile.competencies.length);
    const changed = {...profile,competencies:profile.competencies.map((c,index)=>index?c:{...c,description:'Different standard'})};
    expect(() => verifyRegisteredProfile(changed)).toThrow('ULTIMATE_REGISTERED_PROFILE_MISMATCH');
  });
});
