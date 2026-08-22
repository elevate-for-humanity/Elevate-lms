import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { approveApplication } from '@/lib/enrollment/approve';

/**
 * Compatibility decision endpoint for older PARIS admissions clients.
 *
 * Canonical admissions state lives on public.applications. Accepted decisions
 * must use the same approveApplication() pipeline as Admin so this route can
 * never create a parallel enrollment or bypass the canonical LMS-access path.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const decisionSchema = z.object({
  decision: z.enum([
    'PENDING',
    'CONDITIONAL_ACCEPTANCE',
    'ACCEPTED',
    'WAITLISTED',
    'REFERRED',
    'REJECTED',
  ]),
  reason: z.string().max(4000).optional(),
  conditions: z.array(z.string().max(500)).default([]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = createPublicClient();
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 });
    }

    const { data: profile } = await auth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const allowedRoles = new Set(['admin', 'super_admin', 'staff', 'admissions', 'recruiter']);
    if (!profile?.role || !allowedRoles.has(profile.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const { applicationId } = await context.params;
    const input = decisionSchema.parse(await request.json());
    const db = await requireAdminClient();
    const { data: application, error: applicationError } = await db
      .from('applications')
      .select('id, status, program_id, program_slug, program_interest, funding_type, metadata')
      .eq('id', applicationId)
      .maybeSingle();
    if (applicationError || !application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    let resolvedProgramId = application.program_id as string | null;
    const programSlug = application.program_slug || application.program_interest || null;
    if (!resolvedProgramId && programSlug) {
      const { data: program } = await db.from('programs').select('id').eq('slug', programSlug).maybeSingle();
      resolvedProgramId = program?.id ?? null;
    }

    const now = new Date().toISOString();
    const reviewMetadata = {
      ...((application.metadata as Record<string, unknown> | null) ?? {}),
      admissions_decision: input.decision,
      admissions_conditions: input.conditions,
      admissions_decided_by: user.id,
      admissions_decided_at: now,
    };

    if (input.decision === 'ACCEPTED') {
      if (!resolvedProgramId) {
        return NextResponse.json({ success: false, error: 'PROGRAM_NOT_RESOLVED' }, { status: 409 });
      }
      const result = await approveApplication(db, {
        applicationId,
        programId: resolvedProgramId,
        fundingType: application.funding_type,
        bypassPaymentGate: true,
      });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'Approval failed' }, { status: 409 });
      }
      await db.from('applications').update({
        reviewer_id: user.id,
        reviewed_at: now,
        review_notes: input.reason ?? null,
        metadata: reviewMetadata,
        updated_at: now,
      }).eq('id', applicationId);
      return NextResponse.json({
        success: true,
        applicationId,
        workflowStatus: 'approved',
        admissionsDecision: input.decision,
        enrollmentId: result.enrollmentId ?? null,
        canonicalAuthority: 'applications',
      });
    }

    const statusMap: Record<Exclude<typeof input.decision, 'ACCEPTED'>, string> = {
      PENDING: 'under_review',
      CONDITIONAL_ACCEPTANCE: 'under_review',
      WAITLISTED: 'waitlisted',
      REFERRED: 'under_review',
      REJECTED: 'rejected',
    };
    const nextStatus = statusMap[input.decision as Exclude<typeof input.decision, 'ACCEPTED'>];
    const nextStep =
      input.decision === 'CONDITIONAL_ACCEPTANCE'
        ? 'Complete admissions conditions'
        : input.decision === 'REFERRED'
          ? 'Staff referral follow-up required'
          : null;

    const { error: updateError } = await db.from('applications').update({
      status: nextStatus,
      reviewer_id: user.id,
      reviewed_at: now,
      review_notes: input.reason ?? null,
      next_step: nextStep,
      metadata: reviewMetadata,
      updated_at: now,
    }).eq('id', applicationId);
    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      applicationId,
      workflowStatus: nextStatus,
      admissionsDecision: input.decision,
      canonicalAuthority: 'applications',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('paris.decision.compat.failed', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: 'Unable to record decision' }, { status: 400 });
  }
}
