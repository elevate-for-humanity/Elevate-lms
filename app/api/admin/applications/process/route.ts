export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { approveApplication } from '@/lib/enrollment/approve';
import { logger } from '@/lib/logger';

// Intent → expected current status + target status
// Mirrors the DB trigger's enforced state machine:
//   submitted → in_review → approved → ready_to_enroll → enrolled
const ACTIONS = {
  review:         { from: 'submitted',      to: 'in_review'       },
  approve:        { from: 'in_review',      to: 'approved'        },
  ready_to_enroll:{ from: 'approved',       to: 'ready_to_enroll' },
  enroll:         { from: 'ready_to_enroll',to: 'enrolled'        },
  reject:         { from: 'in_review',      to: 'rejected'        },
  // One-click: review → approve → ready_to_enroll → enroll in sequence
  finalize:       { from: 'submitted',      to: 'enrolled'        },
} as const;

type Action = keyof typeof ACTIONS;

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = createAdminClient();
  if (!supabase || !db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let application_id: string;
  let action: Action;
  let program_id: string | undefined;
  let funding_type: string | undefined;
  try {
    const body = await req.json();
    application_id = body.application_id;
    action = body.action;
    program_id = body.program_id;
    funding_type = body.funding_type;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!application_id || !action) {
    return NextResponse.json({ error: 'application_id and action required' }, { status: 400 });
  }

  if (!ACTIONS[action]) {
    return NextResponse.json(
      { error: `Invalid action: ${action}. Valid: ${Object.keys(ACTIONS).join(', ')}` },
      { status: 400 },
    );
  }

  // Load application
  const { data: app, error: fetchError } = await db
    .from('applications')
    .select('id, status, user_id, program_slug, email, first_name, last_name')
    .eq('id', application_id)
    .single();

  if (fetchError || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const steps: Array<{ action: string; from: string; to: string }> = [];

  // finalize expands to review → approve → ready_to_enroll → enroll
  const sequence: Array<Exclude<Action, 'finalize'>> =
    action === 'finalize'
      ? ['review', 'approve', 'ready_to_enroll', 'enroll']
      : [action as Exclude<Action, 'finalize'>];

  let currentStatus = app.status;
  let userId = app.user_id as string | null;
  let enrollmentId: string | null = null;

  for (const step of sequence) {
    const flow = ACTIONS[step];

    if (currentStatus !== flow.from) {
      return NextResponse.json(
        {
          error: `Cannot ${step}: expected status '${flow.from}', got '${currentStatus}'`,
          completed_steps: steps,
        },
        { status: 422 },
      );
    }

    // APPROVE — use the canonical pipeline (creates auth user + profile + training_enrollments)
    if (step === 'approve') {
      const result = await approveApplication(db, {
        applicationId: application_id,
        programId: program_id ?? null,
        fundingType: funding_type ?? null,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error ?? 'Approval failed', completed_steps: steps },
          { status: 400 },
        );
      }
      userId = result.userId ?? userId;
    }

    // ENROLL — fully atomic via DB RPC (validates + inserts in one transaction)
    if (step === 'enroll') {
      const { data: rpcResult, error: rpcError } = await db.rpc('enroll_application', {
        p_application_id: application_id,
        p_actor_id: user.id,
      });

      if (rpcError) {
        logger.error('[process] enroll_application RPC failed', rpcError);
        // Parse structured error codes from the RPC exception message
        const msg = rpcError.message ?? '';
        const status =
          msg.startsWith('FUNDING_NOT_VERIFIED') ? 422 :
          msg.startsWith('INVALID_PROGRAM') ? 422 :
          msg.startsWith('PROGRAM_NOT_CONFIGURED') ? 422 :
          msg.startsWith('NO_USER_ACCOUNT') ? 422 :
          msg.startsWith('INVALID_STATE') ? 422 :
          500;
        return NextResponse.json(
          { error: msg, completed_steps: steps },
          { status },
        );
      }

      enrollmentId = (rpcResult as any)?.enrollment_id ?? null;
      // RPC already updated application status to enrolled and wrote audit log
      currentStatus = 'enrolled';
      steps.push({ action: step, from: flow.from, to: 'enrolled' });
      continue; // skip the status update + audit log below — RPC handled both
    }

    // Update status
    const { error: updateError } = await db
      .from('applications')
      .update({ status: flow.to, updated_at: new Date().toISOString() })
      .eq('id', application_id);

    if (updateError) {
      logger.error('[process] status update failed', updateError);
      return NextResponse.json(
        { error: updateError.message, completed_steps: steps },
        { status: 500 },
      );
    }

    // Mandatory audit log
    const { error: auditError } = await db.from('audit_logs').insert({
      entity_type: 'application',
      entity_id: application_id,
      action: `admin_${step}`,
      actor_id: user.id,
      actor_role: profile.role,
      metadata: {
        from: flow.from,
        to: flow.to,
        enrollment_id: enrollmentId,
        user_id: userId,
      },
    });

    if (auditError) {
      logger.error('[process] audit log failed', auditError);
      return NextResponse.json(
        { error: auditError.message, completed_steps: steps },
        { status: 500 },
      );
    }

    steps.push({ action: step, from: flow.from, to: flow.to });
    currentStatus = flow.to;
  }

  return NextResponse.json({
    success: true,
    application_id,
    final_status: currentStatus,
    user_id: userId,
    enrollment_id: enrollmentId,
    steps,
    note: enrollmentId
      ? `Enrollment created (delivery_model resolved at enroll step)`
      : undefined,
  });
}
