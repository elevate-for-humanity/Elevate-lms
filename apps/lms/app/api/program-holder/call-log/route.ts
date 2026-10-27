// pre-auth-registry: exempt - requireProgramHolder and holder-scoped row filters authorize every mutation.
import { NextResponse } from 'next/server';
import { getProgramHolderWorkspace } from '@/lib/program-holder/workspace';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

const OUTCOMES = new Set([
  'left_voicemail', 'no_answer', 'interested', 'scheduled', 'enrolled',
  'not_interested', 'wrong_number',
]);

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  let studentId = String(body.program_holder_student_id || '');
  const outcome = String(body.outcome || '');
  const notes = String(body.notes || '').trim().slice(0, 4000);
  const workStartDate = body.work_start_date ? String(body.work_start_date) : null;
  const workSite = body.work_site ? String(body.work_site).trim().slice(0, 240) : null;
  const nextFollowUp = body.next_follow_up ? String(body.next_follow_up) : null;

  if (!studentId || !OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: 'A valid applicant and call outcome are required.' }, { status: 400 });
  }
  if (outcome === 'enrolled' && (!notes || !workStartDate)) {
    return NextResponse.json(
      { error: 'Enrollment requires call notes and a work start date.' },
      { status: 400 },
    );
  }

  const { data: initialApplicant, error: applicantError } = await ctx.db
    .from('program_holder_students')
    .select('id,user_id,enrollment_id,program_holder_id,status')
    .eq('id', studentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  let applicant = initialApplicant;
  if (applicantError) return NextResponse.json({ error: 'Applicant lookup unavailable.' }, { status: 503 });
  if (!applicant && body.regional_application_id) {
    // Verify territory and local-holder ownership server-side before linking.
    const workspace = await getProgramHolderWorkspace();
    const candidate = workspace.applicants.find(row => row.regional_application_id === body.regional_application_id);
    if (candidate && candidate.program_id && ctx.programIds.includes(candidate.program_id)) {
      const claimed = await ctx.db.from('program_holder_students').insert({ program_holder_id: ctx.holderId, application_id: candidate.application_id, user_id: candidate.user_id || null, program_id: candidate.program_id, applicant_name: candidate.applicant_name, applicant_email: candidate.applicant_email || null, applicant_phone: candidate.applicant_phone || null, status: 'applied', application_status: candidate.application_status }).select('id,user_id,enrollment_id,program_holder_id,status').single();
      if (claimed.error?.code === '23505') {
        const existing = await ctx.db.from('program_holder_students').select('id,user_id,enrollment_id,program_holder_id,status').eq('program_holder_id', ctx.holderId).eq('application_id', candidate.application_id).maybeSingle();
        if (existing.error) return NextResponse.json({ error: 'Regional call record unavailable.' }, { status: 503 });
        applicant = existing.data;
      } else if (claimed.error) return NextResponse.json({ error: 'Regional applicant could not be linked.' }, { status: 503 });
      else applicant = claimed.data;
      if (applicant) studentId = applicant.id;
    }
  }
  if (!applicant) {
    return NextResponse.json({ error: 'Applicant is not assigned to this Program Holder.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await ctx.db
    .from('program_holder_students')
    .update({
      call_outcome: outcome,
      call_notes: notes || null,
      call_date: now,
      next_follow_up: nextFollowUp,
      work_start_date: workStartDate,
      work_site: workSite,
      status: outcome === 'enrolled' ? 'enrolled' : applicant.status,
      updated_at: now,
    })
    .eq('id', studentId)
    .eq('program_holder_id', ctx.holderId);
  if (updateError) {
    return NextResponse.json({ error: 'Unable to save the call record.' }, { status: 500 });
  }

  if (outcome === 'enrolled') {
    const { error: agreementError } = await ctx.db
      .from('program_holder_commission_agreements')
      .upsert({
        program_holder_id: ctx.holderId,
        program_holder_student_id: studentId,
        enrollment_id: applicant.enrollment_id || null,
        student_user_id: applicant.user_id || null,
        commission_rate_bps: 3000,
        status: 'active',
        qualification_source: 'holder_enrollment',
        qualified_by: ctx.user.id,
        qualified_at: now,
        updated_at: now,
      }, { onConflict: 'program_holder_id,program_holder_student_id' });
    if (agreementError) {
      return NextResponse.json(
        { error: 'Call saved, but commission eligibility requires administrator review.' },
        { status: 409 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    commissionEligible: outcome === 'enrolled',
    commissionRatePercent: outcome === 'enrolled' ? 30 : null,
  });
}
