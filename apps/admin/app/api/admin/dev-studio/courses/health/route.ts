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
    };

    try {
      const db = await requireAdminClient();
      const [coursesResult, modulesResult, lessonsResult] = await Promise.all([
        db.from('courses').select('id').limit(1),
        db.from('course_modules').select('id').limit(1),
        db.from('course_lessons').select('id').limit(1),
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
    } catch {
      const message = 'Course Builder database probe failed.';
      checks.courses.message = message;
      checks.modules.message = message;
      checks.lessons.message = message;
    }

    return buildCapabilityHealth('courses', [
      { name: 'courses-table', passed: checks.courses.passed, required: true, message: checks.courses.message },
      { name: 'course-modules-table', passed: checks.modules.passed, required: true, message: checks.modules.message },
      { name: 'course-lessons-table', passed: checks.lessons.passed, required: true, message: checks.lessons.message },
    ]);
  });
}
