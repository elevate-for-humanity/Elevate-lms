import 'server-only';
import { sendEmail } from '@/lib/email/sendgrid';
import { schoolInvoiceSnapshot } from './school-invoice-order';

export async function sendSchoolRegistrationEmail(db: any, invoiceId: string, payload: Record<string, any>) {
  const snapshot = schoolInvoiceSnapshot(payload);
  if (!snapshot) return;
  const profile = await db.from('profiles').select('email').eq('id', payload.student_id).maybeSingle();
  if (profile.error || !profile.data?.email) throw new Error('Student registration email is unavailable.');
  const subject = `Elevate payment received — complete training registration [${invoiceId}]`;
  const prior = await db.from('email_logs').select('id').eq('subject', subject)
    .eq('recipient_email', profile.data.email).eq('status', 'accepted').limit(1);
  if (prior.error) throw new Error(prior.error.message);
  if (prior.data?.length) return;
  const url = `https://app.elevateforhumanity.org/enrollment/training-registration?enrollment_id=${encodeURIComponent(payload.enrollment_id)}`;
  const sent = await sendEmail({ to: profile.data.email, subject,
    html: `<h2>Your Elevate tuition payment was received</h2><p>Complete your training provider's registration using the link below. Registration remains subject to eligibility review, available seats and a confirmed start date. Your payment does not by itself confirm a school seat.</p><p><a href="${url}">Continue training registration</a></p><p>If the registration form asks for another tuition payment, contact Elevate before paying again.</p>` });
  if (!sent.success) throw new Error(sent.error || 'Student registration email failed.');
}
