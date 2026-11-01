// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { createClient, tenantRewrite } = vi.hoisted(() => ({ createClient: vi.fn(), tenantRewrite: vi.fn() }));
vi.mock('@/lib/supabase/middleware', () => ({
  hasSupabaseAuthCookie: () => false,
  createMiddlewareSupabaseClient: createClient,
}));
vi.mock('@/lib/health/public-runtime-service', () => ({ getPublicRuntimeService: () => 'marketing' }));
vi.mock('@/lib/tenant/middleware-tenant-routing', async () => {
  const { NextResponse } = await import('next/server');
  return {
    tenantSlugFromAppHost: () => null,
    rewriteTenantAppHostRequest: tenantRewrite,
    rewriteCustomDomainRequest: () => NextResponse.rewrite(new URL('https://school.example.com/sites/customer')),
  };
});
import { middleware } from '../../apps/marketing/middleware';
import { LMS_HOST, ADMIN_HOST } from '../../lib/routing/portal-map';

function request(path: string, host = 'www.elevateforhumanity.org', method = 'GET') {
  return new NextRequest(`https://${host}${path}`, { method, headers: { host } });
}
beforeEach(() => vi.clearAllMocks());

describe('marketing middleware routing without learner disruption', () => {
  it.each([
    ['/testing-center', 'https://www.elevateforhumanity.org/testing'],
    ['/employer', 'https://www.elevateforhumanity.org/employers'],
    ['/learner/dashboard', `${LMS_HOST}/lms/dashboard`],
  ])('resolves %s before the portal registry', async (path, expected) => {
    const response = await middleware(request(`${path}?program=hvac&ref=a%2Bb`));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${expected}?program=hvac&ref=a%2Bb`);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(createClient).not.toHaveBeenCalled();
  });
  it.each([
    '/lms/dashboard', '/lms/courses/123/lessons/456', '/apprentice/hours',
    '/host-shop/dashboard', '/program-holder/students', '/employer/dashboard',
  ])('preserves existing %s portal ownership and deep links', async (path) => {
    const response = await middleware(request(`${path}?course=123`));
    expect(response.headers.get('location')).toBe(`${LMS_HOST}${path}?course=123`);
    expect(createClient).not.toHaveBeenCalled();
  });
  it('keeps operational testing children on Admin', async () => {
    const response = await middleware(request('/testing-center/bookings'));
    expect(response.headers.get('location')).toBe(`${ADMIN_HOST}/testing-center/bookings`);
  });
  it('leaves testing POST ownership unchanged', async () => {
    const response = await middleware(request('/testing-center', undefined, 'POST'));
    expect(response.headers.get('location')).toBe(`${ADMIN_HOST}/testing-center`);
  });
  it('preserves custom-domain rewrite instead of redirecting its testing page', async () => {
    const response = await middleware(request('/learner/dashboard', 'school.example.com'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toContain('/sites/customer');
  });
  it('sends login directly to the current LMS host and retains its return target', async () => {
    const response = await middleware(request('/login?redirect=%2Flms%2Fcourses%2F123'));
    expect(response.headers.get('location')).toBe(`${LMS_HOST}/login?redirect=%2Flms%2Fcourses%2F123`);
  });
});
