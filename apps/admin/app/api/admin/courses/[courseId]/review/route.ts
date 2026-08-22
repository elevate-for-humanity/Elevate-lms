import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * RETIRED: course human-review mutations are owned by the Course Builder root.
 * Use action review-lessons for lesson approval/rejection and action
 * review-course for the course review state machine.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Use /api/admin/course-builder for course review mutations.',
      endpoint: '/api/admin/course-builder',
      actions: ['review-lessons', 'review-course'],
    },
    { status: 410 },
  );
}
