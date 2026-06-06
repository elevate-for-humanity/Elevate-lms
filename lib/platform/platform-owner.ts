import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/lib/rbac/role-matrix';
import {
  resolvePermissionLevel,
  type PlatformPermissionLevel,
  canAccessDevStudio,
  canProvisionWorkspaces,
  canDeployCode,
} from '@/lib/platform/permission-levels';

export type PlatformUserContext = {
  userId: string;
  profileRole: UserRole | null;
  tenantId: string | null;
  isPlatformOwnerTenant: boolean;
  permissionLevel: PlatformPermissionLevel;
  canAccessDevStudio: boolean;
  canProvisionWorkspaces: boolean;
  canDeployCode: boolean;
};

export function getPlatformOwnerTenantIdFromEnv(): string | null {
  const raw = process.env.PLATFORM_OWNER_TENANT_ID?.trim();
  return raw || null;
}

export async function fetchPlatformOwnerTenantId(): Promise<string | null> {
  const fromEnv = getPlatformOwnerTenantIdFromEnv();
  if (fromEnv) return fromEnv;

  const db = await requireAdminClient();
  if (!db) return null;

  const { data: setting } = await db
    .from('platform_settings')
    .select('value')
    .eq('key', 'PLATFORM_OWNER_TENANT_ID')
    .maybeSingle();

  if (setting?.value && typeof setting.value === 'string') {
    const trimmed = setting.value.trim();
    if (trimmed) return trimmed;
  }

  const { data: tenant } = await db
    .from('tenants')
    .select('id')
    .eq('is_platform_owner', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return tenant?.id ?? null;
}

export function isUserOnPlatformOwnerTenant(
  userTenantId: string | null | undefined,
  platformOwnerTenantId: string | null,
): boolean {
  if (!userTenantId || !platformOwnerTenantId) return false;
  return userTenantId === platformOwnerTenantId;
}

export async function getPlatformUserContext(userId: string): Promise<PlatformUserContext | null> {
  const db = await requireAdminClient();
  if (!db) return null;

  const [profileRes, ownerTenantId] = await Promise.all([
    db.from('profiles').select('role, tenant_id').eq('id', userId).maybeSingle(),
    fetchPlatformOwnerTenantId(),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const profileRole = (profile.role as UserRole | null) ?? null;
  const tenantId = (profile.tenant_id as string | null) ?? null;
  const onOwnerTenant = isUserOnPlatformOwnerTenant(tenantId, ownerTenantId);
  const permissionLevel = resolvePermissionLevel({
    profileRole,
    isPlatformOwnerTenant: onOwnerTenant,
  });

  return {
    userId,
    profileRole,
    tenantId,
    isPlatformOwnerTenant: onOwnerTenant,
    permissionLevel,
    canAccessDevStudio: canAccessDevStudio(permissionLevel),
    canProvisionWorkspaces: canProvisionWorkspaces(permissionLevel),
    canDeployCode: canDeployCode(permissionLevel),
  };
}

export async function getCurrentPlatformUserContext(): Promise<PlatformUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getPlatformUserContext(user.id);
}
