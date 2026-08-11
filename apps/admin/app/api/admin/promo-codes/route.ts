/**
 * GET /api/admin/promo-codes
 * Returns active promo codes for admin management.
 */
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';
import type { AuthHandler } from '@/types/auth';

const handleGet: AuthHandler = async () => {
  // Promo-code persistence is not implemented yet; return a truthful empty state.
  return Response.json([]);
};

export const GET = withAuth(handleGet, { roles: API_ADMIN_ROLES });
