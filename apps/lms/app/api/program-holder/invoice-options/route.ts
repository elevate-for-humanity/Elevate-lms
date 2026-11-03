// pre-auth-registry: exempt - requireProgramHolder enforces the authenticated holder and roster scope.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { invoicePrefill } from '@/lib/program-holder/invoice-prefill';
import { paymentAddendum } from '@/lib/program-holder/payment-addendum';
export const dynamic = 'force-dynamic';
export async function GET() {
  const ctx = await requireProgramHolder({ allowPendingApproval: true });
  const headers = { 'Cache-Control': 'private, no-store' };
  if (ctx.mode !== 'holder')
    return NextResponse.json(
      { error: 'Sign in to your own partner account to prepare an invoice.' },
      { status: 403, headers },
    );
  const [holderRes, studentsRes, schedulesRes, transactionsRes] = await Promise.all([
    ctx.db
      .from('program_holders')
      .select('organization_name,name,features,mou_signed,mou_status')
      .eq('id', ctx.holderId)
      .single(),
    ctx.db
      .from('program_enrollments')
      .select('id,full_name,program_id,training_start_date,training_end_date')
      .eq('program_holder_id', ctx.holderId)
      .is('revoked_at', null)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'graduated']),
    ctx.db
      .from('payout_schedules')
      .select(
        'id,enrollment_id,total_payout_cents,increment_1_cents,increment_2_cents,increment_1_status,increment_2_status',
      )
      .eq('program_holder_id', ctx.holderId),
    ctx.db
      .from('program_holder_payout_transactions')
      .select('enrollment_id,status,amount_cents,installment')
      .eq('program_holder_id', ctx.holderId),
  ]);
  if ([holderRes, studentsRes, schedulesRes, transactionsRes].some((r) => r.error))
    return NextResponse.json(
      { error: 'Student or agreement information could not load. Please retry.' },
      { status: 503, headers },
    );
  const holder = holderRes.data;
  let signed =
    holder.mou_signed === true &&
    ['signed', 'fully_executed'].includes(holder.mou_status || 'signed') &&
    holder.features?.full_forms_status !== 'review_pending';
  const addendum = paymentAddendum(holder.features, ctx.holderId);
  if (addendum) {
    const acceptance = await ctx.db
      .from('license_agreement_acceptances')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('agreement_type', 'program_holder_mou')
      .eq('document_version', addendum.version)
      .maybeSingle();
    if (acceptance.error)
      return NextResponse.json(
        { error: 'Payment addendum signature could not be checked.' },
        { status: 503, headers },
      );
    signed = signed && Boolean(acceptance.data);
  }
  const students = (studentsRes.data || [])
    .filter((s: { program_id: string }) => ctx.programIds.includes(s.program_id))
    .map(
      (student: {
        id: string;
        full_name: string;
        training_start_date: string | null;
        training_end_date: string | null;
      }) => {
        const schedules = (schedulesRes.data || []).filter(
          (s: { enrollment_id: string }) => s.enrollment_id === student.id,
        );
        const transactions = (transactionsRes.data || []).filter(
          (t: { enrollment_id: string }) => t.enrollment_id === student.id,
        );
        const stage = (name: 'start' | 'completion') =>
          schedules.length > 1
            ? {
                amountCents: null,
                source: 'Agreement review required',
                reason: 'Multiple student schedules require reconciliation.',
              }
            : invoicePrefill(holder.features, signed, schedules[0] || null, transactions, name);
        return {
          id: student.id,
          name: student.full_name,
          trainingStart: student.training_start_date?.slice(0, 10) || '',
          trainingEnd: student.training_end_date?.slice(0, 10) || '',
          start: stage('start'),
          completion: stage('completion'),
        };
      },
    );
  return NextResponse.json(
    {
      providerName: holder.organization_name || holder.name || ctx.profile.full_name || '',
      students,
    },
    { headers },
  );
}
