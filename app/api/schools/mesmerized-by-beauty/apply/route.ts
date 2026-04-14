// PUBLIC ROUTE: school application form
/**
 * POST /api/schools/mesmerized-by-beauty/apply
 *
 * Accepts applications for cosmetology, esthetician, and nail tech programs
 * at Mesmerized by Beauty Cosmetology Academy.
 *
 * On submission:
 *   1. Inserts a school_applications row
 *   2. Emails the applicant a confirmation
 *   3. Emails mesmerizedbybeautyl@yahoo.com with full application details
 *   4. BCCs info@elevateforhumanity.org on the school notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PARTNER_ID      = '8420fefa-3228-4ec7-9ea7-265b045aa93d';
const SCHOOL_EMAIL    = 'mesmerizedbybeautyl@yahoo.com';
const ELEVATE_CC      = 'info@elevateforhumanity.org';
const ADMIN_REVIEW    = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/admin/applications`;

const PROGRAM_LABELS: Record<string, string> = {
  'cosmetology-apprenticeship':      'Cosmetology Apprenticeship',
  'esthetician-apprenticeship':      'Esthetician Apprenticeship',
  'nail-technician-apprenticeship':  'Nail Technician Apprenticeship',
};

const VALID_PROGRAMS = Object.keys(PROGRAM_LABELS);

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const {
      firstName, lastName, email, phone,
      city, state, zip,
      programInterest, fundingSource, priorExperience, notes,
      utmSource, utmMedium, utmCampaign,
    } = body;

    // Validation
    if (!firstName?.trim() || !lastName?.trim()) return safeError('First and last name are required', 400);
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return safeError('Valid email is required', 400);
    if (!phone?.trim()) return safeError('Phone number is required', 400);
    if (!programInterest || !VALID_PROGRAMS.includes(programInterest)) {
      return safeError('Select a valid program', 400);
    }

    const supabase = await getAdminClient();
    if (!supabase) return safeError('Service temporarily unavailable', 503);

    // Duplicate check — same email + program within 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('school_applications')
      .select('id, status, created_at')
      .eq('email', email.toLowerCase().trim())
      .eq('program_interest', programInterest)
      .gte('created_at', thirtyDaysAgo)
      .maybeSingle();

    if (existing) {
      return safeError('An application for this program was already submitted recently. We will be in touch soon.', 409);
    }

    // Insert application
    const { data: application, error: insertError } = await supabase
      .from('school_applications')
      .insert({
        partner_id:       PARTNER_ID,
        first_name:       firstName.trim(),
        last_name:        lastName.trim(),
        email:            email.toLowerCase().trim(),
        phone:            phone.trim(),
        city:             city?.trim() || null,
        state:            state?.trim() || 'IN',
        zip:              zip?.trim() || null,
        program_interest: programInterest,
        funding_source:   fundingSource || null,
        prior_experience: priorExperience || null,
        notes:            notes || null,
        status:           'submitted',
        source:           'school_landing_page',
        utm_source:       utmSource || null,
        utm_medium:       utmMedium || null,
        utm_campaign:     utmCampaign || null,
      })
      .select('id')
      .single();

    if (insertError || !application) {
      logger.error('[school/apply] insert error', insertError);
      return safeError('Failed to submit application. Please try again.', 500);
    }

    const programLabel = PROGRAM_LABELS[programInterest];
    const fullName     = `${firstName.trim()} ${lastName.trim()}`;

    // 1. Applicant confirmation email
    const applicantHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:40px 32px;text-align:center">
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Sponsored by Elevate for Humanity</p>
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 4px">Mesmerized by Beauty</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0">Cosmetology Academy</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px">
      <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 12px">Application Received</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
        Hi ${firstName.trim()}, thank you for applying to the <strong>${programLabel}</strong> program at Mesmerized by Beauty Cosmetology Academy. We have received your application and will be in touch within 2–3 business days.
      </p>

      <!-- Application summary -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
        <h3 style="color:#1e293b;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px">Your Application</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b;width:40%">Program</td><td style="padding:6px 0;color:#1e293b;font-weight:600">${programLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Name</td><td style="padding:6px 0;color:#1e293b">${fullName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0;color:#1e293b">${email.toLowerCase().trim()}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0;color:#1e293b">${phone.trim()}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Location</td><td style="padding:6px 0;color:#1e293b">8325 Michigan Road, Indianapolis, IN 46268</td></tr>
        </table>
      </div>

      <!-- What happens next -->
      <h3 style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 12px">What Happens Next</h3>
      <div style="space-y:8px">
        ${[
          'Our admissions team reviews your application within 2–3 business days.',
          'You will receive a call or email to schedule an in-person or virtual interview.',
          'Once accepted, you will be placed with a licensed partner salon for your apprenticeship hours.',
          'You will gain access to the Elevate LMS for your theory coursework.',
        ].map((step, i) => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
          <div style="width:24px;height:24px;background:#7c3aed;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:12px;font-weight:700;line-height:24px;text-align:center">${i + 1}</div>
          <p style="color:#475569;font-size:14px;line-height:1.5;margin:2px 0">${step}</p>
        </div>`).join('')}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0">
      <p style="color:#64748b;font-size:13px;margin:0 0 4px"><strong>Mesmerized by Beauty Cosmetology Academy</strong></p>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">8325 Michigan Road · Indianapolis, IN 46268</p>
      <p style="color:#94a3b8;font-size:12px;margin:0">Questions? <a href="mailto:mesmerizedbybeautyl@yahoo.com" style="color:#7c3aed">mesmerizedbybeautyl@yahoo.com</a></p>
      <p style="color:#cbd5e1;font-size:11px;margin:12px 0 0">Sponsored by <a href="https://www.elevateforhumanity.org" style="color:#7c3aed">Elevate for Humanity</a></p>
    </div>
  </div>
</body>
</html>`;

    // 2. School + Elevate notification email
    const schoolHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:32px">
    <div style="background:#7c3aed;padding:20px 24px;border-radius:10px;margin-bottom:24px">
      <h1 style="color:#fff;font-size:18px;font-weight:700;margin:0">New Application — Mesmerized by Beauty</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">Submitted via elevateforhumanity.org</p>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr style="background:#f8fafc"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;width:35%">Program</td><td style="padding:10px 12px;border:1px solid #e2e8f0;color:#7c3aed;font-weight:700">${programLabel}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Name</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${fullName}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Email</td><td style="padding:10px 12px;border:1px solid #e2e8f0"><a href="mailto:${email.toLowerCase().trim()}" style="color:#7c3aed">${email.toLowerCase().trim()}</a></td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Phone</td><td style="padding:10px 12px;border:1px solid #e2e8f0"><a href="tel:${phone.trim()}" style="color:#7c3aed">${phone.trim()}</a></td></tr>
      ${city ? `<tr style="background:#f8fafc"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">City</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${city.trim()}, ${state || 'IN'}</td></tr>` : ''}
      ${fundingSource ? `<tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Funding</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${fundingSource}</td></tr>` : ''}
      ${priorExperience ? `<tr style="background:#f8fafc"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Prior Experience</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${priorExperience}</td></tr>` : ''}
      ${notes ? `<tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Notes</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${notes}</td></tr>` : ''}
      <tr style="background:#f8fafc"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Application ID</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px">${application.id}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600">Submitted</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</td></tr>
    </table>

    <div style="text-align:center;margin-bottom:24px">
      <a href="${ADMIN_REVIEW}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Review in Admin Dashboard →</a>
    </div>

    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
      This notification was sent to Mesmerized by Beauty and copied to Elevate for Humanity.<br>
      Reply directly to this email to contact the applicant.
    </p>
  </div>
</body>
</html>`;

    // Fire both emails — don't let email failure block the response
    await Promise.allSettled([
      sendEmail({
        to: email.toLowerCase().trim(),
        subject: `Application Received — ${programLabel} at Mesmerized by Beauty`,
        html: applicantHtml,
        replyTo: SCHOOL_EMAIL,
      }),
      sendEmail({
        to: SCHOOL_EMAIL,
        bcc: ELEVATE_CC,
        subject: `New Application: ${fullName} — ${programLabel}`,
        html: schoolHtml,
        replyTo: email.toLowerCase().trim(),
      }),
    ]);

    logger.info('[school/apply] application submitted', {
      id: application.id,
      program: programInterest,
      email: email.toLowerCase().trim(),
    });

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to submit application');
  }
}
