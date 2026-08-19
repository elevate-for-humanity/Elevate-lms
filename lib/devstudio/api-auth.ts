/**
 * Canonical Dev Studio API authentication.
 *
 * Dev Studio is an operational control plane. API access is restricted to
 * platform administrators even if a route is called outside the Admin UI.
 * Destructive capabilities must apply additional permission checks at the
 * route/service layer (for example trigger_deployments or access_dev_tools).
 */

import { NextRequest } from 'next/server';
import { apiRequireRoles, type GuardedUser } from '@/lib/admin/guards';

const DEV_STUDIO_ROLES = ['admin', 'super_admin'] as const;

export async function apiRequireDevStudio(req?: NextRequest): Promise<GuardedUser> {
  return apiRequireRoles(req, DEV_STUDIO_ROLES, { adminOverride: false });
}
