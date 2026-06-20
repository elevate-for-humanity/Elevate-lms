/**
 * GET /api/admin/service-health
 *
 * Returns a real service health snapshot: Supabase DB latency, SendGrid,
 * Stripe, Redis, and env var presence. Unlike /api/admin/site-health (which
 * is a CDN HEAD ping), this checks actual service connectivity.
 *
 * Admin-only. Cached for 60 s to avoid hammering external APIs on every
 * dashboard load.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getSiteHealthSnapshot } from '@/lib/admin/get-site-health';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const snapshot = await getSiteHealthSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      // Allow the client to cache for 60 s; revalidate in background.
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
    },
  });
}
