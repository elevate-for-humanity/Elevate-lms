import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Retired compatibility endpoint.
 *
 * Course creation has exactly one HTTP authority:
 *   POST /api/admin/course-builder -> lib/course-factory
 * Persisted publication still crosses the canonical course publisher/procurement gate.
 *
 * This endpoint intentionally performs no writes.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      error: 'LEGACY_COURSE_PUBLISHER_RETIRED',
      message: 'Use the Unified Course Builder. Generate through /api/admin/course-builder and publish only through the canonical Course Factory publication gate.',
      canonicalGenerationEndpoint: '/api/admin/course-builder',
    },
    { status: 410 },
  );
}
