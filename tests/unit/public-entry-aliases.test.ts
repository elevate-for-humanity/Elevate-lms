import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolvePublicEntryAlias } from '../../lib/routing/public-entry-aliases.mjs';

const base = {
  host: 'www.elevateforhumanity.org', method: 'GET', search: '',
  marketingHost: 'https://www.elevateforhumanity.org',
  lmsHost: 'https://lms.elevateforhumanity.org',
};

describe('public entry aliases preserve active learner routes', () => {
  it.each([
    ['/employer', 'https://www.elevateforhumanity.org/employers'],
    ['/testing-center', 'https://www.elevateforhumanity.org/testing'],
    ['/learner/dashboard', 'https://lms.elevateforhumanity.org/lms/dashboard'],
  ])('resolves %s without an intermediate portal alias', (pathname, expected) => {
    expect(resolvePublicEntryAlias({ ...base, pathname })?.href).toBe(expected);
    expect(resolvePublicEntryAlias({ ...base, pathname: `${pathname}/`, method: 'HEAD' })?.href).toBe(expected);
  });

  it('preserves encoded return paths and enrollment query parameters', () => {
    const search = '?program=hvac-technician&next=%2Flms%2Fcourses%2F123&ref=a%2Bb';
    const target = resolvePublicEntryAlias({ ...base, pathname: '/learner/dashboard', search });
    expect(target?.search).toBe(search);
    expect(target?.origin).toBe(base.lmsHost);
  });

  it.each([
    '/lms/dashboard', '/lms/courses/123/lessons/456', '/apprentice/hours',
    '/apprentice/documents', '/workbooks/bible', '/host-shop/dashboard',
    '/program-holder/students', '/employer/dashboard', '/employer/apprenticeships',
    '/testing-center/bookings', '/api/attendance/clock-in', '/learner/dashboard/settings',
  ])('does not intercept the existing operational route %s', (pathname) => {
    expect(resolvePublicEntryAlias({ ...base, pathname })).toBeNull();
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])('does not redirect %s mutations', (method) => {
    for (const pathname of ['/employer', '/testing-center', '/learner/dashboard']) {
      expect(resolvePublicEntryAlias({ ...base, pathname, method })).toBeNull();
    }
  });

  it.each(['school.example.com', 'customer.elevateforhumanity.org', 'admin.elevateforhumanity.org', 'lms.elevateforhumanity.org', 'store.elevateforhumanity.org'])('does not take ownership from %s', (host) => {
    expect(resolvePublicEntryAlias({ ...base, host, pathname: '/testing-center' })).toBeNull();
  });

  it('cannot use a query string to redirect to an untrusted host', () => {
    const target = resolvePublicEntryAlias({ ...base, pathname: '/learner/dashboard', search: '?redirect=https://evil.example' });
    expect(target?.origin).toBe(base.lmsHost);
    expect(target?.pathname).toBe('/lms/dashboard');
  });

  it('wires exact aliases before generic portal dispatch', () => {
    const source = readFileSync('apps/marketing/middleware.ts', 'utf8');
    expect(source.indexOf('const publicEntry = resolvePublicEntryAlias')).toBeLessThan(source.indexOf('const portalKey = getPortalKeyFromPath(pathname)'));
    expect(source).toContain("new URL('/login', LMS_HOST)");
  });

  it('uses canonical public employer links and the shared portal registry', () => {
    const config = JSON.parse(readFileSync('lib/routes/canonical-routes.json', 'utf8'));
    expect(config.canonicalRoutes.publicMarketing.employers).toBe('/employers');
    expect(config.canonicalRoutes.partners.employers).toBe('/employers');
    const nav = readFileSync('lib/navigation/site-nav.config.ts', 'utf8');
    expect(nav).not.toContain('https://app.elevateforhumanity.org');
    expect(nav).toContain('href: ROUTES.studentPortal');
    expect(nav).toContain('href: ROUTES.employerPortal');
  });
});
