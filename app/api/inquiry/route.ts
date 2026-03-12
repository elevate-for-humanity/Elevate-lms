import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const ADMIN_SMS = process.env.ADMIN_SMS_GATEWAY || '';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const contentType = req.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        program: formData.get('program'),
        funding: formData.get('funding'),
      };
    }

    const { name, email, phone, program, funding } = data;

    // Validate before touching the database
    if (!name || !email || !phone || !program) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Save inquiry to database
    try {
      const supabase = await createClient();
      const _admin = createAdminClient(); const db = _admin || supabase;
      await db.from('inquiries').insert({
        name,
        email,
        phone,
        program_interest: program,
        funding_type: funding || null,
        status: 'new',
        source: 'website',
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      logger.error('Failed to save inquiry to database:', dbError);
      // Continue with email even if DB fails
    }

    // Programs on Indiana's ETPL — eligible for WIOA / Workforce Ready Grant (free to student)
    const ETPL_PROGRAMS = new Set([
      'building-maintenance-wrg',
      'business-startup',
      'cdl-training',
      'cybersecurity-analyst',
      'drug-alcohol-specimen-collector',
      'electrical',
      'health-safety',
      'home-health-aide',
      'hvac-technician',
      'it-support-specialist',
      'medical-assistant',
      'peer-recovery-specialist-jri',
      'phlebotomy-technician',
      'plumbing',
      'reentry-specialist',
      'welding',
    ]);

    const programSlug = (program || '').toLowerCase().replace(/\s+/g, '-');
    const isEtpl = ETPL_PROGRAMS.has(programSlug);
    const programLabel = (program || 'your selected program').replace(/-/g, ' ');
    const firstName = (name || '').split(' ')[0] || name;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const logoUrl = `${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

    const fundingBlock = isEtpl
      ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#15803d">✅ This program may be fully funded</p>
          <p style="margin:0;font-size:14px;color:#166534;line-height:1.7">
            <strong>${programLabel}</strong> is listed on Indiana's Eligible Training Provider List (ETPL).
            That means it can be covered at <strong>no cost to you</strong> through WIOA or the Workforce Ready Grant —
            if you qualify.
          </p>
        </div>
        <h3 style="font-size:16px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">Your Next Steps</h3>
        <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#333;line-height:1.9">
          <li>Visit <a href="https://www.indianacareerconnect.com" style="color:#1a1a1a;font-weight:bold">IndianaCareerConnect.com</a> and create a free account</li>
          <li>Schedule an appointment at your nearest <strong>WorkOne</strong> office</li>
          <li>Tell them you want to enroll in <strong>${programLabel}</strong> at Elevate for Humanity</li>
          <li>They will confirm your eligibility and issue a training voucher</li>
          <li>Once your voucher is confirmed, <a href="${siteUrl}/apply/student?program=${programSlug}" style="color:#1a1a1a;font-weight:bold">complete your enrollment application</a></li>
        </ol>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">
          Not sure if you qualify? Our admissions team can walk you through the eligibility checklist.
          Call us at <a href="tel:3173143757" style="color:#1a1a1a">(317) 314-3757</a> or reply to this email.
        </p>`
      : `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#92400e">ℹ️ Funding for this program</p>
          <p style="margin:0;font-size:14px;color:#78350f;line-height:1.7">
            <strong>${programLabel}</strong> is not currently on the ETPL, so it is not covered by WIOA or the
            Workforce Ready Grant. However, other funding options may be available — including employer sponsorship,
            scholarships, and payment plans.
          </p>
        </div>
        <h3 style="font-size:16px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">Your Next Steps</h3>
        <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#333;line-height:1.9">
          <li>Our admissions team will contact you within <strong>1–2 business days</strong> to discuss your options</li>
          <li>We'll review available scholarships, employer sponsorship, and payment plans with you</li>
          <li>Once funding is confirmed, <a href="${siteUrl}/apply/student?program=${programSlug}" style="color:#1a1a1a;font-weight:bold">complete your enrollment application</a></li>
          <li>You'll receive your start date and orientation details by email</li>
        </ol>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">
          Questions about cost or payment? Call us at <a href="tel:3173143757" style="color:#1a1a1a">(317) 314-3757</a>
          or reply to this email — we'll find a path that works for you.
        </p>`;

    const confirmationHtml = `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a;background:#ffffff">
        <div style="text-align:center;padding:32px 24px 24px">
          <img src="${logoUrl}" alt="Elevate for Humanity" width="160" style="max-width:160px;height:auto" />
        </div>
        <div style="padding:0 32px 32px">
          <h2 style="font-weight:normal;font-size:22px;margin:0 0 20px;color:#1a1a1a">Hi ${firstName},</h2>
          <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
            Thanks for your interest in <strong>${programLabel}</strong> at Elevate for Humanity.
            We received your inquiry and will be in touch shortly.
          </p>
          ${fundingBlock}
          <div style="text-align:center;margin:28px 0">
            <a href="${siteUrl}/apply/student?program=${programSlug}"
               style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px">
              Start Your Application
            </a>
          </div>
          <div style="border-top:1px solid #e0e0e0;margin-top:32px;padding-top:20px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#999">
            <p style="margin:0 0 4px">Elevate for Humanity Career &amp; Technical Institute</p>
            <p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
            <p style="margin:0"><a href="${siteUrl}" style="color:#999;text-decoration:underline">www.elevateforhumanity.org</a> &nbsp;|&nbsp; (317) 314-3757</p>
          </div>
        </div>
      </div>`;

    // Send confirmation email to inquirer
    await sendEmail({
      to: email,
      subject: `Your inquiry about ${programLabel} — Elevate for Humanity`,
      html: confirmationHtml,
    });

    // Send notification email to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Inquiry: ${name} - ${program}`,
      html: `
        <h2>New Program Inquiry</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Program Interest</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${program}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Funding</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${funding || 'Not specified'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Submitted</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td></tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="mailto:${email}" style="background: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Reply to ${name}</a>
          <a href="tel:${phone}" style="background: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Call ${phone}</a>
        </p>
      `,
    });

    // SMS alert via AT&T email-to-SMS gateway (only if configured)
    if (ADMIN_SMS) {
      await sendEmail({
        to: ADMIN_SMS,
        subject: 'Inquiry',
        html: `${name}\n${program}\n${phone}`,
      }).catch((err) => logger.warn('[inquiry] SMS alert failed:', err));
    }

    if (contentType?.includes('application/json')) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.redirect(
      new URL('/inquiry/success', req.url),
      { status: 303 }
    );
  } catch (error) {
    logger.error('Inquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please call 317-314-3757.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/inquiry', _POST);
