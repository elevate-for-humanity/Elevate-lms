/**
 * Canonical Dev Studio API authentication.
 *
 * Dev Studio is an operational control plane. API access is restricted to
 * platform administrators even if a route is called outside the Admin UI.
 * Destructive capabilities must apply additional permission checks at the
 * route/service layer (for example trigger_deployments or access_dev_tools).
 */

import { NextRequest } from 'next/server';
import { forbidden } from '@/lib/api/responses';
import { apiAuthGuard, type GuardedUser } from '@/lib/admin/guards';

const DEV_STUDIO_ROLES = new Set(['admin', 'super_admin']);

export async function apiRequireDevStudio(req?: NextRequest): Promise<GuardedUser> {
  const user = await apiAuthGuard(req);
  if (user.error) return user;

  if (!user.role || !DEV_STUDIO_ROLES.has(user.role)) {
    return { ...user, error: forbidden() };
  }

  return user;
}
