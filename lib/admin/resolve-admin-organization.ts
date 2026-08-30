import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

interface AdminIdentity {
  id: string;
  email?: string | null;
  role?: string | null;
}

export interface ResolvedAdminOrganization {
  organizationId: string;
  userId: string;
  role: string;
}

const PLATFORM_ORGANIZATION_NAME = 'Elevate for Humanity';

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

/**
 * Resolve the content owner for the standalone Admin platform.
 *
 * Admin authorization is established by apiRequireAdmin/middleware. Store
 * memberships are only consulted when an administrator explicitly requests a
 * partner organization. With no explicit selection, Studio content belongs to
 * Elevate's platform organization and can never be redirected by Store billing
 * or by an administrator's personal/partner memberships.
 */
export async function resolveAdminOrganization(
  auth: AdminIdentity,
  requestedOrganizationId?: string | null,
): Promise<ResolvedAdminOrganization> {
  const db = await requireAdminClient();

  if (requestedOrganizationId) {
    const { data: membership, error } = await db
      .from('organization_users')
      .select('organization_id, role, status')
      .eq('user_id', auth.id)
      .eq('organization_id', requestedOrganizationId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to resolve organization membership: ${error.message}`);
    }
    if (!membership) {
      throw new Error(
        'The requested organization is not available to this administrator.',
      );
    }

    return {
      organizationId: membership.organization_id,
      userId: auth.id,
      role: membership.role ?? auth.role ?? 'admin',
    };
  }

  const configuredOrganizationId =
    process.env.ADMIN_PLATFORM_ORGANIZATION_ID?.trim();

  if (isUuid(configuredOrganizationId)) {
    const { data: configured, error } = await db
      .from('organizations')
      .select('id')
      .eq('id', configuredOrganizationId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to resolve the Admin platform organization: ${error.message}`);
    }
    if (configured?.id) {
      return {
        organizationId: configured.id,
        userId: auth.id,
        role: auth.role ?? 'admin',
      };
    }
  }

  const { data: platformOrganization, error } = await db
    .from('organizations')
    .select('id')
    .eq('name', PLATFORM_ORGANIZATION_NAME)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve the Admin platform organization: ${error.message}`);
  }
  if (!platformOrganization?.id) {
    throw new Error(
      'The standalone Admin platform organization is not configured.',
    );
  }

  return {
    organizationId: platformOrganization.id,
    userId: auth.id,
    role: auth.role ?? 'admin',
  };
}
