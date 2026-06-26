import { safeInternalError } from '@/lib/api/safe-error';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { appendSessionEvent } from '@/lib/proctor/session-events';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { issueCertificateIfEligible } from '@/lib/lms/engine/certificate';

const ALLOWED_ROLES = ['admin', 'staff', 'instructor'];

async function getProctor() {
  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null;
  return { db, user, profile };
}

// GET /api/proctor/sessions/[id]
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(_req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { db } = ctx;

    const { data, error } = await db.from('exam_sessions').select('*').eq('id', id).maybeSingle();

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
async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .maybeSingle();

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
        { status: 422 },
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
        {
          error: 'evidence_url is required before recording a result for online proctored sessions',
        },
        { status: 422 },
      );
    }

    // Only allow specific fields to be updated (no overwriting provider, student, proctor identity)
    const allowed = [
      'status',
      'result',
      'score',
      'started_at',
      'completed_at',
      'proctor_notes',
      'id_verified',
      'id_type',
      'id_notes',
      'evidence_url',
      'evidence_storage_key',
      'evidence_hash',
      'delivery_method',
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
        result: body.result,
        score: body.score ?? null,
      });

      // ── Pass: attempt certificate issuance ──────────────────────────────
      if (body.result === 'pass') {
        try {
          const { data: session } = await db
            .from('exam_sessions')
            .select('student_id, course_id, enrollment_id')
            .eq('id', id)
            .maybeSingle();

          if (session?.student_id && session?.course_id) {
            const certNumber = await issueCertificateIfEligible(
              session.student_id,
              session.course_id,
              session.enrollment_id ?? null,
            );
            if (certNumber) {
              logger.info('[Proctor] Certificate issued on exam pass', { sessionId: id, certNumber });
              await appendSessionEvent(db, id, 'certificate_issued', profile.id, profile.role, {
                certificate_number: certNumber,
              });
            }
          }
        } catch (certErr) {
          // Non-blocking — certificate failure must not block result recording
          logger.error('[Proctor] Certificate issuance failed (non-blocking)', certErr as Error);
        }
      }

      // ── Fail: create retake enforcement hold ────────────────────────────
      if (body.result === 'fail') {
        try {
          const { data: session } = await db
            .from('exam_sessions')
            .select('student_id, course_id, enrollment_id, exam_type')
            .eq('id', id)
            .maybeSingle();

          if (session?.student_id) {
            // Write enforcement hold — blocks retake until hold is cleared
            await db.from('exam_enforcement_holds').insert({
              student_id: session.student_id,
              course_id: session.course_id ?? null,
              enrollment_id: session.enrollment_id ?? null,
              exam_session_id: id,
              hold_type: 'retake_cooldown',
              reason: `Failed exam session ${id}. Score: ${body.score ?? 'N/A'}`,
              hold_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h default
              created_by: profile.id,
            }).then(undefined, (err) =>
              logger.warn('[Proctor] Failed to create retake hold', { sessionId: id, err: String(err) }),
            );

            // In-app notification to student
            await db.from('notifications').insert({
              user_id: session.student_id,
              type: 'exam_failed',
              title: 'Exam result recorded',
              message: `Your exam result has been recorded. Please review your preparation and contact your instructor before retaking.`,
              action_label: 'View courses',
              action_url: '/lms/courses',
              link: '/lms/courses',
              read: false,
            }).then(undefined, (err) =>
              logger.error('[Proctor] Failed to create exam fail notification', { sessionId: id, error: String(err) }),
            );
          }
        } catch (holdErr) {
          logger.error('[Proctor] Retake hold creation failed (non-blocking)', holdErr as Error);
        }
      }
    }
    if (body.status === 'voided' && current.status !== 'voided') {
      await appendSessionEvent(db, id, 'session_voided', profile.id, profile.role, {
        reason: body.proctor_notes ?? null,
      });
    }

    logger.info(
      `[Proctor] Session ${id} updated: result=${incomingResult}, id_verified=${incomingIdVerified}`,
    );
    return NextResponse.json({ session: data });
  } catch (err) {
    logger.error('[Proctor] PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/proctor/sessions/[id]', _GET);
export const PATCH = withApiAudit('/api/proctor/sessions/[id]', _PATCH);
