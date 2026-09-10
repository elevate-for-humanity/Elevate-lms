import { describe, it, expect } from 'vitest';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { APPRENTICESHIP_PORTAL_ENROLLMENT_STATES } from '@/lib/enrollment/enrollment-flow';
import { ACTIVE_ENROLLMENT_STATES, portalPathForProgramSlug } from '@/lib/portal/apprenticeship-portal-paths';

describe('portal routing', () => {
  it('maps beauty apprenticeship slugs to industry portals', () => {
    expect(portalPathForProgramSlug('barber-apprenticeship')).toMatch(/\/apprentice\?program=barber-apprenticeship$/);
    expect(portalPathForProgramSlug('cosmetology-apprenticeship')).toMatch(/\/apprentice\?program=cosmetology-apprenticeship$/);
    expect(portalPathForProgramSlug('esthetician-apprenticeship')).toMatch(/\/apprentice\?program=esthetician-apprenticeship$/);
    expect(portalPathForProgramSlug('nail-technician-apprenticeship')).toMatch(/\/apprentice\?program=nail-technician-apprenticeship$/);
  });

  it('routes in-progress apprenticeship states including orientation', () => {
    expect(APPRENTICESHIP_PORTAL_ENROLLMENT_STATES).toEqual(expect.arrayContaining([...ACTIVE_ENROLLMENT_STATES]));
    expect(ACTIVE_ENROLLMENT_STATES).toContain('onboarding');
    expect(ACTIVE_ENROLLMENT_STATES).toContain('orientation_complete');
  });

  it('includes partner_admin and sponsor destinations', () => {
    expect(getRoleDestination('partner_admin')).toBe('/lms/dashboard');
    expect(getRoleDestination('sponsor')).toBe('/employer/dashboard');
    expect(getRoleDestination('program_holder')).toBe('/program-holder/dashboard');
  });
});
