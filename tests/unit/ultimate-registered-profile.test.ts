import { describe, expect, it } from 'vitest';
import { UltimateAppendixAStandardsSource } from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import { verifyRegisteredProfile } from '../../lib/ultimate-course-builder/credential/verify-registered-profile';

describe('Barber standards lock', () => {
  it('matches the registered Appendix A contract and rejects altered competencies', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    expect(verifyRegisteredProfile(profile).rapidsCode).toBe('0030CB');
    const changed = {...profile,competencies:profile.competencies.map((c,index)=>index?c:{...c,description:'Different standard'})};
    expect(() => verifyRegisteredProfile(changed)).toThrow('ULTIMATE_REGISTERED_PROFILE_MISMATCH');
  });
});
