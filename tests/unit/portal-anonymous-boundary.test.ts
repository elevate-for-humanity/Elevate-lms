// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.hoisted(() => ({ cookie: false, getUser: vi.fn() }));
vi.mock('@/lib/supabase/middleware', () => ({
  hasSupabaseAuthCookie: () => auth.cookie,
  createMiddlewareSupabaseClient: () => ({ auth: { getUser: auth.getUser } }),
}));
vi.mock('@/lib/tenant/middleware-tenant-routing', () => ({
  tenantSlugFromAppHost: () => null,
  rewriteCustomDomainRequest: vi.fn(),
  rewriteTenantAppHostRequest: vi.fn(),
}));
vi.mock('@/lib/health/public-runtime-service', () => ({ getPublicRuntimeService: () => 'marketing' }));
import { middleware as marketing } from '@/apps/marketing/middleware';
import { middleware as lms } from '@/apps/lms/middleware';
import { middleware as admin } from '@/apps/admin/middleware';
import { PORTAL_MAP } from '@/lib/routing/portal-map';

beforeEach(() => { auth.cookie = false; auth.getUser.mockReset(); });

describe('anonymous portal request boundary', () => {
  for (const [key, portal] of Object.entries(PORTAL_MAP)) {
    it(`protects the ${key} portal on its owning service`, async () => {
      const owner = portal.subdomain === 'marketing' ? marketing : portal.subdomain === 'admin' ? admin : lms;
      const response = await owner(new NextRequest(`${portal.host}${portal.defaultPath}`));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('cache-control')).toContain('no-store');
      expect(auth.getUser).not.toHaveBeenCalled();
    });
    if (portal.subdomain !== 'marketing') {
      it(`routes www ${key} to its canonical protected service and preserves query parameters`, async () => {
        const response = await marketing(new NextRequest(`https://www.elevateforhumanity.org${portal.defaultPath}?source=legacy`));
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`${portal.host}${portal.defaultPath}?source=legacy`);
      });
    }
  }
  it.each(['/scorm/job-ready/introduction/dispatch.html', '/scorm/job-ready/mindsets/package.zip', '/lms/career/job-ready', '/lms/scorm', '/employer/export.json', '/host-shop/export.json', '/parent-portal', '/cosmetology-host-shop/dashboard', '/future/dashboard'])('does not let LMS %s bypass authentication', async (path) => {
    const response = await lms(new NextRequest(`https://app.elevateforhumanity.org${path}`));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
  it('does not let dotted admin API paths bypass authentication', async () => {
    const response = await admin(new NextRequest('https://admin.elevateforhumanity.org/api/admin/export.json'));
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('location')).toBeNull();
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it.each(['/provider/export.json', '/case-manager/export.json', '/workforce-board/export.json'])('does not let marketing %s bypass authentication', async (path) => {
    const response = await marketing(new NextRequest(`https://www.elevateforhumanity.org${path}`));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
  it('protects tax workspaces and retains the selected return after login', async () => {
    const response = await marketing(new NextRequest('https://www.elevateforhumanity.org/tax-software/self-file/return?returnId=owned-return'));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/tax-software/login');
    expect(location.searchParams.get('redirect')).toBe('/tax-software/self-file/return?returnId=owned-return');
  });
  it('rejects an invalid LMS session even when a session cookie exists', async () => {
    auth.cookie = true;
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid session') });
    const response = await lms(new NextRequest('https://app.elevateforhumanity.org/employer/dashboard'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
  it.each(['/login', '/host-shop/login'])('keeps LMS %s available without a session', async (path) => {
    const response = await lms(new NextRequest(`https://app.elevateforhumanity.org${path}`));
    expect(response.status).toBe(200);
  });
  it.each(['/student', '/student-portal', '/student/dashboard'])('sends legacy %s to the actual student workspace', async (path) => {
    const response = await marketing(new NextRequest(`https://www.elevateforhumanity.org${path}`));
    expect(response.headers.get('location')).toBe('https://lms.elevateforhumanity.org/lms/dashboard');
  });
  it.each(['/apprenticeships', '/employers', '/partners/host-shops', '/platform/student-portal'])('preserves public %s', async (path) => {
    const response = await marketing(new NextRequest(`https://www.elevateforhumanity.org${path}`));
    expect(response.status).toBe(200);
  });
});
