import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { title, category, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('discussion_threads')
      .insert({
        title,
        category: category || 'general',
        body: content,
        author_id: user.id,
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
    }

    return NextResponse.json({ discussion: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/community/discussions', _POST);
