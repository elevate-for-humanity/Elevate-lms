import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/enrollment-integrity
 * Returns row counts across enrollment tables.
 * All counts should be 0 in a healthy system.
 */
async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // apiRequireAdmin must receive request — calling it with no args returns the
  // user object (truthy), so the guard fires immediately and leaks PII as the
  // response body while the handler never executes.
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = await createClient();

  const [
    { count: totalProgramEnrollments },
    { count: totalStudentEnrollments },
    { count: totalLegacyEnrollments },
  ] = await Promise.all([
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('student_enrollments').select('*', { count: 'exact', head: true }),
    // training_enrollments is the legacy table — was incorrectly querying
    // program_enrollments again, producing a duplicate count
    supabase.from('training_enrollments').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tables: {
      program_enrollments: totalProgramEnrollments ?? 0,
      student_enrollments: totalStudentEnrollments ?? 0,
      training_enrollments: totalLegacyEnrollments ?? 0,
    },
    note: 'Canonical authority: program_enrollments. Others are legacy.',
  });
}

export const GET = withApiAudit('/api/admin/enrollment-integrity', _GET);
