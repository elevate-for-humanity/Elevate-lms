import { describe, expect, it } from 'vitest';
import { resolvePublicPageRedirect } from '@/lib/routing/public-entry-aliases.mjs';
const request = { host: 'www.elevateforhumanity.org', pathname: '/student-support/academic', search: '?source=bookmark', method: 'GET', marketingHost: 'https://www.elevateforhumanity.org' };
describe('early consolidated page redirects', () => {
  it('preserves the query before the destination section fragment', () => {
    expect(resolvePublicPageRedirect(request)?.href).toBe('https://www.elevateforhumanity.org/student-support?source=bookmark#academic');
  });
  it('leaves private requests, customer pages, unknown topics and real scheduling alone', () => {
    expect(resolvePublicPageRedirect({ ...request, method: 'POST' })).toBeNull();
    expect(resolvePublicPageRedirect({ ...request, host: 'customer.example' })).toBeNull();
    expect(resolvePublicPageRedirect({ ...request, pathname: '/student-support/unknown' })).toBeNull();
    expect(resolvePublicPageRedirect({ ...request, pathname: '/student-support/schedule' })).toBeNull();
    expect(resolvePublicPageRedirect({ ...request, pathname: '/admin' })).toBeNull();
  });
});
