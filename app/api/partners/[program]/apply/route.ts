
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { getProgramConfig } from '@/lib/partners/program-config';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu/30min';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ program: string }> }
) {
  await hydrateProcessEnv();
  try {
    const { program } = await params;

    // Regulated programs have dedicated endpoints with compliance-specific fields.
    // Accepting them here would write to partner_applications, bypassing required
    // regulatory fields (shop license, supervisor license, workers comp, MOU).
    const REGULATED_SLUGS = ['barbershop-apprenticeship'];
    if (REGULATED_SLUGS.includes(program)) {
      return NextResponse.json(
        { error: 'This program requires a dedicated application. Please use /programs/barber-apprenticeship/apply.' },
        { status: 400 }
      );
    }

    const config = getProgramConfig(program);

    if (!config) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required universal fields
    const required = ['businessLegalName', 'contactName', 'contactEmail', 'contactPhone', 'addressLine1', 'city', 'state', 'zip'];
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Validate required program-specific fields
    for (const field of config.programFields) {
      if (field.required && !body.programFields?.[field.name]?.trim()) {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
      }
    }

    const db = createAdminClient();

    // Check for duplicate (same email in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await db
      .from('partner_applications')
      .select('id')
      .eq('contact_email', body.contactEmail.toLowerCase().trim())
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'An application with this email was already submitted in the last 24 hours.' },
        { status: 409 }
      );
    }

    // Insert into partner_applications
    const { data: application, error: insertError } = await db
      .from('partner_applications')
      .insert({
        shop_name: body.businessLegalName.trim(),
        dba: body.dba?.trim() || null,
        owner_name: body.contactName.trim(),
        contact_email: body.contactEmail.toLowerCase().trim(),
        email: body.contactEmail.toLowerCase().trim(),
        phone: body.contactPhone.trim(),
        address_line1: body.addressLine1.trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        zip: body.zip.trim(),
        programs_requested: [program],
        status: 'pending',
        approval_status: 'pending',
        agreed_to_terms: body.agreeToTerms || false,
        intake: {
          program: program,
          programName: config.name,
          website: body.website || null,
          yearsInBusiness: body.yearsInBusiness || null,
          numberOfEmployees: body.numberOfEmployees || null,
          compensationModel: body.compensationModel || null,
          positionsAvailable: body.positionsAvailable || null,
          agreeToSiteVisit: body.agreeToSiteVisit || false,
          agreeToWorkersComp: body.agreeToWorkersComp || false,
          ...body.programFields,
        },
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert partner application', insertError);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    // Build welcome email
    const siteDisplayName = body.dba?.trim() || body.businessLegalName.trim();
    const welcomeHtml = buildPartnerWelcomeEmail(config, body.contactName.trim(), siteDisplayName, CALENDLY_URL);

    // Send to applicant
    await sendEmail({
      to: body.contactEmail.toLowerCase().trim(),
      subject: `Welcome to the ${config.shortName} Partner Program — ${siteDisplayName}`,
      html: welcomeHtml,
    }).catch(err => logger.error('Failed to send partner welcome email', err));

    // Send copy to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Copy] Welcome to the ${config.shortName} Partner Program — ${siteDisplayName}`,
      html: welcomeHtml,
    }).catch(err => logger.error('Failed to send admin copy', err));

    // Send admin notification with application details
    const adminNotifHtml = buildAdminNotificationEmail(config, body, siteDisplayName, application?.id);
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Partner Application: ${siteDisplayName} — ${config.shortName}`,
      html: adminNotifHtml,
    }).catch(err => logger.error('Failed to send admin notification', err));

    return NextResponse.json({ success: true, id: application?.id });
  } catch (err) {
    logger.error('Partner application error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildPartnerWelcomeEmail(
  config: ReturnType<typeof getProgramConfig> & {},
  contactName: string,
  siteDisplayName: string,
  calendlyUrl: string
): string {
  const requirementsList = config.requirements
    .map(r => `<li><strong>${r.title}:</strong> ${r.description}</li>`)
    .join('');

  const registeredBadge = config.registeredApprenticeship
    ? '<p>This is a <strong>USDOL Registered Apprenticeship</strong> program.</p>'
    : '';

  const itinLine = config.itinAccepted
    ? `<li><strong>ITIN Accepted:</strong> ${config.traineeLabelPlural.charAt(0).toUpperCase() + config.traineeLabelPlural.slice(1)} may use an ITIN in place of an SSN for enrollment.</li>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:Arial,sans-serif;line-height:1.7;color:#333;margin:0;padding:0}
  .container{max-width:640px;margin:0 auto;padding:0}
  .header{background:#f97316;color:white;padding:35px 30px;text-align:center}
  .header h1{margin:0;font-size:24px}
  .content{padding:30px;background:#f9fafb}
  .content h2{color:#1e293b;margin-top:0}
  .section{background:white;border-radius:10px;padding:24px;margin:20px 0;border:1px solid #e2e8f0}
  .section h3{color:#f97316;margin-top:0;font-size:18px}
  .cta-btn{display:inline-block;padding:14px 36px;background:#f97316;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;margin:10px 0}
  .footer{padding:24px 30px;text-align:center;color:#64748b;font-size:13px;background:#f1f5f9}
  ul{padding-left:20px}li{margin-bottom:8px}
</style></head>
<body><div class="container">
  <div class="header"><h1>Welcome to the ${config.shortName} Partner Program</h1></div>
  <div class="content">
    <h2>Hi ${contactName},</h2>
    <p>Thank you for your interest in becoming a partner ${config.siteLabel} with <strong>Elevate for Humanity</strong>! We received your application for <strong>${siteDisplayName}</strong> and we are excited to move forward with you.</p>

    <div class="section">
      <h3>About the Program</h3>
      ${registeredBadge}
      <p>As a partner ${config.siteLabel}, you will host ${config.traineeLabelPlural} who complete <strong>${config.trainingHours.toLocaleString()} hours</strong> of on-the-job training under a ${config.supervisorTitle.toLowerCase()} at your ${config.siteLabel}.${config.theoryProvider ? ` ${config.traineeLabelPlural.charAt(0).toUpperCase() + config.traineeLabelPlural.slice(1)} also complete theory coursework through ${config.theoryProvider}.` : ''}</p>
      ${config.licensingExam ? `<p>Upon completion, ${config.traineeLabelPlural} are eligible to sit for the <strong>${config.licensingExam}</strong>.</p>` : ''}
    </div>

    <div class="section">
      <h3>What You Need to Know</h3>
      <ul>
        ${requirementsList}
        ${itinLine}
      </ul>
    </div>

    <div class="section">
      <h3>What We Need From You</h3>
      <ul>
        <li>Your <strong>${config.siteLabel} logo</strong> (high resolution PNG or JPG)</li>
        <li><strong>Photos of the inside and outside of your ${config.siteLabel}</strong> (at least 2-3 of each)</li>
        <li>These will be used on your partner profile page on our website</li>
      </ul>
      <p>You can reply to this email with the images attached, or text them to <strong>(317) 314-3757</strong>.</p>
    </div>

    <div class="section">
      <h3>What Happens Next</h3>
      <ol>
        <li><strong>Verification (1-3 business days):</strong> We verify your credentials and licensing.</li>
        ${config.siteVisitRequired ? '<li><strong>Video Site Visit:</strong> A short Zoom call to see your ' + config.siteLabel + ' (~15 minutes).</li>' : ''}
        <li><strong>MOU Signing:</strong> We send the official Memorandum of Understanding for signature.</li>
        <li><strong>Approval (~${config.approvalTimeline}):</strong> Your ${config.siteLabel} becomes an approved worksite.</li>
        <li><strong>${config.traineeLabel.charAt(0).toUpperCase() + config.traineeLabel.slice(1)} Matching:</strong> We work with you to match qualified ${config.traineeLabelPlural}.</li>
      </ol>
    </div>

    ${config.siteVisitRequired ? `
    <div class="section" style="text-align:center;background:#fff7ed">
      <h3>Schedule Your Site Visit</h3>
      <p>Ready to move forward? Book your 15-minute Zoom site visit now.</p>
      <p><a href="${calendlyUrl}" class="cta-btn" style="background:#f97316;color:white">Schedule Site Visit</a></p>
    </div>` : ''}

    <p>We look forward to having <strong>${siteDisplayName}</strong> as part of the team. If you have any questions, just reply to this email or call us at <strong>(317) 314-3757</strong>.</p>

    <p>Welcome aboard,<br>
    <strong>Demetrius Ganaway</strong><br>
    Founder, Elevate for Humanity<br>
    Career &amp; Technical Institute<br>
    8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
  </div>
  <div class="footer">
    <p>Elevate for Humanity Career &amp; Technical Institute<br>
    <a href="https://www.elevateforhumanity.org">www.elevateforhumanity.org</a> | (317) 314-3757</p>
  </div>
</div></body></html>`;
}

function buildAdminNotificationEmail(
  config: ReturnType<typeof getProgramConfig> & {},
  body: Record<string, unknown>,
  siteDisplayName: string,
  applicationId?: string
): string {
  const programFieldRows = config.programFields
    .map(f => {
      const val = (body.programFields as Record<string, string>)?.[f.name] || 'N/A';
      return `<tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">${f.label}</td><td style="padding:6px 12px">${val}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333">
  <h2 style="color:#f97316">New Partner Application: ${config.shortName}</h2>
  <p><strong>${siteDisplayName}</strong> has applied to become a partner ${config.siteLabel}.</p>
  ${applicationId ? `<p style="color:#64748b;font-size:13px">Application ID: ${applicationId}</p>` : ''}
  <table style="border-collapse:collapse;width:100%;max-width:500px">
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Business</td><td style="padding:6px 12px">${body.businessLegalName}${body.dba ? ` (DBA: ${body.dba})` : ''}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Contact</td><td style="padding:6px 12px">${body.contactName}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Email</td><td style="padding:6px 12px">${body.contactEmail}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Phone</td><td style="padding:6px 12px">${body.contactPhone}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Address</td><td style="padding:6px 12px">${body.addressLine1}, ${body.city}, ${body.state} ${body.zip}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Program</td><td style="padding:6px 12px">${config.name}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Positions</td><td style="padding:6px 12px">${body.positionsAvailable || 'N/A'}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;color:#64748b">Compensation</td><td style="padding:6px 12px">${body.compensationModel || 'N/A'}</td></tr>
    ${programFieldRows}
  </table>
</body></html>`;
}
