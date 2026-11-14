/**
 * Storage Signed URL API - Admin
 * Requires admin authentication
 */
import { signAuthenticatedFile } from '@/lib/storage/authenticated-signing';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';
const handleGet: AuthHandler = (req, context) =>
  signAuthenticatedFile(req, context.user.id, 'admin');

// Wrap handler with admin authentication
export const GET = withAuth(handleGet, { roles: ['admin', 'super_admin', 'instructor', 'staff'] });
