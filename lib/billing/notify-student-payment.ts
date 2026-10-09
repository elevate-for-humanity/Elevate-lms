import { sendEmail } from '@/lib/email/sendgrid';

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );

/** Called only by the confirmed-payment fulfillment worker. */
export async function notifyAdminOfStudentPayment(
  db: any,
  invoiceId: string,
  payload: Record<string, any>,
) {
  const subject = `Student payment received — enrollment action required [${invoiceId}]`;
  const recipient = process.env.ADMISSIONS_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';
  const prior = await db
    .from('email_logs')
    .select('id')
    .eq('subject', subject)
    .eq('recipient_email', recipient)
    .eq('status', 'accepted')
    .limit(1);
  if (prior.error) throw new Error(prior.error.message);
  if (prior.data?.length) return;

  const enrollment = await db
    .from('program_enrollments')
    .select('user_id,program_slug,status,enrollment_state')
    .eq('id', payload.enrollment_id)
    .maybeSingle();
  if (enrollment.error) throw new Error(enrollment.error.message);
  const userId = payload.user_id || payload.student_id || enrollment.data?.user_id;
  const profile = userId
    ? await db.from('profiles').select('full_name,email').eq('id', userId).maybeSingle()
    : { data: null, error: null };
  if (profile.error) throw new Error(profile.error.message);
  const student = profile.data?.full_name || payload.customer_name || 'Student';
  const email = profile.data?.email || payload.customer_email || 'See enrollment record';
  const program = payload.program_slug || enrollment.data?.program_slug || 'See enrollment record';
  const amount = Number(payload.amount_cents);
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error('Invalid confirmed payment amount.');
  const message = await sendEmail({
    to: recipient,
    subject,
    html: `<h2>Student payment confirmed</h2>
      <p><strong>Student:</strong> ${escapeHtml(student)} (${escapeHtml(email)})</p>
      <p><strong>Program:</strong> ${escapeHtml(program)}</p>
      <p><strong>Amount received:</strong> $${(amount / 100).toFixed(2)}</p>
      <p><strong>Invoice reference:</strong> ${escapeHtml(invoiceId)}</p>
      <p><strong>Enrollment reference:</strong> ${escapeHtml(payload.enrollment_id)}</p>
      <p>Action required: review the student's enrollment, complete any outstanding requirements,
      confirm the training provider and start date, and send the student their enrollment confirmation.
      If already enrolled, reconcile this payment with their balance and payment plan.
      This amount is the payment on this invoice; it does not establish that all tuition is paid.</p>
      <p><a href="https://admin.elevateforhumanity.org/enrollments">Open admin enrollments</a></p>`,
  });
  if (!message.success) throw new Error(message.error || 'Admin payment notification failed.');
}
