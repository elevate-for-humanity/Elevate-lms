import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// POST /api/discussions/like
// Increments likes on program_discussions — matches app/programs/[program]/discussions/[threadId]/page.tsx
async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await req.json();
    if (!threadId) {
      return NextResponse.json({ error: 'threadId required' }, { status: 400 });
    }

    const { data: thread } = await supabase
      .from('program_discussions')
      .select('likes')
      .eq('id', threadId)
      .maybeSingle();

    const newLikes = (thread?.likes || 0) + 1;

    await supabase
      .from('program_discussions')
      .update({ likes: newLikes })
      .eq('id', threadId);

    return NextResponse.json({ ok: true, likes: newLikes });
  } catch {
    return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/discussions/like', _POST);
