import { describe, expect, it } from 'vitest';
import { isLikelyTestOrDemoRecord } from '@/lib/admin/dashboard/format-metrics';

describe('isLikelyTestOrDemoRecord', () => {
  it('flags legacy dashboard sentinel names and demo emails', () => {
    expect(isLikelyTestOrDemoRecord('Marcus Johnson')).toBe(true);
    expect(isLikelyTestOrDemoRecord('Sarah Chen')).toBe(true);
    expect(isLikelyTestOrDemoRecord('marcus.j@elevateforhumanity.org')).toBe(false);
    expect(isLikelyTestOrDemoRecord('marcus.j@test.elevate.edu')).toBe(true);
    expect(isLikelyTestOrDemoRecord('Sample Applicant')).toBe(true);
  });

  it('allows real production names', () => {
    expect(isLikelyTestOrDemoRecord('Jordan Smith', 'jordan@gmail.com')).toBe(false);
  });

  it('flags example.com style sandbox emails', () => {
    expect(isLikelyTestOrDemoRecord('Jordan Smith', 'jordan@example.com')).toBe(true);
  });
});
