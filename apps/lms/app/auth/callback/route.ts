/**
 * LMS Auth Callback
 * Handles OAuth callback from Supabase Auth
 */
import { handleOAuthCallback } from '@/lib/api/auth/shared-route-handlers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleOAuthCallback(request, '/lms/dashboard');
}
