import 'server-only';

import { createPayPalPayout, isPayPalPayoutConfigured } from '@/lib/payments/paypal-payouts';
import {
  getProgramHolderPaymentReadiness,
  getStudentPaymentReadiness,
} from './onboarding-readiness';

type Database = any;

export type ReleaseResult = {
  released: boolean;
  alreadyReleased?: boolean;
  transactionId?: string;
  providerTransferId?: string;
  quickBooksPaymentId?: string;
  quickBooksSynced?: boolean;
  missing?: string[];
  error?: string;
};

export async function releaseProgramHolderPayment(
  db: Database,
  enrollmentId: string,
  actorId: string | null,
): Promise<ReleaseResult> {
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id,full_name,program_holder_id,status,payout_status')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment?.program_holder_id)
    return { released: false, error: 'Enrollment assignment not found.' };

  const [{ data: holder }, { data: schedule }, holderReady, studentReady] = await Promise.all([
    db
      .from('program_holders')
      .select('id,user_id,name,organization_name,contact_email')
      .eq('id', enrollment.program_holder_id)
      .maybeSingle(),
    db
      .from('payout_schedules')
      .select('id,total_payout_cents,increment_1_cents,increment_1_status,increment_1_release_date')
      .eq('program_holder_id', enrollment.program_holder_id)
      .eq('enrollment_id', enrollmentId)
      .maybeSingle(),
    getProgramHolderPaymentReadiness(db, enrollment.program_holder_id),
    getStudentPaymentReadiness(db, enrollmentId),
  ]);
  if (!holder?.user_id || !schedule)
    return { released: false, error: 'Approved payout schedule not found.' };

  const missing = [...holderReady.missing, ...studentReady.missing];
  if (missing.length)
    return { released: false, missing, error: 'Payment requirements are incomplete.' };
  if (schedule.increment_1_status === 'paid') return { released: true, alreadyReleased: true };
  if (schedule.increment_1_status !== 'approved') {
    return {
      released: false,
      error: 'Payment must be approved by an administrator before release.',
    };
  }
  if (
    !schedule.increment_1_release_date ||
    schedule.increment_1_release_date > new Date().toISOString().slice(0, 10)
  ) {
    return { released: false, error: 'The approved release date has not arrived.' };
  }

  const { data: payoutAccount } = await db
    .from('program_holder_payouts')
    .select('payout_provider,provider_recipient_id,transfers_enabled,payouts_enabled,verification_status')
    .eq('user_id', holder.user_id)
    .maybeSingle();
  if (
    !payoutAccount?.payout_provider || !payoutAccount?.provider_recipient_id ||
    !payoutAccount.transfers_enabled ||
    !payoutAccount.payouts_enabled ||
    payoutAccount.verification_status !== 'active'
  ) {
    return {
      released: false,
      error: 'The Program Holder must finish payout-provider verification first.',
    };
  }
  if(payoutAccount.payout_provider!=='paypal')return{released:false,error:'Branch payouts are awaiting direct provider activation.'};
  if(!(await isPayPalPayoutConfigured()))return{released:false,error:'PayPal payouts are not configured.'};

  const amountCents = Number(schedule.increment_1_cents || schedule.total_payout_cents || 0);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { released: false, error: 'The approved payout amount is invalid.' };
  }

  const { data: transaction, error: claimError } = await db
    .from('program_holder_payout_transactions')
    .insert({
      payout_schedule_id: schedule.id,
      enrollment_id: enrollmentId,
      program_holder_id: holder.id,
      amount_cents: amountCents,
      currency: 'usd',
      status: 'processing',
      approved_by: actorId,
    })
    .select('id,provider_transfer_id,status')
    .maybeSingle();

  if (claimError || !transaction) {
    const { data: existing } = await db
      .from('program_holder_payout_transactions')
      .select('id,provider_transfer_id,status,quickbooks_payment_id')
      .eq('payout_schedule_id', schedule.id)
      .eq('installment', 1)
      .maybeSingle();
    if (existing?.status === 'paid') {
      return {
        released: true,
        alreadyReleased: true,
        transactionId: existing.id,
        providerTransferId: existing.provider_transfer_id,
        quickBooksPaymentId: existing.quickbooks_payment_id,
      };
    }
    return {
      released: false,
      error: 'This payment is already being processed or needs admin review.',
    };
  }

  try {
    const transfer=await createPayPalPayout({recipientEmail:payoutAccount.provider_recipient_id,amountCents,transactionId:transaction.id,note:`Program Holder payment for ${enrollment.full_name||enrollmentId}`});

    const paidAt = new Date().toISOString();
    await Promise.all([
      db
        .from('program_holder_payout_transactions')
        .update({
          provider:'paypal',provider_transfer_id:transfer.id,provider_status:transfer.status,status:'processing',
          updated_at: paidAt,
        })
        .eq('id', transaction.id),
      db
        .from('payout_schedules')
        .update({ increment_1_status: 'released', updated_at: paidAt })
        .eq('id', schedule.id),
      db
        .from('program_enrollments')
        .update({ payout_status: 'pending', payout_paid_by: actorId })
        .eq('id', enrollmentId),
    ]);

    return {
      released: true,
      transactionId: transaction.id,
      providerTransferId: transfer.id,
      quickBooksSynced: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payout transfer failed.';
    await db
      .from('program_holder_payout_transactions')
      .update({ status: 'failed', failure_reason: message, updated_at: new Date().toISOString() })
      .eq('id', transaction.id);
    return { released: false, transactionId: transaction.id, error: message };
  }
}
