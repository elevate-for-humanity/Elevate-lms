/**
 * GET /api/admin/apprenticeships/pending-hours
 * Returns progress_entries with status='pending', joined to profile + program.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  // progress_entries schema: apprentice_id, status IN ('draft','submitted','verified','disputed'),
  // verified_by nullable — unverified submitted entries need admin approval.
  const { data: entries, error } = await db
    .from('progress_entries')
    .select(`
      id, status, week_ending, hours_worked, tasks_completed, created_at,
      profiles:apprentice_id(full_name, email),
      apprenticeship_programs:program_id(name)
    `)
    .eq('status', 'submitted')
    .is('verified_by', null)
    .order('week_ending', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ entries: [] });
  return NextResponse.json({ entries: entries ?? [] });
}
