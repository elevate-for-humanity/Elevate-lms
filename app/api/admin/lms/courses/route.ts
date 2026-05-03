import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { createDraftCourse } from '@/lib/lms/course-service';
import { safeInternalError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { slug, title, modules = [], ...rest } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const course = await createDraftCourse(supabase, {
      actorUserId: auth.id,
      slug,
      title,
      modules,
      ...rest,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create course');
  }
}
