import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Fetch transfer hour requests for current user
async function _GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: requests, error } = await db
    .from('transfer_hour_requests')
    .select(`
      *,
      student_enrollments (
        id,
        programs (name, slug)
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ requests });
}

// POST: Submit a transfer hour request
async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    enrollment_id,
    hours_requested,
    previous_school_name,
    previous_school_address,
    previous_school_phone,
    completion_date,
    documentation_url,
    notes,
  } = body;

  // Validation
  if (!enrollment_id) {
    return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
  }

  if (!hours_requested || hours_requested <= 0 || hours_requested > 2000) {
    return NextResponse.json(
      { error: 'Hours must be between 1 and 2000' },
      { status: 400 }
    );
  }

  if (!previous_school_name) {
    return NextResponse.json(
      { error: 'Previous school name required' },
      { status: 400 }
    );
  }

  // Verify enrollment belongs to user
  const { data: enrollment, error: enrollmentError } = await db
    .from('student_enrollments')
    .select('id, student_id, transfer_hours')
    .eq('id', enrollment_id)
    .eq('student_id', user.id)
    .single();

  if (enrollmentError || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }

  // Check for existing pending request
  const { data: existingRequest } = await db
    .from('transfer_hour_requests')
    .select('id')
    .eq('enrollment_id', enrollment_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json(
      { error: 'You already have a pending transfer request for this enrollment' },
      { status: 400 }
    );
  }

  // Create transfer request — transactional with audit
  const { data: request, error: insertError } = await auditedMutation({
    table: 'transfer_hour_requests',
    operation: 'insert',
    rowData: {
      student_id: user.id,
      enrollment_id,
      hours_requested,
      previous_school_name,
      previous_school_address: previous_school_address || null,
      previous_school_phone: previous_school_phone || null,
      completion_date: completion_date || null,
      documentation_url: documentation_url || null,
      notes: notes || null,
      status: 'pending',
    },
    audit: {
      action: 'api:post:/api/apprentice/transfer-hours',
      actorId: user.id,
      targetType: 'transfer_hour_requests',
      metadata: { enrollment_id, hours_requested, previous_school_name },
    },
  });

  if (insertError) {
    logger.error('Error creating transfer request:', insertError);
    return NextResponse.json(
      { error: 'Failed to submit transfer request' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    request,
    message: 'Transfer hour request submitted. You will be notified once reviewed.',
  });
}
export const GET = withApiAudit('/api/apprentice/transfer-hours', _GET, { critical: true });
export const POST = withApiAudit('/api/apprentice/transfer-hours', _POST, { critical: true });
