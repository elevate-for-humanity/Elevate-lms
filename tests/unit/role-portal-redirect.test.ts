import { describe, expect, it } from 'vitest';
import { getRoleDestinationUrl, ROLE_ROUTE_CONFIG } from '@/lib/auth/role-destinations';
import { resolveRoleCompatiblePostLoginUrl } from '@/lib/auth/post-login-redirect';
import { PORTAL_MAP } from '@/lib/routing/portal-map';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';

describe('all role dashboard destinations', () => {
  it.each(Object.keys(ROLE_ROUTE_CONFIG))('routes %s to its owned portal, never the student dashboard by default', (role) => {
    const route = ROLE_ROUTE_CONFIG[role];
    const portal = PORTAL_MAP[route.portalKey];
    const expected = `${portal.host}${portal.defaultPath}`;
    expect(getRoleDestinationUrl(role)).toBe(expected);
    expect(resolveDashboardUrl(role)).toBe(expected);
    expect(resolveRoleCompatiblePostLoginUrl(portal.defaultPath, role, [role])).toBe(expected);
  });

  it('does not allow cross-role dashboard access from a requested return path', () => {
    const student = getRoleDestinationUrl('student');
    const employer = getRoleDestinationUrl('employer');
    const hostShop = getRoleDestinationUrl('host_shop');
    expect(resolveRoleCompatiblePostLoginUrl('/employer/dashboard', 'student', ['student'])).toBe(student);
    expect(resolveRoleCompatiblePostLoginUrl('/lms/dashboard', 'employer', ['employer'])).toBe(employer);
    expect(resolveRoleCompatiblePostLoginUrl('/host-shop/dashboard', 'employer', ['employer'])).toBe(employer);
    expect(resolveRoleCompatiblePostLoginUrl('/employer/dashboard', 'host_shop', ['host_shop'])).toBe(hostShop);
    expect(resolveRoleCompatiblePostLoginUrl('https://evil.example/employer/dashboard', 'employer', ['employer'])).toBe(employer);
  });

  it('preserves explicit employer portal for verified dual-role learner/employer accounts', () => {
    const employer = getRoleDestinationUrl('employer');
    expect(resolveRoleCompatiblePostLoginUrl('/employer/dashboard', 'student', ['student', 'employer'])).toBe(employer);
    expect(resolveRoleCompatiblePostLoginUrl('/employer/jobs', 'student', ['student', 'employer'])).toBe(new URL('/employer/jobs', employer).toString());
    expect(resolveRoleCompatiblePostLoginUrl('/employer/dashboard', 'employer', ['employer', 'student'])).toBe(employer);
    expect(resolveRoleCompatiblePostLoginUrl('/lms/courses', 'employer', ['employer', 'student'])).toBe(new URL('/lms/courses', employer).toString());
  });

  it('keeps verified staff/learner and host shop/program holder separate without granting unrelated roles', () => {
    const staff = getRoleDestinationUrl('staff');
    const learner = getRoleDestinationUrl('student');
    const shop = getRoleDestinationUrl('host_shop');
    expect(resolveRoleCompatiblePostLoginUrl('/lms/courses', 'staff', ['staff', 'student'])).toBe(new URL('/lms/courses', learner).toString());
    expect(resolveRoleCompatiblePostLoginUrl('/employer/dashboard', 'staff', ['staff'])).toBe(staff);
    expect(resolveRoleCompatiblePostLoginUrl('/program-holder/dashboard', 'host_shop', ['host_shop'])).toBe(shop);
    expect(resolveRoleCompatiblePostLoginUrl('/program-holder/dashboard', 'host_shop', ['host_shop', 'program_holder'])).toBe(getRoleDestinationUrl('program_holder'));
  });
});
