import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await req.json();

    // Toggle like via RPC or direct update
    const { data: thread } = await db
      .from('discussion_threads')
      .select('likes')
      .eq('id', threadId)
      .single();

    const currentLikes = thread?.likes || 0;

    await db
      .from('discussion_threads')
      .update({ likes: currentLikes + 1 })
      .eq('id', threadId);

    return NextResponse.json({ ok: true, likes: currentLikes + 1 });
  } catch {
    return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
  }
}
