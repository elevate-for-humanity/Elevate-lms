import { describe, it, expect } from 'vitest';
import {
  shouldHideMarketingHeader,
  isAppRoute,
} from '@/lib/layout/app-routes';

describe('marketing header visibility', () => {
  it('keeps the shared header on education routes', () => {
    expect(shouldHideMarketingHeader('/education')).toBe(false);
    expect(shouldHideMarketingHeader('/education/foo')).toBe(false);
  });

  it('does not hide global header on marketing home', () => {
    expect(shouldHideMarketingHeader('/')).toBe(false);
    expect(shouldHideMarketingHeader('/programs')).toBe(false);
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
