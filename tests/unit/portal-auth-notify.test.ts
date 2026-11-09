// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolvePortalKind } from '@/lib/auth/portal-auth-notify';

function dbWithRole(role: string | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: role ? { role } : null }),
        }),
      }),
    }),
  } as any;
}

describe('resolvePortalKind', () => {
  it('maps every portal role to its owner-facing label', async () => {
    expect(await resolvePortalKind(dbWithRole('program_holder'), 'u')).toBe('Program Holder');
    expect(await resolvePortalKind(dbWithRole('site_coordinator'), 'u')).toBe('Program Holder');
    expect(await resolvePortalKind(dbWithRole('employer'), 'u')).toBe('Employer');
    expect(await resolvePortalKind(dbWithRole('workforce'), 'u')).toBe('Workforce');
    expect(await resolvePortalKind(dbWithRole('instructor'), 'u')).toBe('Instructor');
    expect(await resolvePortalKind(dbWithRole('staff'), 'u')).toBe('Staff');
    expect(await resolvePortalKind(dbWithRole('host_shop'), 'u')).toBe('Host Shop');
    expect(await resolvePortalKind(dbWithRole('admin'), 'u')).toBe('Admin');
    expect(await resolvePortalKind(dbWithRole('super_admin'), 'u')).toBe('Admin');
    expect(await resolvePortalKind(dbWithRole('barber_apprentice'), 'u')).toBe('Apprentice');
    expect(await resolvePortalKind(dbWithRole('student'), 'u')).toBe('Learner');
  });

  it('falls back to Learner for an unknown or missing role', async () => {
    expect(await resolvePortalKind(dbWithRole('something_new'), 'u')).toBe('Learner');
    expect(await resolvePortalKind(dbWithRole(null), 'u')).toBe('Learner');
  });
});
