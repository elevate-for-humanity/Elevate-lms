import { describe, expect, it } from 'vitest';
import {
  getProductionHostingPlatform,
  GOOGLE_SERVICES,
  PRODUCTION_HOSTING_PLATFORM,
} from '@/lib/platform/hosting';

describe('platform hosting', () => {
  it('production platform is Google', () => {
    expect(PRODUCTION_HOSTING_PLATFORM).toBe('google-cloud');
    expect(getProductionHostingPlatform()).toBe('google-cloud');
  });

  it('maps every production compute surface to its Google target', () => {
    expect(GOOGLE_SERVICES).toEqual({
      marketing: 'elevate-marketing-migration', admin: 'elevate-admin-migration',
      lms: 'elevate-lms-migration', store: 'elevate-store-migration',
      courseBuilder: 'elevate-course-builder', studioBrowser: 'elevate-studio-browser',
    });
  });
});
