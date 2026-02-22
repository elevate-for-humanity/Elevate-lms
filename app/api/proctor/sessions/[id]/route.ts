import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const ALLOWED_ROLES = ['admin', 'super_admin', 'staff', 'instructor'];

async function getProctor() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null;
  return { supabase, user, profile };
}

// GET /api/proctor/sessions/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { supabase } = ctx;

    const { data, error } = await db
      .from('exam_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: data });
  } catch (err) {
    logger.error('[Proctor] GET session error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PATCH /api/proctor/sessions/[id] — update status, result, score
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { supabase } = ctx;
    const body = await req.json();

    // Only allow specific fields to be updated
    const allowed = ['status', 'result', 'score', 'started_at', 'completed_at', 'proctor_notes'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await db
      .from('exam_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('[Proctor] Failed to update session:', error.message);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    logger.info(`[Proctor] Session ${id} updated: ${JSON.stringify(updates)}`);
    return NextResponse.json({ session: data });
  } catch (err) {
    logger.error('[Proctor] PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
