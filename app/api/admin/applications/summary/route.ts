
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

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

  const { data, error } = await db
    .from('applications')
    .select('status, program_slug');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by program_slug + status
  const counts: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const slug = row.program_slug ?? 'unknown';
    const status = row.status ?? 'unknown';
    if (!counts[slug]) counts[slug] = {};
    counts[slug][status] = (counts[slug][status] ?? 0) + 1;
  }

  // Flatten to array for easy consumption
  const summary = Object.entries(counts).flatMap(([program_slug, statuses]) =>
    Object.entries(statuses).map(([status, count]) => ({ program_slug, status, count })),
  ).sort((a, b) => a.program_slug.localeCompare(b.program_slug) || a.status.localeCompare(b.status));

  return NextResponse.json(summary);
}
