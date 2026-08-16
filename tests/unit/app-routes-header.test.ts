import { describe, it, expect } from 'vitest';
import { shouldHideMarketingHeader, isAppRoute } from '@/lib/layout/app-routes';

describe('marketing header visibility', () => {
  it('hides the global header on routes with dedicated marketing headers', () => {
    expect(shouldHideMarketingHeader('/about')).toBe(true);
    expect(shouldHideMarketingHeader('/about/team')).toBe(true);
  });

  it('keeps the global header on standard marketing routes', () => {
    expect(shouldHideMarketingHeader('/')).toBe(false);
    expect(shouldHideMarketingHeader('/programs')).toBe(false);
    expect(shouldHideMarketingHeader('/education')).toBe(false);
  });

  it('identifies authenticated application routes for chrome suppression', () => {
    expect(isAppRoute('/lms/dashboard')).toBe(true);
    expect(isAppRoute('/apprentice')).toBe(true);
    expect(isAppRoute('/employer/dashboard')).toBe(true);
    expect(isAppRoute('/')).toBe(false);
    expect(isAppRoute('/education')).toBe(false);
  });

  it('keeps canonical admin and LMS routes classified as app routes', () => {
    expect(isAppRoute('/admin')).toBe(true);
    expect(isAppRoute('/admin/studio')).toBe(true);
    expect(isAppRoute('/lms/dashboard')).toBe(true);
    expect(isAppRoute('/programs')).toBe(false);
  });
});
