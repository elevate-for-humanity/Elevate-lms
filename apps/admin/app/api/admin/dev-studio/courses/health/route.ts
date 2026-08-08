import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let coursesTablePassed = false;
    let coursesMessage = 'Courses table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('courses').select('id').limit(1);
      coursesTablePassed = !error;
      coursesMessage = error ? error.message : 'Courses table query succeeded.';
    } catch (err) {
      coursesMessage = err instanceof Error ? err.message : 'Courses table query failed.';
    }

    let lessonsTablePassed = false;
    let lessonsMessage = 'Lessons table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('lessons').select('id').limit(1);
      lessonsTablePassed = !error;
      lessonsMessage = error ? error.message : 'Lessons table query succeeded.';
    } catch (err) {
      lessonsMessage = err instanceof Error ? err.message : 'Lessons table query failed.';
    }

    return buildCapabilityHealth('courses', [
      { name: 'courses-table', passed: coursesTablePassed, required: true, message: coursesMessage },
      { name: 'lessons-table', passed: lessonsTablePassed, required: true, message: lessonsMessage },
    ]);
  });
}
