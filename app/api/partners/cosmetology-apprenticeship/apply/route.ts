// PUBLIC ROUTE: cosmetology apprenticeship application
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      salonLegalName, salonDbaName, ownerName,
      contactName, contactEmail, contactPhone,
      salonAddressLine1, salonAddressLine2, salonCity, salonState, salonZip,
      indianaSalonLicenseNumber,
      supervisorName, supervisorLicenseNumber, supervisorYearsLicensed,
      compensationModel, numberOfEmployees,
      workersCompStatus, hasGeneralLiability, canSuperviseAndVerify,
      mouAcknowledged, consentAcknowledged, notes,
    } = body;

    if (!salonLegalName || !contactEmail || !contactPhone || !indianaSalonLicenseNumber || !supervisorName || !supervisorLicenseNumber) {
      return safeError('Missing required fields', 400);
    }
    if (!mouAcknowledged || !consentAcknowledged) {
      return safeError('Acknowledgments are required', 400);
    }

    const db = await getAdminClient();

    // Insert partner application
    const { data: partner, error: partnerError } = await db
      .from('partners')
      .insert({
        name: salonDbaName || salonLegalName,
        legal_name: salonLegalName,
        owner_name: ownerName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address_line1: salonAddressLine1,
        address_line2: salonAddressLine2,
        city: salonCity,
        state: salonState || 'IN',
        zip: salonZip,
        partner_type: 'salon',
        program_type: 'cosmetology',
        status: 'pending',
        license_number: indianaSalonLicenseNumber,
        supervisor_name: supervisorName,
        supervisor_license_number: supervisorLicenseNumber,
        supervisor_years_licensed: supervisorYearsLicensed ? parseInt(supervisorYearsLicensed) : null,
        compensation_model: compensationModel,
        number_of_employees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
        workers_comp_status: workersCompStatus,
        has_general_liability: hasGeneralLiability === 'yes',
        can_supervise_and_verify: canSuperviseAndVerify === 'yes',
        mou_acknowledged: mouAcknowledged,
        notes,
        applied_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (partnerError) {
      logger.error('Cosmetology salon application insert error:', partnerError);
      return safeInternalError(partnerError, 'Failed to submit application');
    }

    logger.info(`Cosmetology salon application submitted: ${partner.id} — ${salonLegalName}`);

    // Send emails — non-fatal
    const sgKey = process.env.SENDGRID_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const adminEmail = process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';

    if (sgKey) {
      const applicantName = contactName || ownerName || 'Partner';
      const mouLink = `${siteUrl}/login?redirect=/partners/cosmetology-apprenticeship/sign-mou`;

      // 1. Confirmation to applicant
      const applicantHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
  <tr><td style="background:#7c3aed;padding:28px 32px;text-align:center">
    <img src="${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" width="120" style="max-width:120px;height:auto;filter:brightness(10)" />
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px">Application Received — ${salonLegalName}</h2>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
      Hi ${applicantName}, thank you for applying to the <strong>Indiana Cosmetology Apprenticeship Program</strong> as a Host Salon partner.
      Our team will review your application within 2–3 business days and contact you at <strong>${contactEmail}</strong>.
    </p>
    <div style="background:#f5f3ff;border-radius:6px;padding:16px 20px;margin:0 0 24px">
      <p style="color:#5b21b6;font-size:13px;font-weight:bold;margin:0 0 8px">Your next step:</p>
      <p style="color:#5b21b6;font-size:13px;margin:0 0 12px">Sign the Memorandum of Understanding (MOU) to complete your onboarding.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <a href="${mouLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:14px">
            Log In &amp; Sign the MOU →
          </a>
        </td></tr>
      </table>
    </div>
    <div style="background:#f1f5f9;border-radius:6px;padding:16px 20px;margin:0 0 24px">
      <p style="color:#475569;font-size:13px;font-weight:bold;margin:0 0 8px">Application summary:</p>
      <table style="font-size:13px;color:#475569;width:100%">
        <tr><td style="padding:3px 0;font-weight:bold">Salon:</td><td>${salonLegalName}${salonDbaName ? ` (${salonDbaName})` : ''}</td></tr>
        <tr><td style="padding:3px 0;font-weight:bold">License #:</td><td>${indianaSalonLicenseNumber}</td></tr>
        <tr><td style="padding:3px 0;font-weight:bold">Supervisor:</td><td>${supervisorName} — IPLA ${supervisorLicenseNumber}</td></tr>
        <tr><td style="padding:3px 0;font-weight:bold">Compensation:</td><td>${compensationModel || 'Not specified'}</td></tr>
      </table>
    </div>
    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0">
      Questions? Call <a href="tel:3173143757" style="color:#7c3aed">(317) 314-3757</a> or email
      <a href="mailto:elevate4humanityedu@gmail.com" style="color:#7c3aed">elevate4humanityedu@gmail.com</a>.
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">Elevate for Humanity Career &amp; Technical Institute · (317) 314-3757</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

      // 2. Admin notification
      const adminHtml = `<h2>New Cosmetology Salon Application</h2>
<table style="border-collapse:collapse;font-size:13px">
  <tr><td style="padding:6px;font-weight:bold">Salon</td><td>${salonLegalName}${salonDbaName ? ` (${salonDbaName})` : ''}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Owner</td><td>${ownerName}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Contact</td><td>${contactName} — ${contactEmail} — ${contactPhone}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Address</td><td>${salonAddressLine1}, ${salonCity}, ${salonState} ${salonZip}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Salon License</td><td>${indianaSalonLicenseNumber}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Supervisor</td><td>${supervisorName} — IPLA ${supervisorLicenseNumber} (${supervisorYearsLicensed} yrs)</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Compensation</td><td>${compensationModel}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Workers Comp</td><td>${workersCompStatus}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">General Liability</td><td>${hasGeneralLiability}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Partner ID</td><td>${partner.id}</td></tr>
</table>
<p><a href="${siteUrl}/admin/program-holders">Review in Admin Dashboard →</a></p>`;

      await Promise.allSettled([
        fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            reply_to: { email: 'elevate4humanityedu@gmail.com' },
            personalizations: [{ to: [{ email: contactEmail, name: applicantName }] }],
            subject: `Application Received — ${salonLegalName} | Elevate Cosmetology Apprenticeship`,
            content: [{ type: 'text/html', value: applicantHtml }],
          }),
        }),
        fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            personalizations: [{ to: [{ email: adminEmail }] }],
            subject: `[NEW APPLICATION] Cosmetology Salon — ${salonLegalName}`,
            content: [{ type: 'text/html', value: adminHtml }],
          }),
        }),
      ]);
    }

    return NextResponse.json({ success: true, partnerId: partner.id }, { status: 201 });
  } catch (error) {
    logger.error('Cosmetology salon apply error:', error);
    return safeInternalError(error, 'Failed to process application');
  }
}

export const POST = withRuntime(_POST);
