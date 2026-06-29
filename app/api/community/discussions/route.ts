export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeGetUser } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError } from '@/lib/api/safe-error';

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    if (authRes.error || !authRes.data.user) return safeError('Unauthorized', 401);
    const user = authRes.data.user;

    if (!user) {
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


