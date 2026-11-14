import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { paidInvoiceMatchesProgram } from '@/lib/programs/paid-intake-policy.mjs';
import { getInitialProgramInvoiceCents } from '@/lib/programs/deposit-policy';
import { queuePaidProgramWelcome } from './apprenticeship-welcome';
import { activateProgramInstallments } from '@/lib/billing/activate-program-installments';

/** A URL parameter is a locator, never evidence of payment or ownership. */
export async function verifyPaidApplication(programSlug: string, invoiceId?: string) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user || !invoiceId) return null;
  const db = await requireAdminClient();
  const [invoice, program] = await Promise.all([
    db.from('billing_invoices').select('*').eq('id', invoiceId).maybeSingle(),
    db.from('programs').select('id,slug,is_apprenticeship,is_free,price,tuition,total_cost')
      .eq('slug', programSlug).eq('published', true).eq('is_active', true).maybeSingle(),
  ]);
  if (invoice.error || program.error) throw new Error('Payment verification is temporarily unavailable.');
  if (!program.data) return null;
  const row = invoice.data;
  const payload = row?.fulfillment_payload || {};
  const tuition = Math.round(Number(program.data?.price ?? program.data?.tuition ?? program.data?.total_cost ?? 0) * 100);
  const required = Number(payload.required_amount_cents ?? getInitialProgramInvoiceCents(programSlug, tuition));
  if (!row?.paid_at || !Number.isFinite(Date.parse(row.paid_at)) ||
      payload.student_id !== user.id || !payload.enrollment_id ||
      !Number.isSafeInteger(required) || required <= 0 || row.total_cents < required ||
      !paidInvoiceMatchesProgram(row, program.data, user.email)) return null;
  const enrollment = await db.from('program_enrollments')
    .select('id,status,revoked_at,student_id,program_id').eq('id', payload.enrollment_id)
    .eq('student_id', user.id).eq('program_id', program.data.id).maybeSingle();
  if (enrollment.error) throw new Error('Enrollment verification is temporarily unavailable.');
  if (!enrollment.data || enrollment.data.revoked_at ||
      !['checkout_pending', 'pending', 'active'].includes(enrollment.data.status)) return null;
  return { db, user, invoice: row, enrollment: enrollment.data, program: program.data };
}

/** Called only after a full application is saved against verified payment. Retryable and idempotent. */
export async function activatePaidApplication(evidence: NonNullable<Awaited<ReturnType<typeof verifyPaidApplication>>>, applicationId: string) {
  const { db, user, invoice, enrollment, program } = evidence;
  const now = new Date().toISOString();
  const application = await db.from('applications').update({
    user_id: user.id, enrollment_id: enrollment.id, status: 'enrolled', payment_status: 'paid',
    payment_provider: invoice.provider, payment_amount_cents: invoice.total_cents,
    payment_received_at: invoice.paid_at, payment_reference: invoice.id,
    intake_stage: 'enrollment', updated_at: now,
  }).eq('id', applicationId).select('id').single();
  if (application.error) throw new Error('Full application payment could not be linked.');
  const activated = await db.from('program_enrollments').update({
    status: 'active', payment_status: 'paid', enrollment_state: 'active',
    amount_paid_cents: invoice.total_cents, payment_reference: invoice.id,
    access_granted_at: now, next_required_action: 'ONBOARDING', updated_at: now,
  }).eq('id', enrollment.id).eq('student_id', user.id).is('revoked_at', null)
    .in('status', ['checkout_pending', 'pending', 'active']).select('id').single();
  if (activated.error) throw new Error('Enrollment activation could not be completed. Please retry this application.');
  const apprentice = program.is_apprenticeship || /apprentice/i.test(program.slug);
  const profile = await db.from('profiles').update({
    enrollment_status: 'active', ...(apprentice ? { portal_type: 'apprentice' } : {}), updated_at: now,
  }).eq('id', user.id);
  if (profile.error) throw new Error('Dashboard activation could not be completed.');
  await activateProgramInstallments(db, {
    userId: user.id, programId: program.id, invoiceId: invoice.id,
    paidCents: Number(invoice.total_cents),
    tuitionCents: Number(invoice.fulfillment_payload?.total_tuition_cents ?? Math.round(Number(program.price ?? program.tuition ?? program.total_cost ?? 0) * 100)),
  });
  await queuePaidProgramWelcome(db, enrollment.id);
  return `https://app.elevateforhumanity.org/${apprentice ? 'apprentice' : 'learner/dashboard'}`;
}
