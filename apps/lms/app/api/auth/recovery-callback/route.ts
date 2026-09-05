import { handleOAuthCallback } from '@/lib/api/auth/shared-route-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dedicated Supabase recovery callback.
 *
 * Keep password recovery on an API route so installed PWAs and stale service
 * workers cannot replace the one-time code exchange with the offline page.
 */
export async function GET(request: Request) {
  return handleOAuthCallback(request, '/reset-password?mode=recovery');
}
