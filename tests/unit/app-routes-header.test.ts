import { describe, it, expect } from 'vitest';
import {
  shouldHideMarketingHeader,
  shouldSuppressMarketingChrome,
  isAppRoute,
} from '@/lib/layout/app-routes';

describe('marketing header visibility', () => {
  it('hides global header on /education', () => {
    expect(shouldHideMarketingHeader('/education')).toBe(true);
    expect(shouldHideMarketingHeader('/education/foo')).toBe(true);
  });

  it('does not hide global header on marketing home', () => {
    expect(shouldHideMarketingHeader('/')).toBe(false);
    expect(shouldHideMarketingHeader('/programs')).toBe(false);
  });

  it('suppresses chrome for app routes and custom header routes', () => {
    expect(shouldSuppressMarketingChrome('/lms/dashboard')).toBe(true);
    expect(shouldSuppressMarketingChrome('/education')).toBe(true);
    expect(shouldSuppressMarketingChrome('/')).toBe(false);
  });

  it('app routes still use isAppRoute', () => {
    // /admin is in APP_ROUTE_PREFIXES
    expect(isAppRoute('/admin')).toBe(true);
    expect(isAppRoute('/admin/studio')).toBe(true);
    expect(isAppRoute('/lms/dashboard')).toBe(true);
    // /education is not in APP_ROUTE_PREFIXES (it's in CUSTOM_HEADER_ROUTE_PREFIXES)
    expect(isAppRoute('/education')).toBe(false);
    expect(isAppRoute('/programs')).toBe(false);
  });
});
