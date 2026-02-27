import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: Request) {
  try {
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let query = db
      .from('discussion_threads')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ threads: [] });
    }

    return NextResponse.json({ threads: data || [] });
  } catch {
    return NextResponse.json({ threads: [] });
  }
}

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { courseId, title, body } = await req.json();

    const { data, error } = await db
      .from('discussion_threads')
      .insert({
        course_id: courseId,
        title,
        body,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    return NextResponse.json({ thread: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/discussions/threads', _GET);
export const POST = withApiAudit('/api/discussions/threads', _POST);
