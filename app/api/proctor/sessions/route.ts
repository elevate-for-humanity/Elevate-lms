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

// GET /api/proctor/sessions — list sessions
export async function GET(req: NextRequest) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase, profile } = ctx;
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
export async function POST(req: NextRequest) {
  try {
    const ctx = await getProctor();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase, profile } = ctx;
    const body = await req.json();

    const {
      provider, exam_name, exam_code, duration_min,
      student_name, student_email, program_slug,
      id_verified, id_type, id_notes,
      start_code, start_key, proctor_notes,
    } = body;

    if (!provider || !exam_name || !student_name) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, exam_name, student_name' },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from('exam_sessions')
      .insert({
        tenant_id: profile.tenant_id,
        provider,
        exam_name,
        exam_code: exam_code || null,
        duration_min: duration_min || 180,
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
        status: 'checked_in',
        result: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('[Proctor] Failed to create session:', error.message);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    logger.info(`[Proctor] Session created: ${data.id} for ${student_name} — ${exam_name}`);
    return NextResponse.json({ session: data }, { status: 201 });
  } catch (err) {
    logger.error('[Proctor] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
