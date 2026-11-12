import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const checks = {
      courses: { passed: false, message: 'Courses table unavailable.' },
      modules: { passed: false, message: 'Course modules table unavailable.' },
      lessons: { passed: false, message: 'Course lessons table unavailable.' },
      queue: { passed: false, message: 'Course build queue unavailable.' },
      expiredLeases: { passed: false, message: 'Could not inspect expired build leases.' },
      failedJobs: { passed: false, message: 'Could not inspect failed build jobs.' },
    };

    try {
      const db = await requireAdminClient();
      const [coursesResult, modulesResult, lessonsResult, queueResult, leasesResult, failedResult] = await Promise.all([
        db.from('courses').select('id').limit(1),
        db.from('course_modules').select('id').limit(1),
        db.from('course_lessons').select('id').limit(1),
        db.from('ultimate_build_jobs').select('id').limit(1),
        db.from('ultimate_build_jobs').select('id', { count: 'exact', head: true }).eq('status', 'running').lt('lease_expires_at', new Date().toISOString()),
        db.from('ultimate_build_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', new Date(Date.now() - 86400000).toISOString()),
      ]);

      checks.courses = {
        passed: !coursesResult.error,
        message: coursesResult.error ? 'Canonical courses table query failed.' : 'Canonical courses table query succeeded.',
      };
      checks.modules = {
        passed: !modulesResult.error,
        message: modulesResult.error ? 'Canonical course_modules table query failed.' : 'Canonical course_modules table query succeeded.',
      };
      checks.lessons = {
        passed: !lessonsResult.error,
        message: lessonsResult.error ? 'Canonical course_lessons table query failed.' : 'Canonical course_lessons table query succeeded.',
      };
      checks.queue = { passed: !queueResult.error, message: queueResult.error ? 'Course build queue query failed.' : 'Course build queue reachable.' };
      checks.expiredLeases = { passed: !leasesResult.error && (leasesResult.count ?? 0) === 0, message: leasesResult.error ? 'Expired lease query failed.' : `${leasesResult.count ?? 0} running build jobs have expired leases.` };
      checks.failedJobs = { passed: !failedResult.error && (failedResult.count ?? 0) === 0, message: failedResult.error ? 'Failed job query failed.' : `${failedResult.count ?? 0} course build jobs failed in the last 24 hours.` };
    } catch {
      const message = 'Course Builder database probe failed.';
      checks.courses.message = message;
      checks.modules.message = message;
      checks.lessons.message = message;
      checks.queue.message = message;
      checks.expiredLeases.message = message;
      checks.failedJobs.message = message;
    }

    return buildCapabilityHealth('courses', [
      { name: 'courses-table', passed: checks.courses.passed, required: true, message: checks.courses.message },
      { name: 'course-modules-table', passed: checks.modules.passed, required: true, message: checks.modules.message },
      { name: 'course-lessons-table', passed: checks.lessons.passed, required: true, message: checks.lessons.message },
      { name: 'build-job-queue', passed: checks.queue.passed, required: true, message: checks.queue.message },
      { name: 'expired-build-leases', passed: checks.expiredLeases.passed, required: false, message: checks.expiredLeases.message },
      { name: 'recent-failed-builds', passed: checks.failedJobs.passed, required: false, message: checks.failedJobs.message },
    ]);
  });
}
