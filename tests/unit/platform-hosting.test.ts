import { describe, expect, it } from 'vitest';
import {
  getProductionHostingPlatform,
  NORTHFLANK_SERVICES,
  PRODUCTION_HOSTING_PLATFORM,
} from '@/lib/platform/hosting';

describe('platform hosting', () => {
  it('production platform is northflank', () => {
    expect(PRODUCTION_HOSTING_PLATFORM).toBe('northflank');
    expect(getProductionHostingPlatform()).toBe('northflank');
  });

  it('exposes Northflank service ids', () => {
    expect(NORTHFLANK_SERVICES.lms).toBe('elevate-lms');
    expect(NORTHFLANK_SERVICES.admin).toBe('elevate-admin');
  });
});
