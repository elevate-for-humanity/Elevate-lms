// PUBLIC ROUTE: provider application form

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { trySendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const {
    orgName,
    orgType,
    ein,
    website,
    contactName,
    contactTitle,
    contactEmail,
    contactPhone,
    addressLine1,
    addressLine2,
    city,
    state,
    zip,
    programTypes,
    serviceArea,
    annualEnrollment,
    credentialAuthorities,
    wioaEligible,
    etplListed,
    etplState,
    accreditation,
    missionStatement,
    outcomesDescription,
    partnershipGoals,
    // Documents & Banking
    w9FileUrl,
    einDocFileUrl,
    certificationFileUrl,
    resumeFileUrl,
    bankName,
    bankRoutingNumber,
    bankAccountNumber,
    bankAccountType,
    payrollProvider,
    quickbooksConnected,
    quickbooksCompanyId,
    agreedToTerms,
  } = body as Record<string, unknown>;

  // Required field validation
  const missing: string[] = [];
  if (!orgName) missing.push('orgName');
  if (!orgType) missing.push('orgType');
  if (!contactName) missing.push('contactName');
  if (!contactEmail) missing.push('contactEmail');
  if (!contactPhone) missing.push('contactPhone');
  if (!addressLine1) missing.push('addressLine1');
  if (!city) missing.push('city');
  if (!state) missing.push('state');
  if (!zip) missing.push('zip');
  if (!programTypes || (programTypes as string[]).length === 0) missing.push('programTypes');
  if (!agreedToTerms) missing.push('agreedToTerms');

  if (missing.length > 0) {
    return safeError(`Missing required fields: ${missing.join(', ')}`, 400);
  }

  const validOrgTypes = ['training_provider', 'workforce_agency', 'employer', 'community_org'];
  if (!validOrgTypes.includes(orgType as string)) {
    return safeError('Invalid organization type', 400);
  }

  try {
    const supabase = await getAdminClient();
    if (!supabase) {
      return safeInternalError(new Error('Admin database unavailable'), 'Failed to submit application');
    }

    // Check for duplicate pending application
    const { data: existing } = await supabase
      .from('provider_applications')
      .select('id, status')
      .eq('contact_email', contactEmail)
      .in('status', ['pending', 'under_review'])
      .maybeSingle();

    if (existing) {
      return safeError('An application from this email is already under review', 409);
    }

    const { data, error } = await supabase
      .from('provider_applications')
      .insert({
        org_name: orgName,
        org_type: orgType,
        ein: ein || null,
        website: website || null,
        contact_name: contactName,
        contact_title: contactTitle || null,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state,
        zip,
        program_types: programTypes,
        service_area: serviceArea || null,
        annual_enrollment: annualEnrollment ? Number(annualEnrollment) : null,
        credential_authorities: credentialAuthorities || [],
        wioa_eligible: Boolean(wioaEligible),
        etpl_listed: Boolean(etplListed),
        etpl_state: etplState || null,
        accreditation: accreditation || null,
        mission_statement: missionStatement || null,
        outcomes_description: outcomesDescription || null,
        partnership_goals: partnershipGoals || null,
        // Documents & Banking
        w9_file_url: w9FileUrl || null,
        ein_doc_file_url: einDocFileUrl || null,
        certification_file_url: certificationFileUrl || null,
        resume_file_url: resumeFileUrl || null,
        bank_name: bankName || null,
        bank_routing_number: bankRoutingNumber || null,
        bank_account_number: bankAccountNumber || null,
        bank_account_type: bankAccountType || null,
        payroll_provider: payrollProvider || null,
        quickbooks_connected: Boolean(quickbooksConnected),
        quickbooks_company_id: quickbooksCompanyId || null,
        agreed_to_terms: true,
        agreed_at: new Date().toISOString(),
        status: 'pending',
      })
      .select('id')
      .maybeSingle();

    if (error) {
      return safeInternalError(error, 'Failed to submit application');
    }

    const applicationId = data?.id ?? '';

    // If W9 was uploaded, create a w9_submissions audit row linked to this application
    if (w9FileUrl) {
      await supabase
        .from('w9_submissions')
        .insert({
          provider_app_id: applicationId,
          file_url: w9FileUrl,
          ein: ein || null,
          legal_name: orgName || null,
          submitted_at: new Date().toISOString(),
        })
        .catch((err) => logger.warn('[provider/apply] w9_submissions insert failed', err));
    }

    // Save document metadata to admin dashboard (ocr_extractions audit log)
    const docUploads = [
      { url: w9FileUrl, type: 'w9', label: 'W-9' },
      { url: einDocFileUrl, type: 'ein_doc', label: 'EIN Documentation' },
      { url: certificationFileUrl, type: 'certificate', label: 'Certifications' },
      { url: resumeFileUrl, type: 'resume', label: 'Resume' },
    ].filter((d) => d.url);

    if (docUploads.length > 0) {
      await supabase
        .from('provider_application_documents')
        .insert(
          docUploads.map((d) => ({
            application_id: applicationId,
            document_type: d.type,
            label: d.label,
            file_url: d.url,
            org_name: orgName,
            contact_email: contactEmail,
            uploaded_at: new Date().toISOString(),
          })),
        )
        .catch((err) => logger.warn('[provider/apply] doc metadata save failed', err));
    }

    // Confirmation email to applicant
    const applicantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#b91c1c;padding:28px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Application Received</h1>
          <p style="color:#fecaca;margin:6px 0 0;font-size:14px">${PLATFORM_DEFAULTS.orgName} — Training Provider Partnership</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin-top:0">Hi ${contactName},</p>
          <p>Thank you for applying to partner with <strong>${PLATFORM_DEFAULTS.orgName}</strong>. We've received your application for <strong>${orgName}</strong> and our team will review it within <strong>3–5 business days</strong>.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Application Summary</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="padding:4px 0;color:#64748b;width:40%">Organization</td><td style="padding:4px 0;font-weight:600">${orgName}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Type</td><td style="padding:4px 0;font-weight:600">${String(orgType).replace(/_/g, ' ')}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Contact</td><td style="padding:4px 0;font-weight:600">${contactName}${contactTitle ? `, ${contactTitle}` : ''}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Reference ID</td><td style="padding:4px 0;font-family:monospace;font-size:12px">${applicationId}</td></tr>
            </table>
          </div>
          <p>If you have questions in the meantime, reply to this email or contact us at <a href="mailto:partnerships@${PLATFORM_DEFAULTS.canonicalDomain}" style="color:#b91c1c">partnerships@${PLATFORM_DEFAULTS.canonicalDomain}</a>.</p>
          <p style="margin-bottom:0">— The ${PLATFORM_DEFAULTS.orgName} Team</p>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px">© ${new Date().getFullYear()} ${PLATFORM_DEFAULTS.orgName} · <a href={PLATFORM_DEFAULTS.siteUrl} style="color:#94a3b8">elevateforhumanity.org</a></p>
      </div>`;

    const emailResult = await trySendEmail({
      to: contactEmail as string,
      subject: `Application received — ${orgName} | ${PLATFORM_DEFAULTS.orgName}`,
      html: applicantHtml,
      text: `Hi ${contactName},\n\nThank you for applying to partner with ${PLATFORM_DEFAULTS.orgName}. We've received your application for ${orgName} and will review it within 3–5 business days.\n\nReference ID: ${applicationId}\n\nQuestions? Email partnerships@${PLATFORM_DEFAULTS.canonicalDomain}\n\n— The ${PLATFORM_DEFAULTS.orgName} Team`,
      replyTo: 'partnerships@${PLATFORM_DEFAULTS.canonicalDomain}',
    });

    if (!emailResult.ok) {
      // Log but don't fail the request — application is saved regardless
      logger.warn('[provider/apply] Confirmation email failed', { error: emailResult.error, applicationId });
    }

    // Internal notification to partnerships team
    await trySendEmail({
      to: 'partnerships@elevateforhumanity.org',
      subject: `New provider application — ${orgName}`,
      html: `<p>New provider application received.</p><p><strong>Org:</strong> ${orgName}<br><strong>Type:</strong> ${orgType}<br><strong>Contact:</strong> ${contactName} &lt;${contactEmail}&gt;<br><strong>Phone:</strong> ${contactPhone}<br><strong>ID:</strong> ${applicationId}</p><p><a href="https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/admin/applications">Review in Admin →</a></p>`,
      text: `New provider application: ${orgName} (${orgType})\nContact: ${contactName} <${contactEmail}>\nPhone: ${contactPhone}\nID: ${applicationId}\n\nReview: https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/admin/applications`,
    });

    return NextResponse.json({ success: true, applicationId }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to submit application');
  }
}
