import { describe, expect, it } from 'vitest';
import {
  resolvePermissionLevel,
  canAccessDevStudio,
  canProvisionWorkspaces,
  canDeployCode,
} from '@/lib/platform/permission-levels';

describe('platform permission levels', () => {
  it('maps admin on owner tenant to platform_owner', () => {
    expect(
      resolvePermissionLevel({ profileRole: 'admin', isPlatformOwnerTenant: true }),
    ).toBe('platform_owner');
  });

  it('maps admin to platform_owner regardless of tenant membership', () => {
    expect(
      resolvePermissionLevel({ profileRole: 'admin', isPlatformOwnerTenant: false }),
    ).toBe('platform_owner');
  });

  it('maps admin to platform_owner regardless of tenant membership', () => {
    expect(
      resolvePermissionLevel({ profileRole: 'admin', isPlatformOwnerTenant: false }),
    ).toBe('platform_owner');
  });

  it('maps admin on owner tenant to platform_admin', () => {
    expect(
      resolvePermissionLevel({ profileRole: 'admin', isPlatformOwnerTenant: true }),
    ).toBe('platform_admin');
  });

  it('maps org_admin on customer tenant to organization_admin', () => {
    expect(
      resolvePermissionLevel({ profileRole: 'org_admin', isPlatformOwnerTenant: false }),
    ).toBe('organization_admin');
  });

  it('maps student to standard_user', () => {
    expect(
      resolvePermissionLevel({ profileRole: 'student', isPlatformOwnerTenant: false }),
    ).toBe('standard_user');
  });

  it('denies DevStudio to platform_admin', () => {
    expect(canAccessDevStudio('platform_admin')).toBe(false);
    expect(canAccessDevStudio('platform_owner')).toBe(true);
  });

  it('allows workspace provisioning for platform staff', () => {
    expect(canProvisionWorkspaces('platform_admin')).toBe(true);
    expect(canProvisionWorkspaces('organization_admin')).toBe(false);
  });

  it('restricts deploy to platform owner only', () => {
    expect(canDeployCode('platform_owner')).toBe(true);
    expect(canDeployCode('platform_admin')).toBe(false);
  });
});
