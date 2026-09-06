import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body } = accessErrorResponse(e);
    return NextResponse.json(body, { status });
  }

  const queryText = req.nextUrl.searchParams.get('q')?.trim().slice(0, 100);
  let query = supabase
    .from('lesson_notes')
    .select('id, position_seconds, body, created_at')
    .eq('lesson_id', lessonId)
    .eq('user_id', user.id);
  if (queryText) query = query.textSearch('body', queryText, { type: 'websearch' });
  const { data, error }: any = await query.order('created_at', { ascending: false }).limit(200);

  if (error) {
    logger.error(
      'notes GET error',
      normalizeError(error, 'Failed to fetch notes'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ notes: data || [] });
}

async function _POST(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body: errBody } = accessErrorResponse(e);
    return NextResponse.json(errBody, { status });
  }

  const body = await req.json();
  const { text, body: noteBody, positionSeconds } = body;

  const noteText = text || noteBody;

  if (typeof noteText !== 'string' || !noteText.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }
  if (noteText.trim().length > 10000) {
    return NextResponse.json({ error: 'Note exceeds 10,000 characters' }, { status: 400 });
  }
  if (
    positionSeconds != null &&
    (typeof positionSeconds !== 'number' ||
      !Number.isFinite(positionSeconds) ||
      positionSeconds < 0)
  ) {
    return NextResponse.json(
      { error: 'positionSeconds must be a positive number' },
      { status: 400 },
    );
  }

  const { data: note, error } = await supabase
    .from('lesson_notes')
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      body: noteText.trim(),
      position_seconds: typeof positionSeconds === 'number' ? Math.floor(positionSeconds) : null,
    })
    .select('id, position_seconds, body, created_at')
    .single();

  if (error) {
    logger.error(
      'notes POST error',
      normalizeError(error, 'Failed to create note'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ note }, { status: 201 });
}
export const GET = withApiAudit(
  '/api/lessons/[lessonId]/notes',
  _GET as unknown as (req: Request, ...args: any[]) => Promise<Response>,
);
export const POST = withApiAudit(
  '/api/lessons/[lessonId]/notes',
  _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>,
);
