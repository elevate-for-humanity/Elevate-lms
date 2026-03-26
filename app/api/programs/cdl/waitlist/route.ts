
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const required = ['firstName', 'lastName', 'email', 'phone', 'city', 'zip'];
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const db = createAdminClient();

    // Check for duplicate (same email in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await db
      .from('applications')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .ilike('program_interest', '%cdl%')
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'You already submitted a CDL waitlist application recently.' },
        { status: 409 }
      );
    }

    // Insert into applications table
    const { data: application, error: insertError } = await db
      .from('applications')
      .insert({
        first_name: body.firstName.trim(),
        last_name: body.lastName.trim(),
        email: body.email.toLowerCase().trim(),
        phone: body.phone.trim(),
        city: body.city.trim(),
        zip: body.zip.trim(),
        program_interest: 'CDL Training - October 2026 Cohort',
        status: 'waitlist',
        eligibility_data: { state: body.state?.trim() || 'Indiana' },
        support_notes: [
          body.currentLicense ? `License: ${body.currentLicense}` : '',
          body.employmentStatus ? `Employment: ${body.employmentStatus}` : '',
          body.fundingSource ? `Funding: ${body.fundingSource}` : '',
          body.notes ? `Notes: ${body.notes}` : '',
        ].filter(Boolean).join(' | '),
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert CDL waitlist application', insertError);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    // Send confirmation email to applicant
    const confirmHtml = buildWaitlistConfirmationEmail(body.firstName.trim());
    await sendEmail({
      to: body.email.toLowerCase().trim(),
      subject: 'CDL Training Waitlist — You\'re In! | Elevate for Humanity',
      html: confirmHtml,
    }).catch(err => logger.error('Failed to send CDL waitlist confirmation', err));

    // Send admin notification
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New CDL Waitlist Signup: ${body.firstName} ${body.lastName}`,
      html: `<h2 style="color:#f97316">New CDL Waitlist Signup</h2>
        <p><strong>${body.firstName} ${body.lastName}</strong> joined the CDL October 2026 waitlist.</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Email</td><td style="padding:4px 12px">${body.email}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Phone</td><td style="padding:4px 12px">${body.phone}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Location</td><td style="padding:4px 12px">${body.city}, ${body.state || 'IN'} ${body.zip}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Current License</td><td style="padding:4px 12px">${body.currentLicense || 'N/A'}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Employment</td><td style="padding:4px 12px">${body.employmentStatus || 'N/A'}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Funding</td><td style="padding:4px 12px">${body.fundingSource || 'N/A'}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;color:#64748b">Notes</td><td style="padding:4px 12px">${body.notes || 'None'}</td></tr>
        </table>`,
    }).catch(err => logger.error('Failed to send CDL waitlist admin notification', err));

    return NextResponse.json({ success: true, id: application?.id });
  } catch (err) {
    logger.error('CDL waitlist error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildWaitlistConfirmationEmail(firstName: string): string {
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
  .footer{padding:24px 30px;text-align:center;color:#64748b;font-size:13px;background:#f1f5f9}
  ul{padding-left:20px}li{margin-bottom:8px}
</style></head>
<body><div class="container">
  <div class="header"><h1>CDL Training — You're on the Waitlist!</h1></div>
  <div class="content">
    <h2>Hi ${firstName},</h2>
    <p>Thank you for joining the waitlist for the <strong>CDL Class A Training Program</strong> with Elevate for Humanity! You are confirmed for the <strong>October 2026 cohort</strong>.</p>

    <div class="section">
      <h3>Program Details</h3>
      <ul>
        <li><strong>Program:</strong> CDL Class A Commercial Driver Training</li>
        <li><strong>Duration:</strong> 160 hours (classroom + behind-the-wheel)</li>
        <li><strong>Cohort Start:</strong> October 2026</li>
        <li><strong>Location:</strong> Indianapolis, IN</li>
        <li><strong>Credential:</strong> CDL Class A License</li>
      </ul>
    </div>

    <div class="section">
      <h3>What Happens Next</h3>
      <ol>
        <li><strong>Confirmation:</strong> You are now on the waitlist with priority enrollment.</li>
        <li><strong>Funding Assistance:</strong> We will contact you about funding options including WIOA, VA benefits, grants, and payment plans.</li>
        <li><strong>Enrollment Opens:</strong> About 60 days before the cohort start, we will send enrollment instructions.</li>
        <li><strong>Orientation:</strong> Before classes begin, you will attend a mandatory orientation session.</li>
      </ol>
    </div>

    <div class="section">
      <h3>Funding Options</h3>
      <p>Many students qualify for funding that covers part or all of the training cost:</p>
      <ul>
        <li><strong>WIOA:</strong> Workforce Innovation and Opportunity Act funding through your local WorkOne office</li>
        <li><strong>VA / GI Bill:</strong> For eligible veterans and service members</li>
        <li><strong>Employer Sponsorship:</strong> Some trucking companies sponsor CDL training</li>
        <li><strong>Grants &amp; Scholarships:</strong> Elevate offers need-based assistance</li>
        <li><strong>Self-Pay:</strong> Payment plans available</li>
      </ul>
      <p>Not sure about funding? We will help you figure it out — just reply to this email or call us.</p>
    </div>

    <p>If you have any questions, reply to this email or call us at <strong>(317) 314-3757</strong>.</p>

    <p>We look forward to seeing you in October!<br>
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
