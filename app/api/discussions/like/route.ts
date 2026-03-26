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

    const { threadId } = await req.json();

    // Toggle like via RPC or direct update
    const { data: thread } = await supabase
      .from('discussion_threads')
      .select('likes')
      .eq('id', threadId)
      .single();

    const currentLikes = thread?.likes || 0;

    await supabase
      .from('discussion_threads')
      .update({ likes: currentLikes + 1 })
      .eq('id', threadId);

    return NextResponse.json({ ok: true, likes: currentLikes + 1 });
  } catch {
    return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/discussions/like', _POST);
