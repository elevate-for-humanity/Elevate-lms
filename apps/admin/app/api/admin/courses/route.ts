import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeDbError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CourseInput = {
  title: string;
  slug: string;
  description: string;
  programId?: string;
  status?: 'draft' | 'published';
};

export const GET = withAuth(async () => {
  try {
    const db = await requireAdminClient();
    const { data, error } = await db.from('courses').select('*').order('updated_at', { ascending: false });
    if (error) return safeDbError(error, 'Unable to load courses');
    return NextResponse.json(
      { courses: data ?? [], count: data?.length ?? 0 },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return safeInternalError(error, 'Unable to load courses');
  }
}, { roles: API_ADMIN_ROLES });

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const input = (await request.json()) as CourseInput;
    if (!input.title || !input.slug || !input.description) {
      return NextResponse.json(
        { error: 'title, slug, and description are required' },
        { status: 400 },
      );
    }

    const db = await requireAdminClient();
    const { data, error } = await db.from('courses').insert({
        title: input.title,
        slug: input.slug,
        description: input.description,
        program_id: input.programId || null,
        status: input.status ?? 'draft',
        updated_at: new Date().toISOString(),
      }).select('*').single();
    if (error) return safeDbError(error, 'Unable to create course');
    return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return safeInternalError(error, 'Unable to create course');
  }
}, { roles: API_ADMIN_ROLES });
