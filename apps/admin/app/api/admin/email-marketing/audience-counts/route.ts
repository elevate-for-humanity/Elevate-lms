// Returns live recipient counts for each email audience segment.
// Used by the campaign composer to show real contact counts.
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  try {
    const [
      allStudents,
      activeStudents,
      newApplicants,
      programCompleters,
      employers,
      workoneContacts,
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      db
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'pending', 'in_review']),
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employer'),
      db.from('wioa_participants').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      'all-students': allStudents.count ?? 0,
      'active-students': activeStudents.count ?? 0,
      'new-applicants': newApplicants.count ?? 0,
      'program-completers': programCompleters.count ?? 0,
      employers: employers.count ?? 0,
      workone: workoneContacts.count ?? 0,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load audience counts');
  }
}
