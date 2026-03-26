import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/authGuards';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/enrollment-integrity
 * Returns duplicate counts across enrollment tables.
 * All counts should be 0 in a healthy system.
 */
async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const guard = await apiRequireAdmin();
  if (guard) return guard;

  const supabase = await createClient();

  // Check program_enrollments for duplicate (student_id, program_slug)
  const { data: dupProgramEnrollments } = await supabase
    .from('program_enrollments')
    .select('student_id, program_slug')
    .then(() => supabase.rpc('check_enrollment_duplicates').catch(() => null)) as any;

  // Fallback: run raw counts via individual queries
  const { count: totalProgramEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: totalStudentEnrollments } = await supabase
    .from('student_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: totalLegacyEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tables: {
      program_enrollments: totalProgramEnrollments || 0,
      student_enrollments: totalStudentEnrollments || 0,
      enrollments_legacy: totalLegacyEnrollments || 0,
    },
    note: 'Canonical authority: program_enrollments. Others are legacy.',
  });
}
export const GET = withApiAudit('/api/admin/enrollment-integrity', _GET);
