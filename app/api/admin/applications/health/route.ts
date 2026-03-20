export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// SLA thresholds in hours
const SLA_HOURS: Record<string, number> = {
  submitted:  48,
  in_review:  72,
  approved:   24,
};

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = createAdminClient();
  if (!supabase || !db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: rows, error } = await db
    .from('applications')
    .select('id, status, program_slug, updated_at, created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();

  // Counts by status
  const counts: Record<string, number> = {};
  // Avg hours in current status per stage
  const totalHours: Record<string, number> = {};
  const stageCounts: Record<string, number> = {};
  // Stuck: in a non-terminal status past SLA threshold
  const stuck: Array<{ id: string; status: string; program_slug: string | null; hours_in_status: number; sla_hours: number }> = [];

  for (const row of rows ?? []) {
    const status = row.status ?? 'unknown';
    counts[status] = (counts[status] ?? 0) + 1;

    const since = new Date(row.updated_at ?? row.created_at).getTime();
    const hoursInStatus = (now - since) / (1000 * 60 * 60);

    if (SLA_HOURS[status] !== undefined) {
      totalHours[status] = (totalHours[status] ?? 0) + hoursInStatus;
      stageCounts[status] = (stageCounts[status] ?? 0) + 1;

      if (hoursInStatus > SLA_HOURS[status]) {
        stuck.push({
          id: row.id,
          status,
          program_slug: row.program_slug,
          hours_in_status: Math.round(hoursInStatus),
          sla_hours: SLA_HOURS[status],
        });
      }
    }
  }

  // Avg time per stage
  const avg_hours_by_stage: Record<string, number> = {};
  for (const stage of Object.keys(totalHours)) {
    avg_hours_by_stage[stage] = Math.round(totalHours[stage] / stageCounts[stage]);
  }

  // Program bottlenecks: programs with most stuck applications
  const bottlenecks: Record<string, number> = {};
  for (const s of stuck) {
    const slug = s.program_slug ?? 'unknown';
    bottlenecks[slug] = (bottlenecks[slug] ?? 0) + 1;
  }
  const top_bottlenecks = Object.entries(bottlenecks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([program_slug, stuck_count]) => ({ program_slug, stuck_count }));

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    total: rows?.length ?? 0,
    counts_by_status: counts,
    avg_hours_by_stage,
    sla_thresholds_hours: SLA_HOURS,
    stuck_count: stuck.length,
    top_bottlenecks,
    stuck,
  });
}
