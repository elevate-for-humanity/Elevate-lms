import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireRoles } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  isActiveProgramHolderScopeProgram, programHolderApplicationScope, programHolderInterest,
  PROGRAM_HOLDER_SCOPE_INTAKE_FIELDS, type ProgramHolderScopeReview,
} from '@/lib/program-holder/program-interest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const reviewInput = z.object({
  programId: z.string().uuid(),
  note: z.string().trim().min(10).max(2000),
  confirmReviewed: z.literal(true),
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
}).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Match the application queue's platform-admin authority; do not expand
    // organization administrators' scope through a service-role client.
    const actor = await apiRequireRoles(request, ['admin', 'super_admin']);
    if (actor.error) return actor.error;
    if (request.headers.get('origin') !== new URL(request.url).origin) {
      return NextResponse.json({ error: 'Use the application review page to save this decision.' }, { status: 403 });
    }
    const { id } = await params;
    const parsed = reviewInput.safeParse(await request.json().catch(() => null));
    if (!z.string().uuid().safeParse(id).success || !parsed.success) {
      return NextResponse.json({ error: 'Select a program, confirm the scope review, and enter a review note of 10–2,000 characters.' }, { status: 400 });
    }
    const input = parsed.data;
    const db = await requireAdminClient();
    const { data: application, error } = await db.from('program_holder_applications')
      .select('id,status,data,updated_at').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (application.status !== 'pending' || (application.updated_at ?? null) !== input.expectedUpdatedAt) {
      return NextResponse.json({ error: 'This application changed. Refresh and review its current status before continuing.' }, { status: 409 });
    }
    const applicationData: Record<string, unknown> = application.data && typeof application.data === 'object' && !Array.isArray(application.data)
      ? application.data : {};
    const { data: intake, error: intakeError } = await db.from('application_intake')
      .select(PROGRAM_HOLDER_SCOPE_INTAKE_FIELDS)
      .eq('application_type', 'program_holder').eq('destination_table', 'program_holder_applications')
      .eq('destination_id', id).maybeSingle();
    if (intakeError) throw intakeError;
    if (!intake) return NextResponse.json({ error: 'This application needs a verified original intake before its program scope can be reviewed.' }, { status: 409 });
    const data = programHolderApplicationScope(id, applicationData, intake);
    const interest = programHolderInterest(data.requested_program_interest);
    if (!interest) return NextResponse.json({ error: 'This application does not have a listed program interest awaiting scope review.' }, { status: 400 });
    if (data.program_scope_review != null) {
      return NextResponse.json({ error: 'A program scope review is already recorded. Refresh before continuing.' }, { status: 409 });
    }

    const { data: program, error: programError } = await db.from('programs')
      .select('id,slug,title,name,is_active,status').eq('id', input.programId).maybeSingle();
    if (programError) throw programError;
    if (!program || !isActiveProgramHolderScopeProgram(program)) {
      return NextResponse.json({ error: 'Select a currently active program from the canonical program catalog.' }, { status: 409 });
    }
    const now = new Date().toISOString();
    const review: ProgramHolderScopeReview = {
      requested_interest: interest.id,
      program_id: program.id,
      program_slug: program.slug,
      program_title: String(program.title || program.name || program.slug),
      reviewed_by: actor.id,
      reviewed_at: now,
      note: input.note,
    };
    const { data: saved, error: saveError } = await db.from('application_intake')
      .update({ payload: { ...intake.payload, program_scope_review: review } })
      .eq('id', intake.id).eq('application_type', 'program_holder')
      .eq('destination_table', 'program_holder_applications').eq('destination_id', id)
      .eq('status', 'processed').is('payload->program_scope_review', null)
      .select('id').maybeSingle();
    if (saveError) throw saveError;
    if (!saved) {
      return NextResponse.json({ error: 'This application changed while you were reviewing it. Refresh before continuing.' }, { status: 409 });
    }
    const { data: current, error: currentError } = await db.from('program_holder_applications')
      .select('id,status,updated_at').eq('id', id).maybeSingle();
    if (currentError) {
      return NextResponse.json({ error: 'The scope review was recorded, but the current application status could not be confirmed. Refresh before continuing.', scopeRecorded: true }, { status: 503 });
    }
    if (!current || current.status !== 'pending' || (current.updated_at ?? null) !== input.expectedUpdatedAt) {
      return NextResponse.json({ error: 'The scope review was recorded, but the application changed. Refresh before continuing.', scopeRecorded: true }, { status: 409 });
    }
    // Protected intake stores the decision and audit fields in one guarded write.
    // Client-writable application data cannot forge or replace that authority.
    return NextResponse.json({ success: true, applicationId: id, status: 'pending', review });
  } catch (error) {
    logger.error('[program-holder/resolve-scope] failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Unable to save the program scope review. Refresh and try again.' }, { status: 500 });
  }
}
