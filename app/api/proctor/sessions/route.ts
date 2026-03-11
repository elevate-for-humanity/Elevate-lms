import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { appendSessionEvent } from '@/lib/proctor/session-events';

const ALLOWED_ROLES = ['admin', 'super_admin', 'staff', 'instructor'];

async function getProctor() {
  const supabase = await createClient();
  if (!supabase) return null;
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null;
  return { supabase, db, user, profile };
}

// GET /api/proctor/sessions — list sessions
async function _GET(req: NextRequest) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { db, profile } = ctx;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = db
      .from('exam_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (profile.tenant_id) {
      query = query.eq('tenant_id', profile.tenant_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('student_name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('[Proctor] Failed to fetch sessions:', error.message);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (err) {
    logger.error('[Proctor] GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/proctor/sessions — create new session
async function _POST(req: NextRequest) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { db, profile } = ctx;
    const body = await req.json();

    const {
      provider, exam_name, exam_code, duration_min,
      student_name, student_email, student_id, program_slug,
      id_verified, id_type, id_notes,
      start_code, start_key, proctor_notes,
      delivery_method, evidence_url,
    } = body;

    if (!provider || !exam_name || !student_name) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, exam_name, student_name' },
        { status: 400 }
      );
    }

    // Online proctored sessions must include evidence (recording/screenshot URL)
    const effectiveDelivery = delivery_method || 'in_person';
    if (effectiveDelivery === 'online_proctored' && !evidence_url) {
      return NextResponse.json(
        { error: 'evidence_url is required for online proctored sessions' },
        { status: 400 }
      );
    }

    // Detect retest: check for any prior attempt for this student + provider
    let isRetest = false;
    if (student_email || student_id) {
      let priorQuery = db
        .from('exam_sessions')
        .select('id')
        .eq('provider', provider)
        .limit(1);

      if (student_id) {
        priorQuery = priorQuery.eq('student_id', student_id);
      } else {
        priorQuery = priorQuery.ilike('student_email', student_email.toLowerCase());
      }

      const { data: prior } = await priorQuery;
      isRetest = (prior?.length ?? 0) > 0;
    }

    const { data, error } = await db
      .from('exam_sessions')
      .insert({
        tenant_id: profile.tenant_id,
        provider,
        exam_name,
        exam_code: exam_code || null,
        duration_min: duration_min || 180,
        student_id: student_id || null,
        student_name: student_name.trim(),
        student_email: student_email || null,
        program_slug: program_slug || null,
        id_verified: id_verified || false,
        id_type: id_type || null,
        id_notes: id_notes || null,
        start_code: start_code || null,
        start_key: start_key || null,
        proctor_id: profile.id,
        proctor_name: profile.full_name || 'Unknown Proctor',
        proctor_notes: proctor_notes || null,
        delivery_method: effectiveDelivery,
        evidence_url: evidence_url || null,
        evidence_storage_key: body.evidence_storage_key || null,
        evidence_hash: body.evidence_hash || null,
        evidence_uploaded_at: evidence_url ? new Date().toISOString() : null,
        is_retest: isRetest,
        status: 'checked_in',
        result: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('[Proctor] Failed to create session:', error.message);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Append immutable chain-of-custody events
    await appendSessionEvent(db, data.id, 'session_created', profile.id, profile.role, {
      provider, exam_name, delivery_method: effectiveDelivery, student_name,
    });
    if (isRetest) {
      await appendSessionEvent(db, data.id, 'retest_detected', profile.id, profile.role, { provider });
    }
    if (evidence_url) {
      await appendSessionEvent(db, data.id, 'recording_uploaded', profile.id, profile.role, {
        evidence_url, evidence_storage_key: body.evidence_storage_key || null,
      });
    }

    logger.info(`[Proctor] Session created: ${data.id} for ${student_name} — ${exam_name}${isRetest ? ' (retest)' : ''}`);
    return NextResponse.json({ session: data }, { status: 201 });
  } catch (err) {
    logger.error('[Proctor] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/proctor/sessions', _GET);
export const POST = withApiAudit('/api/proctor/sessions', _POST);
