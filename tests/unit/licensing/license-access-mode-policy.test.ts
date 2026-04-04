/**
 * Policy tests for getLicenseAccessMode(null, role).
 *
 * These tests pin explicit policy decisions — not implementation details.
 * If any of these fail, a policy boundary has changed and must be reviewed
 * before the change is accepted.
 */
import { describe, it, expect } from 'vitest';
import { getLicenseAccessMode } from '@/lib/licensing/billing-authority';

describe('getLicenseAccessMode — null license policy', () => {
  it('admin with null license gets full access (explicit bypass policy)', () => {
    const result = getLicenseAccessMode(null, 'admin');
    expect(result.mode).toBe('full');
    expect(result.canRead).toBe(true);
    expect(result.canMutate).toBe(true);
    // Must use the bypass reason, not the normal 'full' reason,
    // so callers can distinguish intentional bypass from licensed access.
    expect(result.reason).toBe('no_license_admin_bypass');
  });

  it('super_admin with null license gets full access (explicit bypass policy)', () => {
    const result = getLicenseAccessMode(null, 'super_admin');
    expect(result.mode).toBe('full');
    expect(result.reason).toBe('no_license_admin_bypass');
  });

  it('non-admin with null license is blocked — fail closed', () => {
    const result = getLicenseAccessMode(null, 'student');
    expect(result.mode).toBe('blocked');
    expect(result.canRead).toBe(false);
    expect(result.canMutate).toBe(false);
  });

  it('null role with null license is blocked — fail closed', () => {
    const result = getLicenseAccessMode(null, null);
    expect(result.mode).toBe('blocked');
    expect(result.canRead).toBe(false);
    expect(result.canMutate).toBe(false);
  });

  it('undefined license behaves identically to null license', () => {
    const adminResult = getLicenseAccessMode(undefined, 'admin');
    expect(adminResult.mode).toBe('full');
    expect(adminResult.reason).toBe('no_license_admin_bypass');

    const studentResult = getLicenseAccessMode(undefined, 'student');
    expect(studentResult.mode).toBe('blocked');
  });

  it('bypass reason is distinguishable from normal full access', () => {
    // This test exists to prevent someone from "simplifying" the bypass
    // by returning reason: 'active' — which would make it indistinguishable
    // from a legitimately licensed admin.
    const bypass = getLicenseAccessMode(null, 'admin');
    expect(bypass.reason).not.toBe('active');
    expect(bypass.reason).not.toBe('full');
  });
});
