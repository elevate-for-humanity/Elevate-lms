import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';

export interface PaymentRequest {
  studentId: string;
  providerId: string;
  programId?: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

export async function createPartnerPaymentSession(request: PaymentRequest): Promise<PaymentResult> {
  try {
    const db = await createClient();
    const [{ data: provider }, { data: student }] = await Promise.all([
      db.from('partner_lms_providers').select('provider_name').eq('id', request.providerId).maybeSingle(),
      db.from('profiles').select('full_name,email').eq('id', request.studentId).maybeSingle(),
    ]);
    if (!provider || !student?.email) throw new Error('Provider or student not found');

    const { data: enrollment, error } = await db.from('partner_lms_enrollments').insert({
      provider_id: request.providerId,
      student_id: request.studentId,
      program_id: request.programId,
      status: 'payment_pending',
      enrolled_at: new Date().toISOString(),
      metadata: { payment_amount: request.amount, payment_currency: request.currency || 'usd' },
    }).select('id').single();
    if (error || !enrollment) throw error || new Error('Enrollment could not be created');

    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
      idempotencyKey: `partner-certification:${enrollment.id}`,
      customer: {
        externalKey: `user:${request.studentId}`,
        displayName: student.full_name || student.email,
        email: student.email,
      },
      lines: [{
        canonicalKey: `partner-certification:${request.providerId}:${request.programId || 'general'}`,
        name: `${provider.provider_name} Certification`,
        description: `Access to ${provider.provider_name} courses and certifications`,
        quantity: 1,
        unitAmountCents: Math.round(request.amount * 100),
      }],
      dueDate: new Date().toISOString().slice(0, 10),
      memo: 'Partner certification enrollment',
      fulfillment: {
        type: 'partner_certification_enrollment',
        payload: { enrollmentId: enrollment.id, providerId: request.providerId, studentId: request.studentId, programId: request.programId || null },
      },
    });

    await db.from('partner_lms_enrollments').update({
      payment_session_id: invoice.providerInvoiceId,
    }).eq('id', enrollment.id);

    return { success: true, checkoutUrl: invoice.paymentUrl, sessionId: invoice.providerInvoiceId };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function handlePaymentSuccess(invoiceId: string): Promise<void> {
  const db = await createClient();
  const { data: enrollment, error } = await db.from('partner_lms_enrollments')
    .select('id,provider_id,student_id')
    .eq('payment_session_id', invoiceId)
    .maybeSingle();
  if (error || !enrollment) throw new Error('Enrollment invoice was not found');
  await db.from('partner_lms_enrollments').update({
    status: 'active',
    payment_status: 'paid',
    payment_completed_at: new Date().toISOString(),
  }).eq('id', enrollment.id);
  await db.functions.invoke('send-partner-welcome-email', {
    body: { enrollment_id: enrollment.id, provider_id: enrollment.provider_id, student_id: enrollment.student_id },
  });
}

export async function handlePaymentFailure(invoiceId: string): Promise<void> {
  const db = await createClient();
  await db.from('partner_lms_enrollments').update({
    status: 'payment_failed',
    payment_status: 'failed',
  }).eq('payment_session_id', invoiceId);
}

export async function getProviderPricing(providerId: string): Promise<{ amount: number; currency: string; requiresPayment: boolean }> {
  const db = await createClient();
  const { data: provider } = await db.from('partner_lms_providers').select('requires_payment,payment_amount').eq('id', providerId).maybeSingle();
  if (!provider) throw new Error('Provider not found');
  return { amount: provider.payment_amount || 0, currency: 'usd', requiresPayment: provider.requires_payment || false };
}

export async function hasStudentPaid(studentId: string, providerId: string): Promise<boolean> {
  const db = await createClient();
  const { data } = await db.from('partner_lms_enrollments').select('payment_status').eq('student_id', studentId).eq('provider_id', providerId).eq('payment_status', 'paid');
  return (data?.length || 0) > 0;
}

export async function createPaymentLink(providerId: string, amount: number): Promise<{ url: string; id: string }> {
  throw new Error('Direct anonymous payment links are retired. Create a student-bound QuickBooks invoice instead.');
}
