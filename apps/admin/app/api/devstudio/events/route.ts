/**
 * GET /api/devstudio/events
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
import { createAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const limit    = Math.min(Number(searchParams.get('limit') ?? 30), 200);
  const category = searchParams.get('category');
  const severity = searchParams.get('severity');
  const since    = searchParams.get('since');

  try {
    const supabase = createAdminClient();
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
      // Table may not exist yet — return empty gracefully, no internal details exposed
      return NextResponse.json({ events: [], error: 'Failed to load events' });
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch events');
  }
}
