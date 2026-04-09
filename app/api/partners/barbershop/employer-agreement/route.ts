import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  let body: Record<string, string>;
  try { body = await request.json(); }
  catch { return safeError('Invalid JSON', 400); }

  const {
    shop_name, owner_name, contact_email, phone,
    address_line1, city, state, zip, ein,
    license_number, license_state, license_expiry,
    mentor_name, mentor_license, mentor_license_expiry,
    wage_year1, wage_year2, wage_year3,
    ojl_hours_year, rti_hours_year,
    workers_comp, liability_insurance,
    signature, title, agreed,
  } = body;

  if (!shop_name || !contact_email || !signature || !agreed) {
    return safeError('shop_name, contact_email, signature, and agreed are required', 400);
  }
  if (!mentor_name || !mentor_license) {
    return safeError('Mentor name and license number are required', 400);
  }

  const db = await getAdminClient();
  const now = new Date().toISOString();
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  try {
    // 1. Update partner record with employer agreement data
    const { data: partner, error: partnerErr } = await db
      .from('partners')
      .update({
        ein,
        license_number,
        license_state: license_state || 'Indiana',
        license_expiry,
        onboarding_completed: true,
        onboarding_step: 'complete',
        updated_at: now,
      })
      .eq('contact_email', contact_email)
      .select('id')
      .single();

    if (partnerErr) {
      logger.error('Partner update failed', partnerErr);
      return safeError('Failed to update partner record', 500);
    }

    // 2. Store employer agreement in dedicated table
    await db.from('employer_agreements').insert({
      partner_id: partner?.id,
      shop_name,
      owner_name,
      contact_email,
      phone,
      address_line1,
      city,
      state: state || 'Indiana',
      zip,
      ein,
      license_number,
      license_state: license_state || 'Indiana',
      license_expiry,
      mentor_name,
      mentor_license,
      mentor_license_expiry,
      wage_year1,
      wage_year2,
      wage_year3,
      ojl_hours_year: ojl_hours_year || '2000',
      rti_hours_year: rti_hours_year || '144',
      workers_comp,
      liability_insurance,
      authorized_signature: signature,
      authorized_title: title,
      agreed: true,
      signed_at: now,
      ip_address: ip,
      user_agent: ua,
      rapids_program_number: '2025-IN-132301',
      sponsor_name: '2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)',
    }).catch(async (err) => {
      // Table may not exist yet — log but don't fail
      logger.error('employer_agreements insert failed (table may need migration)', err);
    });

    // 3. Confirmation email to partner
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: contact_email }] }],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: 'elevate4humanityedu@gmail.com' },
        subject: 'Employer Agreement Received — Barber Apprenticeship | Elevate for Humanity',
        content: [{
          type: 'text/html',
          value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2>Employer Agreement Received</h2>
            <p>Hi ${owner_name},</p>
            <p>Your Employer Agreement for the Barber Apprenticeship Program has been received and recorded.</p>
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Elevate will verify your licenses and insurance within 2 business days</li>
              <li>Your shop will be registered in RAPIDS as an approved training site</li>
              <li>You will receive your Employer Training Site ID by email</li>
              <li>Apprentice placements will begin once verification is complete</li>
            </ul>
            <p><strong>Agreement Summary:</strong></p>
            <ul>
              <li>Shop: ${shop_name}</li>
              <li>Mentor: ${mentor_name} (License: ${mentor_license})</li>
              <li>Wage Schedule: Year 1: $${wage_year1}/hr · Year 2: $${wage_year2}/hr · Year 3: $${wage_year3}/hr</li>
              <li>OJL Hours/Year: ${ojl_hours_year}</li>
              <li>RTI Hours/Year: ${rti_hours_year}</li>
              <li>Signed: ${now}</li>
            </ul>
            <p>Thank you,<br/><strong>Elevate for Humanity</strong><br/>(317) 314-3757</p>
          </div>`
        }],
      }),
    }).catch(() => {});

    // 4. Notify Elevate
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: process.env.ALERT_EMAIL_TO || 'elevate4humanityedu@gmail.com' }] }],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        subject: `[EMPLOYER AGREEMENT] ${shop_name} — Onboarding Complete`,
        content: [{
          type: 'text/html',
          value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2>Employer Agreement Submitted — Action Required</h2>
            <p>Please verify licenses and register in RAPIDS.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Shop</td><td style="padding:6px">${shop_name}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Owner</td><td style="padding:6px">${owner_name}</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Email</td><td style="padding:6px">${contact_email}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Phone</td><td style="padding:6px">${phone}</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">EIN</td><td style="padding:6px">${ein}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Address</td><td style="padding:6px">${address_line1}, ${city}, ${state} ${zip}</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Shop License #</td><td style="padding:6px">${license_number} (Expires: ${license_expiry})</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Mentor</td><td style="padding:6px">${mentor_name} — License: ${mentor_license} (Expires: ${mentor_license_expiry})</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Wages</td><td style="padding:6px">Yr1: $${wage_year1} · Yr2: $${wage_year2} · Yr3: $${wage_year3}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">OJL/RTI Hours</td><td style="padding:6px">${ojl_hours_year} OJL · ${rti_hours_year} RTI</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Workers Comp</td><td style="padding:6px">${workers_comp}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Liability</td><td style="padding:6px">${liability_insurance}</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Signed By</td><td style="padding:6px">${signature} (${title})</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Signed At</td><td style="padding:6px">${now}</td></tr>
              <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">IP</td><td style="padding:6px">${ip}</td></tr>
            </table>
          </div>`
        }],
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Employer agreement submission failed');
  }
}

export const POST = withRuntime(withApiAudit('/api/partners/barbershop/employer-agreement', _POST));
