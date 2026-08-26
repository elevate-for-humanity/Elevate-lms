import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import {
  buildIntegratedCourse,
  listAllCredentials,
  searchAvailableCredentials,
  getCredentialBySlug,
} from '@/lib/course-builder/integration';
import { logger } from '@/lib/logger';
import {
  courseBuilderCreditErrorResponse,
  refundCourseBuilderRequestCredits,
  reserveCourseBuilderRequestCredits,
  type CreditReservation,
} from '@/lib/course-builder/request-metering';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  let reservation: CreditReservation | null = null;
  try {
    const body = await request.json();
    const { userRequest, credentialSlug, options } = body;
    if (!userRequest)
      return NextResponse.json({ error: 'userRequest is required' }, { status: 400 });
    reservation = await reserveCourseBuilderRequestCredits({
      request,
      userId: auth.id,
      effectiveRoles: auth.effectiveRoles,
      operation: 'integrated',
      metadata: { credential_slug: credentialSlug ?? null },
    });
    const result = await buildIntegratedCourse({ userRequest, credentialSlug, options });
    if (!result.success) {
      await refundCourseBuilderRequestCredits(reservation, auth.id, 'integrated_build_failed');
      return NextResponse.json({ error: result.errors?.[0] || 'Build failed' }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      courseId: result.courseId,
      credential: {
        slug: result.credential.slug,
        name: result.credential.name,
        provider: result.credential.provider,
        category: result.credential.category,
      },
      qualityScore: result.qualityScore,
      readiness: {
        isReady: result.readiness.isReady,
        overallScore: result.readiness.overallScore,
        categories: result.readiness.categories.map((c) => ({
          name: c.name,
          score: c.score,
          passed: c.passed,
        })),
      },
    });
  } catch (error) {
    await refundCourseBuilderRequestCredits(reservation, auth.id, 'integrated_build_exception');
    const credits = courseBuilderCreditErrorResponse(error);
    if (credits) return credits;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Unified course builder API error: ${errorMessage}`);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const action = request.nextUrl.searchParams.get('action');
  const query = request.nextUrl.searchParams.get('q');
  const slug = request.nextUrl.searchParams.get('slug');
  if (action === 'list')
    return NextResponse.json({
      ok: true,
      credentials: listAllCredentials().map((c) => ({
        slug: c.slug,
        name: c.name,
        provider: c.provider,
        category: c.category,
        type: c.type,
        description: c.description,
      })),
    });
  if (action === 'search' && query)
    return NextResponse.json({
      ok: true,
      results: searchAvailableCredentials(query).map((c) => ({
        slug: c.slug,
        name: c.name,
        provider: c.provider,
      })),
    });
  if (action === 'info' && slug) {
    const credential = getCredentialBySlug(slug);
    if (!credential) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    return NextResponse.json({ ok: true, credential });
  }
  return NextResponse.json({
    ok: true,
    message: 'Unified Course Builder integrated credential API',
  });
}
