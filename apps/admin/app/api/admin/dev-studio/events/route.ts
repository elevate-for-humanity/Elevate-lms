/**
 * GET /api/admin/dev-studio/events
 *
 * Returns recent platform events for the Command Center dashboard.
 *
 * Query params:
 *   ?limit=30
 *   ?category=lms|enrollment|deployment|payment|auth|ai|compliance
 *   ?severity=info|warning|error|critical
 *   ?since=<ISO date>
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const requestedLimit = Number(searchParams.get('limit') ?? 30);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.trunc(requestedLimit), 200)) : 30;
  const category = searchParams.get('category');
  const severity = searchParams.get('severity');
  const since    = searchParams.get('since');

  if (since && !Number.isFinite(Date.parse(since))) return safeError('Invalid since date', 400);

  try {
    const supabase = await requireAdminClient();
    let q = supabase
      .from('platform_events')
      .select('id, event_type, category, severity, message, created_at, payload, actor_type, subject_type')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) q = q.eq('category', category) as typeof q;
    if (severity) q = q.eq('severity', severity) as typeof q;
    if (since)    q = q.gte('created_at', since) as typeof q;

    const { data, error } = await q;
    if (error) {
      return safeError('Failed to load events', 503);
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch events');
  }
}
