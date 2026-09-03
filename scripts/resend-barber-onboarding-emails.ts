import { createClient } from '@supabase/supabase-js';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

if (!SENDGRID_API_KEY) {
  console.error('Missing SENDGRID_API_KEY.');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  process.env.MAIL_FROM ||
  'Elevate for Humanity <info@elevateforhumanity.org>';

const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || 'elevate4humanityedu@gmail.com';

function parseFrom(value: string): { email: string; name?: string } {
  const match = value.match(/^(.+?)\s*<(.+?)>$/);
  if (!match) return { email: value };
  return { name: match[1].trim(), email: match[2].trim() };
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          bcc: [{ email: 'elevate4humanityedu@gmail.com' }],
        },
      ],
      from: parseFrom(FROM_EMAIL),
      reply_to: parseFrom(REPLY_TO_EMAIL),
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid ${response.status}: ${body}`);
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const { data: enrollments, error } = await db
    .from('program_enrollments')
    .select('id, user_id, email, full_name, status, orientation_completed_at, documents_submitted_at, payment_status, program_slug')
    .eq('program_slug', 'barber-apprenticeship')
    .in('status', ['active', 'enrolled', 'in_progress', 'orientation_complete', 'documents_complete'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load enrollments:', error.message);
    process.exit(1);
  }

  const pending = (enrollments || []).filter((e: any) => !e.orientation_completed_at || !e.documents_submitted_at);

  if (pending.length === 0) {
    console.log('No barber enrollments need onboarding reminders.');
    return;
  }

  console.log(`Found ${pending.length} barber enrollment(s) requiring onboarding reminders.`);

  let sent = 0;
  let failed = 0;

  for (const enrollment of pending) {
    const email = enrollment.email;
    if (!email) {
      failed++;
      console.warn(`Skipping ${enrollment.id}: missing email`);
      continue;
    }

    const firstName = (enrollment.full_name || 'there').split(' ')[0];
    const needsOrientation = !enrollment.orientation_completed_at;
    const needsDocuments = !enrollment.documents_submitted_at;
    const paymentBlocked = ['past_due', 'suspended'].includes(String(enrollment.payment_status || ''));

    const orientationUrl = `${SITE_URL}/programs/barber-apprenticeship/orientation`;
    const documentsUrl = `${SITE_URL}/programs/barber-apprenticeship/documents`;
    const loginUrl = `${SITE_URL}/login?redirect=${encodeURIComponent('/programs/barber-apprenticeship/orientation')}`;
    const billingUrl = `${SITE_URL}/billing-required`;

    const subject = paymentBlocked
      ? 'Action Required: Fix payment + finish onboarding today'
      : 'Complete your barber onboarding today';

    const html = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937">
  <h2 style="margin-bottom:8px">Hi ${firstName},</h2>
  <p style="margin-top:0">Your Barber Apprenticeship enrollment is active, but onboarding is not finished yet.</p>
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;background:#f9fafb">
    <p style="margin:0 0 10px;font-weight:700">Complete these now:</p>
    <ol style="margin:0;padding-left:20px;line-height:1.8">
      ${needsOrientation ? `<li>Finish orientation: <a href="${orientationUrl}">${orientationUrl}</a></li>` : ''}
      ${needsDocuments ? `<li>Upload required documents: <a href="${documentsUrl}">${documentsUrl}</a></li>` : ''}
      <li>Sign in first if needed: <a href="${loginUrl}">${loginUrl}</a></li>
    </ol>
  </div>
  ${paymentBlocked ? `<div style="border:1px solid #fecaca;background:#fef2f2;color:#991b1b;border-radius:8px;padding:16px;margin:16px 0"><strong>Payment issue detected.</strong><br/>Update payment now to avoid portal lockout: <a href="${billingUrl}">${billingUrl}</a></div>` : ''}
  <p>If you need help, call <a href="tel:3173143757">" + PLATFORM_DEFAULTS.supportPhone + "</a> and we will complete this with you live.</p>
  <p style="margin-bottom:0">Elevate for Humanity</p>
</div>`;

    if (dryRun) {
      console.log(`[dry-run] Would send to ${email}: ${subject}`);
      sent++;
      continue;
    }

    try {
      await sendEmail(email, subject, html);
      sent++;
      console.log(`Sent onboarding reminder to ${email}`);
    } catch (err: any) {
      failed++;
      console.error(`Failed sending to ${email}:`, err?.message || String(err));
    }
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
