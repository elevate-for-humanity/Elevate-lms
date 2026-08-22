import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * RETIRED: independent Admin AI course-generation HTTP surface.
 *
 * Studio controls course authoring through /api/admin/course-builder. Blueprint
 * generation, complete generation, validation, media, repair and publication
 * all cross that canonical Course Builder boundary.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Use /api/admin/course-builder for course generation.',
      endpoint: '/api/admin/course-builder',
    },
    { status: 410 },
  );
}
