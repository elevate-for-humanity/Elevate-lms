import { describe, expect, it } from 'vitest';
import { getDashboardUrl } from '@/config/dashboard-routes';
import { getRoleDestination } from '@/lib/auth/role-destinations';

describe('getDashboardUrl', () => {
  it('matches canonical role destinations for known roles', () => {
    expect(getDashboardUrl('partner')).toBe(getRoleDestination('partner'));
    expect(getDashboardUrl('program_holder')).toBe(getRoleDestination('program_holder'));
    expect(getDashboardUrl('delegate')).toBe('/learner/dashboard');
  });

  it('returns unauthorized for missing or unknown roles', () => {
    expect(getDashboardUrl(undefined)).toBe('/unauthorized?reason=unknown_role');
    expect(getDashboardUrl('not_a_real_role' as 'student')).toBe(
      '/unauthorized?reason=unknown_role',
    );
  });
});
