/**
 * GET /api/mentor/mentees
 *
 * Returns the authenticated mentor's active mentees with progress data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

const ALLOWED_ROLES = ['mentor', 'admin'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? 'active';

  try {
    const supabase = await getAdminClient();

    // Admins see all mentorships; mentors see only their own
    let q = supabase
      .from('mentorships')
      .select(`
        id, status, started_at, notes,
        mentee_id,
        profiles!mentorships_mentee_id_fkey(id, full_name, email, avatar_url),
        mentor_sessions(id, scheduled_at, status)
      `)
      .eq('status', status)
      .order('started_at', { ascending: false });

    if (auth.role === 'mentor') {
      q = q.eq('mentor_id', auth.id) as typeof q;
    }

    const { data, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch mentees');

    return NextResponse.json({ mentees: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch mentees');
  }
}
