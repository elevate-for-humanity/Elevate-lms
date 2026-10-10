import { describe, expect, it } from 'vitest';
import {
  getProductionHostingPlatform,
  GOOGLE_CLOUD_SERVICES,
  PRODUCTION_HOSTING_PLATFORM,
} from '@/lib/platform/hosting';

describe('platform hosting', () => {
  it('production platform is google-cloud-run', () => {
    expect(PRODUCTION_HOSTING_PLATFORM).toBe('google-cloud-run');
    expect(getProductionHostingPlatform()).toBe('google-cloud-run');
  });

  it('exposes Google Cloud Run service ids', () => {
    expect(GOOGLE_CLOUD_SERVICES.lms).toBe('elevate-lms-migration');
    expect(GOOGLE_CLOUD_SERVICES.admin).toBe('elevate-admin-migration');
  });
});
