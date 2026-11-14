import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import {
  listAllCredentials,
  searchAvailableCredentials,
  getCredentialBySlug,
} from '@/lib/course-builder/credential-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return NextResponse.json(
    {
      error: 'PARALLEL_COURSE_BUILDER_RETIRED',
      message: 'Course generation is owned exclusively by /api/admin/course-builder.',
      canonicalEndpoint: '/api/admin/course-builder',
    },
    { status: 410 },
  );
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
