import { describe, expect, it } from 'vitest';
import { UltimateAppendixAStandardsSource } from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import { verifyRegisteredProfile } from '../../lib/ultimate-course-builder/credential/verify-registered-profile';
import { hydrateUltimateProfileSources } from '../../lib/ultimate-course-builder/core/course-profile';

describe('Barber standards lock', () => {
  it('separates teaching modality from mandatory registered mentor evidence, including old profiles', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    expect(profile.competencies.find(c=>c.id==='barber-g')?.type).toBe('knowledge');
    expect(profile.competencies.find(c=>c.id==='barber-e')?.type).toBe('decision');
    expect(profile.competencies.find(c=>c.id==='barber-a')?.type).toBe('practical_skill');
    const old = {...profile, competencies:profile.competencies.map(c=>({...c,type:'practical_skill' as const}))};
    const db = {from:()=>({select:()=>({eq:()=>({order:async()=>({data:[],error:null})})})})};
    const hydrated = await hydrateUltimateProfileSources(db as never,'course',old);
    expect(hydrated.competencies.find(c=>c.id==='barber-g')?.type).toBe('knowledge');
    expect(hydrated.competencies.every(c=>c.requiresPracticalEvidence&&c.requiresDemonstration)).toBe(true);
    expect(hydrated.competencies.map(c=>c.authorityRequirementIds)).toEqual(old.competencies.map(c=>c.authorityRequirementIds));
    expect(verifyRegisteredProfile(hydrated).rapidsCode).toBe('0030CB');
  });
  it('accepts reordered competencies and equivalent wording with the same registered requirements', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    const supplied = {...profile, competencies: [...profile.competencies].reverse().map(c => ({
      ...c, title: 'Supplied teaching competency',
      description: c.id === profile.competencies[0].id ? c.description.replace(/using/g, 'with') : c.description,
    }))};
    expect(verifyRegisteredProfile(supplied).rapidsCode).toBe('0030CB');
    expect(() => verifyRegisteredProfile({...supplied, competencies: supplied.competencies.slice(1)})).toThrow('ULTIMATE_REGISTERED_PROFILE_MISMATCH');
  });
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
