import { applyRateLimit } from '@/lib/api/withRateLimit';
import { completionTerms } from '@/lib/program-holder/completion-terms';
// pre-auth-registry: exempt - holder context, enrollment ownership, and evidence ownership authorize submission.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { paymentAddendum } from '@/lib/program-holder/payment-addendum';
import { completionInvoiceDraft } from '@/lib/program-holder/completion-invoice';
import {
  TESTING_REPORT_FIELDS,
  validateTestingReport,
  evidenceEnrollment,
  isHolderRecordId,
  testingReportToday,
} from '@/lib/program-holder/testing-report';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const limited = await applyRateLimit(request, 'strict', { key: `holder-testing:${ctx.user.id}` });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  if (!body || !isHolderRecordId(body.enrollmentId))
    return NextResponse.json({ error: 'Select an enrolled student.' }, { status: 400 });
  const validation = validateTestingReport(body, testingReportToday());
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });
  const { data: student, error: studentError } = await ctx.db
    .from('program_enrollments')
    .select('id,full_name,program_id,status')
    .eq('id', body.enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .is('revoked_at', null)
    .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'graduated'])
    .maybeSingle();
  if (studentError)
    return NextResponse.json({ error: 'Student verification unavailable.' }, { status: 503 });
  if (!student || !ctx.programIds.includes(student.program_id))
    return NextResponse.json(
      { error: 'Student is not in your assigned program roster.' },
      { status: 403 },
    );
  const ids = [...new Set(body.evidenceIds as string[])];
  const { data: evidence, error: evidenceError } = await ctx.db
    .from('program_holder_documents')
    .select('id,document_type,file_name,description,status')
    .eq('user_id', ctx.profile.id)
    .in('id', ids)
    .in('document_type', [
      'testing_evidence',
      'lab_tracker',
      'student_completion',
      'assessment_results',
    ]);
  if (evidenceError)
    return NextResponse.json({ error: 'Evidence verification unavailable.' }, { status: 503 });
  if (
    evidence?.length !== ids.length ||
    evidence.some(
      (item: any) =>
        evidenceEnrollment(item.description) !== student.id || item.status === 'rejected',
    )
  )
    return NextResponse.json(
      {
        error:
          'Select supporting records linked to this student. Rejected evidence cannot be submitted.',
      },
      { status: 400 },
    );
  const { data: existing, error: existingError } = await ctx.db
    .from('program_holder_reports')
    .select('id,status')
    .eq('program_holder_id', ctx.holderId)
    .eq('report_type', 'general')
    .contains('metadata', { enrollment_id: student.id, report_kind: 'testing_readiness' })
    .in('status', ['submitted', 'under_review', 'approved'])
    .limit(1)
    .maybeSingle();
  if (existingError)
    return NextResponse.json({ error: 'Previous submission check unavailable.' }, { status: 503 });
  if (existing)
    return NextResponse.json({ ok: true, reportId: existing.id, alreadySubmitted: true });
  const { data: program, error: programError } = await ctx.db
    .from('programs')
    .select('title,name,total_hours,credential_name')
    .eq('id', student.program_id)
    .maybeSingle();
  if (programError || !program)
    return NextResponse.json({ error: 'Program requirements unavailable.' }, { status: 503 });
  const [{ data: schedule, error: scheduleError }, { data: priorPayments, error: paymentsError }] =
    await Promise.all([
      ctx.db
        .from('payout_schedules')
        .select(
          'id,total_payout_cents,increment_1_cents,increment_1_status,increment_2_cents,increment_2_status',
        )
        .eq('program_holder_id', ctx.holderId)
        .eq('enrollment_id', student.id)
        .maybeSingle(),
      ctx.db
        .from('program_holder_payout_transactions')
        .select('installment,amount_cents,status')
        .eq('program_holder_id', ctx.holderId)
        .eq('enrollment_id', student.id),
    ]);
  if (scheduleError || paymentsError)
    return NextResponse.json(
      {
        error:
          'Individual payment terms or prior payments could not be checked. Nothing was submitted.',
      },
      { status: 503 },
    );
  const { data: holder, error: holderError } = await ctx.db
    .from('program_holders')
    .select('features,mou_signed')
    .eq('id', ctx.holderId)
    .maybeSingle();
  if (holderError || !holder)
    return NextResponse.json(
      { error: 'Individual agreement verification unavailable.' },
      { status: 503 },
    );
  const addendum = paymentAddendum(holder.features, ctx.holderId);
  const { data: signatures, error: signatureError } = addendum
    ? await ctx.db
        .from('license_agreement_acceptances')
        .select('id')
        .eq('user_id', ctx.user.id)
        .eq('agreement_type', 'program_holder_mou')
        .eq('document_version', addendum.version)
    : { data: [], error: null };
  if (signatureError)
    return NextResponse.json(
      { error: 'Agreement signature verification unavailable.' },
      { status: 503 },
    );
  let invoice = completionInvoiceDraft(
    schedule,
    priorPayments || [],
    `completion:${ctx.holderId}:${student.id}`,
  );
  const historicalReview = holder.features?.student_payment_review?.students?.find(
    (row: any) => row.enrollment_id === student.id,
  );
  const terms = completionTerms(holder.features);
  const termsMismatch =
    schedule &&
    terms &&
    (terms.total !== schedule.total_payout_cents ||
      (terms.first !== undefined &&
        (terms.first !== schedule.increment_1_cents ||
          terms.second !== schedule.increment_2_cents)));
  const invalidAddendum = Boolean(holder.features?.payment_addendum) && !addendum;
  const pendingUnversionedTerms =
    !addendum &&
    /pending/i.test(String(holder.features?.compensation_terms?.effective_status || ''));
  if (
    !terms ||
    !holder.mou_signed ||
    invalidAddendum ||
    pendingUnversionedTerms ||
    (addendum && !signatures?.length) ||
    historicalReview ||
    termsMismatch
  ) {
    invoice = {
      ...invoice,
      status: 'requires_agreement_review',
      amount_cents: null,
      reason: historicalReview
        ? 'Historical bank or manual payment review exists. Reconcile those records and documented exceptions before calculating another payment.'
        : 'Signed individual terms, documented student exceptions, and this schedule require Admin verification.',
    };
  }
  const content = [
    `Student: ${student.full_name || 'Enrolled student'}`,
    `Program: ${program.title || program.name}`,
    `Training dates: ${body.start} to ${body.end}`,
    `Reported completed hours: ${body.hours}`,
    `Program hours on record: ${program.total_hours ?? 'Requires Admin verification'}`,
    ...TESTING_REPORT_FIELDS.map(([key, label]) => `${label}: ${body[key].trim()}`),
    `Supporting records: ${evidence.map((item: any) => `${item.file_name} (${item.id})`).join('; ')}`,
    `Certified by: ${ctx.profile.full_name || ctx.profile.email || ctx.user.id}`,
  ].join('\n\n');
  const { data: report, error } = await ctx.db
    .from('program_holder_reports')
    .insert({
      program_holder_id: ctx.holderId,
      user_id: ctx.user.id,
      title: `Ready to Test — ${student.full_name || 'Student'}`,
      report_type: 'general',
      status: 'submitted',
      content,
      hours_worked: body.hours,
      period_start: body.start,
      period_end: body.end,
      submitted_at: new Date().toISOString(),
      metadata: {
        report_kind: 'testing_readiness',
        enrollment_id: student.id,
        program_id: student.program_id,
        student_name: student.full_name,
        evidence_ids: ids,
        submitted_fields: Object.fromEntries(
          TESTING_REPORT_FIELDS.map(([key]) => [key, body[key]]),
        ),
        certified: true,
        exam: body.exam.trim(),
        certified_by: ctx.user.id,
        reported_hours_unverified: true,
        required_program_hours: program.total_hours,
        review_required: true,
        agreement_version: addendum?.version || null,
        historical_payment_review: historicalReview || null,
        payment_execution: 'blocked_pending_authorized_review',
        completion_invoice: invoice,
      },
    })
    .select('id')
    .single();
  if (error?.code === '23505')
    return NextResponse.json(
      { error: 'A testing report for this student is already awaiting review. Reload to view it.' },
      { status: 409 },
    );
  if (error || !report)
    return NextResponse.json({ error: 'Testing report could not be saved.' }, { status: 500 });
  const { error: noticeError } = await ctx.db.from('staff_notifications').insert({
    type: 'student_ready_for_testing',
    title: `Testing review: ${student.full_name || 'Student'}`,
    message:
      'A Program Holder submitted an exit report and second-payment invoice request. Verify the individual agreement, completion evidence, and prior payments before approving testing or payment.',
    severity: 'info',
    metadata: { report_id: report.id, enrollment_id: student.id, program_holder_id: ctx.holderId },
  });
  return NextResponse.json(
    {
      ok: true,
      reportId: report.id,
      adminAlertSaved: !noticeError,
      invoiceMessage: invoice.reason,
    },
    { status: 201 },
  );
}
