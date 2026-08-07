// PUBLIC ROUTE: program inquiry only — does NOT create an application or enrollment.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getProgramFundingTier, getVerifiedProgramFunding, WORKONE_INDY_INTAKE_URL } from '@/lib/programs/funding-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

async function _POST(req: Request) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const program = String(body.program || '').trim();
    const question = String(body.question || '').trim().slice(0, 3000);

    if (!name || !email || !phone || !program) {
      return NextResponse.json({ error: 'Name, email, phone, and program are required.' }, { status: 400 });
    }

    const tier = getProgramFundingTier(program);
    const funding = getVerifiedProgramFunding(program);

    try {
      const db = await createClient();
      await db.from('inquiries').insert({
        name,
        email,
        phone,
        program_interest: program,
        funding_type: tier === 'workforce-funded' ? 'workforce-funded' : 'self-pay',
        status: 'new',
        source: 'website_program_inquiry',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[program-inquiry] Database insert failed', error);
    }

    const programLabel = program.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const fundedNote = tier === 'workforce-funded'
      ? `<p><strong>Funding track:</strong> This program is in the verified workforce-funded track. Funding is not guaranteed. If you decide to apply, WorkOne intake and authorization are required. <a href="${WORKONE_INDY_INTAKE_URL}">Schedule WorkOne intake</a>.</p>`
      : '<p><strong>Enrollment track:</strong> This program currently follows the regular/self-pay enrollment path. Payment plans may be available.</p>';

    await Promise.allSettled([
      sendEmail({
        to: email,
        subject: `We received your program inquiry — ${programLabel}`,
        html: `<p>Hi ${name.split(' ')[0]},</p><p>We received your inquiry about <strong>${programLabel}</strong>. This was recorded as an inquiry only — you have not submitted an enrollment application and no seat or funding has been reserved.</p>${fundedNote}<p>When you are ready to enroll, start the application here: <a href="${PLATFORM_DEFAULTS.siteUrl}/apply?program=${encodeURIComponent(program)}">Start Enrollment Application</a>.</p>`,
      }),
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Program Inquiry: ${name} — ${programLabel}`,
        html: `<h2>Program Inquiry — Lead Only</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Program:</strong> ${programLabel}</p><p><strong>Track:</strong> ${tier}</p><p><strong>Verified funding record:</strong> ${funding ? JSON.stringify(funding) : 'none'}</p><p><strong>Question:</strong><br>${question || 'No question entered.'}</p><p>This record is an inquiry/lead, not an application or enrollment.</p>`,
      }),
    ]);

    return NextResponse.json({ ok: true, message: 'Inquiry received. This did not create an enrollment application.' });
  } catch (error) {
    logger.error('[program-inquiry] Submission failed', error);
    return NextResponse.json({ error: 'Unable to submit inquiry. Please try again.' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/program-inquiry', _POST);
