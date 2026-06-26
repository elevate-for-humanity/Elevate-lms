import { describe, it, expect } from 'vitest';
import {
  buildLoginUrl,
  buildReturnPath,
  readRedirectParam,
  resolveRedirectLocation,
  validateRedirect,
} from '@/lib/auth/validate-redirect';

describe('buildReturnPath', () => {
  it('joins pathname and search', () => {
    expect(buildReturnPath('/lms/courses/abc', '?activity=reading')).toBe(
      '/lms/courses/abc?activity=reading',
    );
  });

  it('normalizes missing leading slash', () => {
    expect(buildReturnPath('portal/barber', '?tab=hours')).toBe('/portal/barber?tab=hours');
  });
});

describe('buildLoginUrl', () => {
  it('encodes nested query strings in redirect param', () => {
    const url = buildLoginUrl('https://www.elevateforhumanity.org', '/lms/courses/x?activity=reading');
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirect')).toBe('/lms/courses/x?activity=reading');
    expect(url.toString()).toContain('redirect=%2Flms%2Fcourses%2Fx%3Factivity%3Dreading');
  });
});

describe('readRedirectParam', () => {
  it('prefers redirect over next', () => {
    const params = new URLSearchParams('next=/old&redirect=/new');
    expect(readRedirectParam(params)).toBe('/new');
  });

  it('falls back to next', () => {
    const params = new URLSearchParams('next=/legacy');
    expect(readRedirectParam(params)).toBe('/legacy');
  });
});

describe('validateRedirect', () => {
  it('allows same-origin paths with query strings', () => {
    expect(validateRedirect('/portal/barber?tab=hours', '/')).toBe('/portal/barber?tab=hours');
  });

  it('allows trusted admin subdomain URLs', () => {
    const admin = '/admin/instructor/dashboard';
    expect(validateRedirect(admin, '/')).toBe(admin);
  });

  it('blocks external open redirects', () => {
    expect(validateRedirect('https://evil.com/phish', '/safe')).toBe('/safe');
    expect(validateRedirect('//evil.com', '/safe')).toBe('/safe');
  });
});

describe('resolveRedirectLocation', () => {
  it('resolves relative paths against origin to absolute URL', () => {
    // When target starts with /, it should be resolved against the origin
    expect(
      resolveRedirectLocation('/admin/dashboard', 'https://www.elevateforhumanity.org').href,
    ).toBe('https://www.elevateforhumanity.org/admin/dashboard');
  });

  it('resolves portal paths to absolute URLs', () => {
    expect(
      resolveRedirectLocation('/portal/barber', 'https://www.elevateforhumanity.org').href,
    ).toBe('https://www.elevateforhumanity.org/portal/barber');
  });

  it('preserves already absolute URLs', () => {
    const target = 'https://www.elevateforhumanity.org/admin/dashboard';
    expect(resolveRedirectLocation(target, 'https://www.elevateforhumanity.org').href).toBe(target);
  });
});
