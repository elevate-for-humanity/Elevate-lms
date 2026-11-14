/**
 * GET /api/admin/service-health
 *
 * Returns a real service health snapshot: Supabase DB latency, SendGrid,
 * PayPal, QuickBooks, Redis, and runtime configuration. Unlike /api/admin/site-health (which
 * is a CDN HEAD ping), this checks actual service connectivity.
 *
 * Admin-only. Persists timestamped, non-sensitive connection evidence.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getSiteHealthSnapshot } from '@/lib/admin/get-site-health';
import { requireAdminClient } from '@/lib/supabase/admin';
import { recordRuntimeIntegrationEvidence } from '@/lib/integrations/runtime-evidence';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const snapshot = await getSiteHealthSnapshot();

  try {
    const monitoring = await recordRuntimeIntegrationEvidence(await requireAdminClient(), snapshot);
    return NextResponse.json({ ...snapshot, monitoring }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ ...snapshot, monitoring: { recorded: false, error: 'receipt_persistence_failed' } }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
