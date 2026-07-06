import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// POST /api/discussions/reply
// Writes to program_discussion_replies — matches app/programs/[program]/discussions/[threadId]/page.tsx
async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Accept both 'content' (page sends this) and 'body' (legacy field name)
    const payload = await req.json();
    const { threadId, content, body } = payload;
    const replyContent = content ?? body;

    if (!threadId || !replyContent) {
      return NextResponse.json({ error: 'threadId and content are required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from('program_discussion_replies')
      .insert({ thread_id: threadId, content: replyContent, author_id: user.id })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
    }

    return NextResponse.json({
      reply: { ...data, author_name: profile?.full_name || 'Anonymous', author_avatar: profile?.avatar_url },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/discussions/reply', _POST);
