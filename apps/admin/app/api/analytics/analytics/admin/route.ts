import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { summarizeAdminLearning } from '@/lib/analytics/recorded-learning-summary';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const db = await requireAdminClient();
    const [learners, enrollments, courses, lessons, progress, activity] = await Promise.all([
      readHoursPages<{ id: string }>((from, to) => db.from('profiles').select('id').eq('role', 'student').order('id').range(from, to)),
      readHoursPages<any>((from, to) => db.from('program_enrollments').select('user_id,course_id,program_id,status,updated_at')
        .is('revoked_at', null).in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed']).order('id').range(from, to)),
      readHoursPages<{ id: string; title: string }>((from, to) => db.from('lms_courses').select('id,title').eq('status', 'published').order('id').range(from, to)),
      readHoursPages<{ id: string; course_id: string }>((from, to) => db.from('course_lessons').select('id,course_id').eq('is_published', true).order('id').range(from, to)),
      readHoursPages<{ user_id: string; lesson_id: string }>((from, to) => db.from('lesson_progress').select('user_id,lesson_id').eq('completed', true).order('id').range(from, to)),
      readHoursPages<any>((from, to) => db.from('learning_activity').select('user_id,student_id,activity_date,created_at,seconds_watched').order('id').range(from, to)),
    ]);
    return NextResponse.json(summarizeAdminLearning({ learners, enrollments, courses, lessons, progress, activity }), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return safeInternalError(error, 'Learning analytics unavailable');
  }
}
export const GET = withApiAudit('/api/analytics/analytics/admin', _GET);
