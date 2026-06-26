/**
 * GET  /api/mentor/messages
 * POST /api/mentor/messages
 *
 * Mentor ↔ mentee messaging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

const ALLOWED_ROLES = ['mentor', 'admin'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  const { searchParams } = req.nextUrl;
  const mentorship_id = searchParams.get('mentorship_id');
  const limit = Math.min(100, Number(searchParams.get('limit') ?? 50));

  try {
    const supabase = await getAdminClient();
    let q = supabase
      .from('mentor_messages')
      .select('id, content, sender_id, created_at, read_at, mentorship_id, profiles!mentor_messages_sender_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (mentorship_id) q = q.eq('mentorship_id', mentorship_id) as typeof q;
    else if (auth.role === 'mentor') {
      const { data: myMentorships } = await supabase.from('mentorships').select('id').eq('mentor_id', auth.id);
      const ids = (myMentorships ?? []).map((m: { id: string }) => m.id);
      if (ids.length === 0) return NextResponse.json({ messages: [] });
      q = q.in('mentorship_id', ids) as typeof q;
    }

    const { data, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch messages');
    return NextResponse.json({ messages: data ?? [] });
  } catch (err) { return safeInternalError(err, 'Failed to fetch messages'); }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const { mentorship_id, content } = await req.json();
    if (!mentorship_id || !content?.trim()) return safeError('mentorship_id and content are required', 400);

    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from('mentor_messages')
      .insert({ mentorship_id, content: content.trim(), sender_id: auth.id })
      .select('id, content, created_at')
      .single();

    if (error) return safeDbError(error, 'Failed to send message');
    return NextResponse.json(data, { status: 201 });
  } catch (err) { return safeInternalError(err, 'Failed to send message'); }
}
