import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * RETIRED: independent course publication HTTP authority.
 *
 * Publication, procurement validation, audit logging, and immutable version
 * snapshotting are owned by /api/admin/course-builder action publish-persisted.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Publish through /api/admin/course-builder with action publish-persisted.',
      endpoint: '/api/admin/course-builder',
      action: 'publish-persisted',
    },
    { status: 410 },
  );
}
