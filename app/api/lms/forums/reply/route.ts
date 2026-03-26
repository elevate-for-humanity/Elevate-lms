import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { threadId: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { threadId, content } = body;

  if (!threadId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing threadId or content' }, { status: 400 });
  }

  // Verify thread exists and is not locked
  const { data: thread, error: threadError } = await supabase
    .from('forum_threads')
    .select('id, is_locked')
    .eq('id', threadId)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  if (thread.is_locked) {
    return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });
  }

  // Create reply
  const { data: reply, error } = await supabase
    .from('forum_replies')
    .insert({
      thread_id: threadId,
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  }

  return NextResponse.json({ reply }, { status: 201 });
}
export const POST = withApiAudit('/api/lms/forums/reply', _POST);
