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

    const { threadId, body } = await req.json();

    if (!threadId || !body) {
      return NextResponse.json({ error: 'Thread ID and body are required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('discussion_replies')
      .insert({
        thread_id: threadId,
        body,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
    }

    // Update reply count on thread
    await db.rpc('increment_reply_count', { thread_id: threadId }).catch(() => {});

    return NextResponse.json({
      reply: {
        ...data,
        author_name: profile?.full_name || 'Anonymous',
        author_avatar: profile?.avatar_url,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/discussions/reply', _POST);
