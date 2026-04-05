import { safeInternalError } from '@/lib/api/safe-error';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { appendSessionEvent } from '@/lib/proctor/session-events';

const ALLOWED_ROLES = ['admin', 'super_admin', 'staff', 'instructor'];

async function getProctor() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const db = admin || supabase;
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null;
  return { db, user, profile };
}

// GET /api/proctor/sessions/[id]
async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { db } = ctx;

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
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { db } = ctx;
    const body = await req.json();

    // Fetch current session to enforce compliance rules
    const { data: current, error: fetchError } = await db
      .from('exam_sessions')
      .select('id, status, result, id_verified, delivery_method, evidence_url')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Voided sessions are immutable
    if (current.status === 'voided') {
      return NextResponse.json({ error: 'Voided sessions cannot be modified' }, { status: 409 });
    }

    // Setting a final result (pass/fail/incomplete) requires identity verified
    const finalResults = ['pass', 'fail', 'incomplete'];
    const incomingResult = body.result ?? current.result;
    const incomingIdVerified = body.id_verified ?? current.id_verified;
    if (finalResults.includes(incomingResult) && !incomingIdVerified) {
      return NextResponse.json(
        { error: 'id_verified must be true before recording a final exam result' },
        { status: 422 }
      );
    }

    // Online proctored sessions must have evidence before a final result is recorded
    const effectiveDelivery = body.delivery_method ?? current.delivery_method;
    const effectiveEvidence = body.evidence_url ?? current.evidence_url;
    if (
      effectiveDelivery === 'online_proctored' &&
      finalResults.includes(incomingResult) &&
      !effectiveEvidence
    ) {
      return NextResponse.json(
        { error: 'evidence_url is required before recording a result for online proctored sessions' },
        { status: 422 }
      );
    }

    // Only allow specific fields to be updated (no overwriting provider, student, proctor identity)
    const allowed = [
      'status', 'result', 'score', 'started_at', 'completed_at',
      'proctor_notes', 'id_verified', 'id_type', 'id_notes',
      'evidence_url', 'evidence_storage_key', 'evidence_hash', 'delivery_method',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Stamp evidence_uploaded_at when evidence_url is first set
    if (body.evidence_url && !current.evidence_url) {
      updates.evidence_uploaded_at = new Date().toISOString();
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

    // Append chain-of-custody events for significant state changes
    const { profile } = ctx;
    if (body.id_verified === true && !current.id_verified) {
      await appendSessionEvent(db, id, 'id_verified', profile.id, profile.role, {
        id_type: body.id_type ?? current.id_type,
      });
    }
    if (body.started_at && !current.started_at) {
      await appendSessionEvent(db, id, 'exam_started', profile.id, profile.role, {});
    }
    if (body.evidence_url && !current.evidence_url) {
      await appendSessionEvent(db, id, 'recording_uploaded', profile.id, profile.role, {
        evidence_url: body.evidence_url,
        evidence_storage_key: body.evidence_storage_key ?? null,
      });
    }
    if (body.result && body.result !== 'pending' && current.result === 'pending') {
      await appendSessionEvent(db, id, 'result_recorded', profile.id, profile.role, {
        result: body.result, score: body.score ?? null,
      });
    }
    if (body.status === 'voided' && current.status !== 'voided') {
      await appendSessionEvent(db, id, 'session_voided', profile.id, profile.role, {
        reason: body.proctor_notes ?? null,
      });
    }

    logger.info(`[Proctor] Session ${id} updated: result=${incomingResult}, id_verified=${incomingIdVerified}`);
    return NextResponse.json({ session: data });
  } catch (err) {
    logger.error('[Proctor] PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/proctor/sessions/[id]', _GET);
export const PATCH = withApiAudit('/api/proctor/sessions/[id]', _PATCH);
