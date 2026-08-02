/**
 * GET /api/admin/promo-codes
 * Returns active promo codes for admin management.
 * Protected: requires authentication.
 */
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

const handleGet: AuthHandler = async () => {
  // TODO: Replace with real database query when promo-codes table is implemented
  return Response.json([]);
};

export const GET = withAuth(handleGet);
