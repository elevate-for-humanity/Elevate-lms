// PUBLIC ROUTE: barbershop apprenticeship application

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getClientIp, hashIp } from '@/lib/api/get-client-ip';
import { isValidEmail, isValidPhone } from '@/lib/validate';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface ApplicationData {
  shopLegalName: string;
  shopDbaName?: string;
  ownerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  shopAddressLine1: string;
  shopAddressLine2?: string;
  shopCity: string;
  shopState: string;
  shopZip: string;
  shopPhysicalAddress?: string;
  indianaShopLicenseNumber: string;
  supervisorName: string;
  supervisorLicenseNumber: string;
  supervisorYearsLicensed?: string;
  compensationModel: string;
  workersCompStatus: string;
  canSuperviseAndVerify: string;
  apprenticesOnPayroll?: string;
  hasGeneralLiability?: string;
  numberOfEmployees?: string;
  // EIN
  ein?: string;
  einFileData?: string; // base64 data URL
  einFileName?: string;
  einQaNotes?: string;
  shopLicenseFileData?: string;
  shopLicenseFileName?: string;
  insuranceFileData?: string;
  insuranceFileName?: string;
  // Employer acceptance agreement
  employerAcceptanceAcknowledged?: boolean;
  employerAcceptanceSignatureData?: string;
  employerAcceptanceSignedAt?: string;
  employerAcceptanceSignerName?: string;
  // MOU signature
  mouSignatureData?: string;
  mouSignedAt?: string;
  mouSignerName?: string;
  // Consent signature
  consentSignatureData?: string;
  consentSignedAt?: string;
  consentSignerName?: string;
  // Legacy
  mouAcknowledged: boolean;
  consentAcknowledged: boolean;
  notes?: string;
  signatureData?: string;
  honeypot?: string;
}

const REQUIRED_FIELDS = [
  'shopLegalName',
  'ownerName',
  'contactName',
  'contactEmail',
  'contactPhone',
  'shopAddressLine1',
  'shopCity',
  'shopZip',
  'indianaShopLicenseNumber',
  'supervisorName',
  'supervisorLicenseNumber',
  'compensationModel',
  'workersCompStatus',
  'canSuperviseAndVerify',
] as const;

const VALID_COMPENSATION_MODELS = ['hourly', 'hybrid'];
const VALID_WC_STATUSES = ['verified', 'exempt', 'none'];

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body: ApplicationData = await req.json();

    // Honeypot check
    if (body.honeypot) {
      return NextResponse.json({ success: true }); // Silent fail for bots
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate email
    if (!isValidEmail(body.contactEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Validate phone
    if (!isValidPhone(body.contactPhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Validate payroll confirmation — apprentices must be on shop payroll
    if (body.apprenticesOnPayroll !== 'yes') {
      return NextResponse.json(
        {
          error:
            'Apprentices must be added to your payroll. Shops that cannot add apprentices to payroll are not eligible to host registered apprenticeship OJL.',
        },
        { status: 400 },
      );
    }

    // Validate compensation model
    if (!VALID_COMPENSATION_MODELS.includes(body.compensationModel)) {
      return NextResponse.json({ error: 'Please select a compensation model' }, { status: 400 });
    }

    // Validate Workers' Comp status
    const wcStatus = body.workersCompStatus || 'none';
    if (!VALID_WC_STATUSES.includes(wcStatus)) {
      return NextResponse.json({ error: 'Invalid workers compensation status' }, { status: 400 });
    }

    // Validate acknowledgments
    if (!body.mouAcknowledged || !body.consentAcknowledged) {
      return NextResponse.json(
        { error: 'You must acknowledge both the MOU and consent checkboxes' },
        { status: 400 },
      );
    }

    if (body.canSuperviseAndVerify !== 'yes') {
      return NextResponse.json(
        {
          error:
            'A licensed supervising barber who can verify apprentice hours is required to host apprentices.',
        },
        { status: 400 },
      );
    }

    if (body.hasGeneralLiability !== 'yes') {
      return NextResponse.json(
        { error: 'General liability insurance is required for all partner barbershops.' },
        { status: 400 },
      );
    }

    if (wcStatus === 'none') {
      return NextResponse.json(
        {
          error:
            "Workers' compensation coverage (or a valid exemption) is required before you can host apprentices.",
        },
        { status: 400 },
      );
    }

    if (!body.signatureData || String(body.signatureData).length < 100) {
      return NextResponse.json(
        { error: 'A valid signature is required to submit your application.' },
        { status: 400 },
      );
    }

    if (!body.shopLicenseFileData || !body.shopLicenseFileName) {
      return NextResponse.json(
        { error: 'Please upload a copy of your Indiana barbershop license.' },
        { status: 400 },
      );
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      logger.error('Supabase admin client not available');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Check for duplicate submissions (same email + license in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('barbershop_partner_applications')
      .select('id')
      .eq('contact_email', body.contactEmail.toLowerCase())
      .eq('indiana_shop_license_number', body.indianaShopLicenseNumber)
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error:
            'An application with this email and license number was already submitted recently. Please contact us if you need to update your application.',
        },
        { status: 400 },
      );
    }

    // Upload EIN document to storage if provided
    let einDocumentPath: string | null = null;
    if (body.einFileData && body.einFileName) {
      try {
        const base64Data = body.einFileData.split(',')[1];
        const mimeType = body.einFileData.split(';')[0].replace('data:', '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = body.einFileName.split('.').pop() || 'pdf';
        const storagePath = `ein-documents/${Date.now()}-${body.contactEmail.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
        if (!uploadError) einDocumentPath = storagePath;
        else logger.error('EIN document upload failed', uploadError);
      } catch (uploadErr) {
        logger.error('EIN document upload error', uploadErr as Error);
      }
    }
    let shopLicenseDocumentPath: string | null = null;
    if (body.shopLicenseFileData && body.shopLicenseFileName) {
      try {
        const base64Data = body.shopLicenseFileData.split(',')[1];
        const mimeType = body.shopLicenseFileData.split(';')[0].replace('data:', '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = body.shopLicenseFileName.split('.').pop() || 'pdf';
        const storagePath = `shop-license-documents/${Date.now()}-${body.contactEmail.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
        if (!uploadError) shopLicenseDocumentPath = storagePath;
      } catch (uploadErr) {
        logger.error('Shop license document upload error', uploadErr as Error);
      }
    }

    let insuranceCoiFilePath: string | null = null;
    if (body.insuranceFileData && body.insuranceFileName) {
      try {
        const base64Data = body.insuranceFileData.split(',')[1];
        const mimeType = body.insuranceFileData.split(';')[0].replace('data:', '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = body.insuranceFileName.split('.').pop() || 'pdf';
        const storagePath = `insurance-coi-documents/${Date.now()}-${body.contactEmail.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
        if (!uploadError) insuranceCoiFilePath = storagePath;
      } catch (uploadErr) {
        logger.error('Insurance COI upload error', uploadErr as Error);
      }
    }

    const approvalHoldReasons: string[] = [];
    if (body.hasGeneralLiability !== 'yes')
      approvalHoldReasons.push('General liability not confirmed');
    if (wcStatus === 'none') approvalHoldReasons.push("Workers' compensation missing");
    if (!insuranceCoiFilePath) approvalHoldReasons.push('Insurance certificate not uploaded');
    const insuranceStatus = approvalHoldReasons.length > 0 ? 'rejected' : 'pending';
    const insuranceReasonCodes = approvalHoldReasons.map(
      (r) => `MISSING:${r.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
    );

    const ipRaw = getClientIp(req);

    // Insert application
    const { data, error } = await supabase
      .from('barbershop_partner_applications')
      .insert({
        shop_legal_name: body.shopLegalName.trim(),
        shop_dba_name: body.shopDbaName?.trim() || null,
        owner_name: body.ownerName.trim(),
        contact_name: body.contactName.trim(),
        contact_email: body.contactEmail.toLowerCase().trim(),
        contact_phone: body.contactPhone.trim(),
        shop_address_line1: body.shopAddressLine1.trim(),
        shop_address_line2: body.shopAddressLine2?.trim() || null,
        shop_city: body.shopCity.trim(),
        shop_state: body.shopState || 'IN',
        shop_zip: body.shopZip.trim(),
        shop_physical_address: body.shopPhysicalAddress?.trim() || null,
        indiana_shop_license_number: body.indianaShopLicenseNumber.trim(),
        supervisor_name: body.supervisorName.trim(),
        supervisor_license_number: body.supervisorLicenseNumber.trim(),
        supervisor_years_licensed: body.supervisorYearsLicensed
          ? parseInt(body.supervisorYearsLicensed)
          : null,
        apprentices_on_payroll: body.apprenticesOnPayroll === 'yes',
        compensation_model: body.compensationModel,
        number_of_employees: body.numberOfEmployees ? parseInt(body.numberOfEmployees) : null,
        has_general_liability: body.hasGeneralLiability === 'yes',
        workers_comp_status: body.workersCompStatus || 'none',
        insurance_status: insuranceStatus,
        insurance_coi_file_path: insuranceCoiFilePath,
        insurance_reason_codes: insuranceReasonCodes,
        insurance_review_method: insuranceCoiFilePath ? 'OCR' : 'NONE',
        insurance_validation_json: approvalHoldReasons.length
          ? { approvalHold: true, reasons: approvalHoldReasons }
          : null,
        // Legacy fields preserved for backward compatibility
        employment_model: body.compensationModel,
        has_workers_comp: body.workersCompStatus === 'verified',
        can_supervise_and_verify: body.canSuperviseAndVerify === 'yes',
        mou_acknowledged: body.mouAcknowledged,
        consent_acknowledged: body.consentAcknowledged,
        notes:
          [
            body.notes?.trim() || null,
            shopLicenseDocumentPath
              ? `shop_license_document_path=${shopLicenseDocumentPath}`
              : null,
            approvalHoldReasons.length
              ? `approval_hold_reasons=${approvalHoldReasons.join('; ')}`
              : null,
          ]
            .filter(Boolean)
            .join('\n') || null,
        signature_data: body.signatureData || null,
        // EIN
        ein: body.ein?.trim() || null,
        ein_document_path: einDocumentPath,
        ein_qa_notes: body.einQaNotes?.trim() || null,
        // Employer acceptance agreement
        employer_acceptance_acknowledged: body.employerAcceptanceAcknowledged ?? false,
        employer_acceptance_signature_data: body.employerAcceptanceSignatureData || null,
        employer_acceptance_signed_at: body.employerAcceptanceSignedAt || null,
        employer_acceptance_signer_name: body.employerAcceptanceSignerName?.trim() || null,
        // MOU signature
        mou_signature_data: body.mouSignatureData || null,
        mou_signed_at: body.mouSignedAt || null,
        mou_signer_name: body.mouSignerName?.trim() || body.contactName.trim(),
        // Consent signature
        consent_signature_data: body.consentSignatureData || null,
        consent_signed_at: body.consentSignedAt || null,
        consent_signer_name: body.consentSignerName?.trim() || body.contactName.trim(),
        source_url: req.headers.get('referer') || null,
        user_agent: req.headers.get('user-agent') || null,
        ip_hash: hashIp(ipRaw),
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error('Failed to insert barbershop partner application', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 },
      );
    }

    // Send internal notification email
    const internalEmailHtml = `
      <h2>New Barbershop Partner Application</h2>
      <p><strong>Shop:</strong> ${body.shopLegalName}${body.shopDbaName ? ` (DBA: ${body.shopDbaName})` : ''}</p>
      <p><strong>Owner:</strong> ${body.ownerName}</p>
      <p><strong>Contact:</strong> ${body.contactName}</p>
      <p><strong>Email:</strong> ${body.contactEmail}</p>
      <p><strong>Phone:</strong> ${body.contactPhone}</p>
      <p><strong>Mailing Address:</strong> ${body.shopAddressLine1}${body.shopAddressLine2 ? ', ' + body.shopAddressLine2 : ''}, ${body.shopCity}, ${body.shopState} ${body.shopZip}</p>
      ${body.shopPhysicalAddress ? `<p><strong>Physical/Shop Address:</strong> ${body.shopPhysicalAddress}</p>` : ''}
      <p><strong>Shop License #:</strong> ${body.indianaShopLicenseNumber}</p>
      <p><strong>EIN:</strong> ${body.ein || 'Not provided'}${einDocumentPath ? ' <em>(EIN document uploaded)</em>' : ''}</p>
      ${body.einQaNotes ? `<p><strong>EIN Notes:</strong> ${body.einQaNotes}</p>` : ''}
      <p><strong>Supervisor:</strong> ${body.supervisorName} (License: ${body.supervisorLicenseNumber}, ${body.supervisorYearsLicensed || 'N/A'} years)</p>
      <p><strong>Compensation Model:</strong> ${body.compensationModel}</p>
      <p><strong>Workers' Comp:</strong> ${body.workersCompStatus}</p>
      <p><strong>Can Supervise:</strong> ${body.canSuperviseAndVerify}</p>
      <p><strong>Employer Acceptance Signed:</strong> ${body.employerAcceptanceAcknowledged ? `Yes — ${body.employerAcceptanceSignerName || 'name not captured'} at ${body.employerAcceptanceSignedAt || 'time not captured'}` : 'No'}</p>
      <p><strong>MOU Signed:</strong> ${body.mouSignedAt ? `Yes at ${body.mouSignedAt}` : 'No'}</p>
      <p><strong>Consent Signed:</strong> ${body.consentSignedAt ? `Yes at ${body.consentSignedAt}` : 'No'}</p>
      ${body.notes ? `<p><strong>Notes:</strong> ${body.notes}</p>` : ''}
      <hr>
      <p><small>Application ID: ${data.id}</small></p>
    `;

    await sendEmail({
      to: process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com',
      subject: `New Barbershop Partner Application: ${body.shopLegalName}`,
      html: internalEmailHtml,
    }).catch((err) => logger.error('Failed to send internal notification', err));

    // Send partner welcome email to applicant (+ admin copy)
    const shopDisplayName = body.shopDbaName || body.shopLegalName;
    const partnerWelcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
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
        <div class="header"><h1>Welcome to the Barbershop Partner Program</h1></div>
        <div class="content">
          <h2>Hi ${body.contactName},</h2>
          <p>Thank you for your interest in becoming a partner shop with <strong>${PLATFORM_DEFAULTS.orgName}</strong>! We received your application for <strong>${shopDisplayName}</strong> and we are excited to move forward with you.</p>

          <div class="section">
            <h3>About the Program</h3>
            <p>The Indiana Barber Apprenticeship is a <strong>USDOL Registered Apprenticeship</strong> program. As a partner shop, you will host apprentices who complete <strong>2,000 hours</strong> of on-the-job training under a licensed supervising barber in your shop. Apprentices also complete theory coursework through the Elevate LMS.</p>
            <p>Once an apprentice finishes the program, they are eligible to sit for the <strong>Indiana State Board barber license exam</strong>.</p>
          </div>

          <div class="section">
            <h3>What You Need to Know</h3>
            <ul>
              <li><strong>Workers&rsquo; Comp:</strong> Partner shops are required to carry workers&rsquo; compensation insurance for apprentices. If you do not currently have it, we can help you understand your options.</li>
              <li><strong>Pay Structure:</strong> Apprentices must be paid at least <strong>minimum wage ($7.25/hr)</strong> during training. Many shops use an hourly wage, commission, or hybrid model. You choose what works for your business.</li>
              <li><strong>Supervising Barber:</strong> You must designate a licensed barber in your shop to supervise and verify apprentice hours and competencies.</li>
              <li><strong>State Board Inspection:</strong> Your shop must hold a valid Indiana shop license and be in good standing with the Indiana Professional Licensing Agency (IPLA).</li>
              <li><strong>Tools &amp; Kit:</strong> Apprentices are responsible for their own barber kit. Elevate provides a recommended kit list and can help connect apprentices with funding if needed.</li>
              <li><strong>ITIN Accepted:</strong> Apprentices may use an ITIN (Individual Taxpayer Identification Number) in place of an SSN for enrollment.</li>
              <li><strong>Video Site Visit:</strong> Before final approval, we conduct a short video site visit (via Zoom) to see your shop and confirm it meets program requirements. This typically takes about 15 minutes.</li>
              <li><strong>Approval Timeline:</strong> Once your application and site visit are complete, approval typically takes about <strong>1 week</strong>.</li>
              <li><strong>DOL Listing:</strong> Approved partner shops are listed on the U.S. Department of Labor RAPIDS system as registered apprenticeship worksites.</li>
            </ul>
          </div>

          <div class="section">
            <h3>What We Need From You</h3>
            <ul>
              <li>Your <strong>shop logo</strong> (high resolution PNG or JPG)</li>
              <li><strong>Photos of the inside and outside of your shop</strong> (at least 2-3 of each)</li>
              <li>These will be used on your partner profile page on our website</li>
            </ul>
            <p>You can reply to this email with the images attached, or text them to <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
          </div>

          <div class="section">
            <h3>What Happens Next</h3>
            <ol>
              <li><strong>Verification (1-3 business days):</strong> We verify your shop license and supervisor credentials.</li>
              <li><strong>Video Site Visit:</strong> A short Zoom call to see your shop (~15 minutes).</li>
              <li><strong>MOU Signing:</strong> We send the official Memorandum of Understanding for signature.</li>
              <li><strong>Approval (~1 week):</strong> Your shop becomes an approved worksite.</li>
              <li><strong>Apprentice Matching:</strong> We work with you to match qualified apprentice candidates.</li>
            </ol>
            <p>In the meantime, you can review the MOU template here:<br>
            <a href="${PLATFORM_DEFAULTS.siteUrl}/docs/Indiana-Barbershop-Apprenticeship-MOU" style="color:#f97316">View MOU Template</a></p>
          </div>

          <div class="section" style="text-align:center;background:#fff7ed">
            <h3>Schedule Your Site Visit</h3>
            <p>Ready to move forward? Book your 15-minute Zoom site visit now. We will walk through your shop and answer any questions.</p>
            <p><a href="https://calendly.com/elevate4humanityedu" class="cta-btn" style="background:#f97316;color:white">Schedule Site Visit</a></p>
          </div>

          <p>We look forward to having <strong>${shopDisplayName}</strong> as part of the team. If you have any questions, just reply to this email or call us at <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>

          <p>Welcome aboard,<br>
          <strong>Elizabeth Greene</strong><br>
          Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}<br>
          Career &amp; Technical Institute<br>
          8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
        </div>
        <div class="footer">
          <p>Elevate for Humanity Career &amp; Technical Institute<br>
          <a href={PLATFORM_DEFAULTS.siteUrl}>${PLATFORM_DEFAULTS.canonicalDomain}</a> | ${PLATFORM_DEFAULTS.supportPhone}</p>
        </div>
      </div></body></html>
    `;

    // Send to applicant
    await sendEmail({
      to: body.contactEmail,
      subject: `Welcome to the Barbershop Partner Program — ${shopDisplayName}`,
      html: partnerWelcomeHtml,
    }).catch((err) => logger.error('Failed to send partner welcome email', err));

    // Send copy to admin
    await sendEmail({
      to: process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com',
      subject: `[Copy] Welcome to the Barbershop Partner Program — ${shopDisplayName}`,
      html: partnerWelcomeHtml,
    }).catch((err) => logger.error('Failed to send admin copy of partner welcome email', err));

    // Create or update the partner login profile so the host shop can access
    // onboarding/forms after submission instead of only appearing in admin.
    try {
      const normalizedEmail = body.contactEmail.toLowerCase().trim();
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (user: { email?: string }) => user.email?.toLowerCase() === normalizedEmail,
      );
      const invited = existingUser
        ? null
        : await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
            redirectTo: `${PLATFORM_DEFAULTS.siteUrl}/partners/barber-host-shop/forms`,
            data: {
              full_name: body.contactName,
              role: 'partner',
              partner_type: 'barber_host_shop',
              partner_application_id: data.id,
            },
          });
      const userId = existingUser?.id || invited?.data?.user?.id;
      if (userId) {
        const [firstName = body.contactName, ...lastNameParts] = body.contactName.split(' ');
        await supabase.from('profiles').upsert(
          {
            id: userId,
            email: normalizedEmail,
            first_name: firstName,
            last_name: lastNameParts.join(' ') || null,
            full_name: body.contactName,
            role: 'partner',
          },
          { onConflict: 'id' },
        );

        const provisioned = await provisionPartnerFromBarberApplication(supabase, data, {
          linkUserId: userId,
        });

        if (provisioned?.partnerId) {
          const initialDocs = [
            shopLicenseDocumentPath
              ? {
                  partner_id: provisioned.partnerId,
                  document_type: 'barbershop_license',
                  program_id: 'barber',
                  file_name: body.shopLicenseFileName,
                  file_url: shopLicenseDocumentPath,
                  file_type: body.shopLicenseFileData?.split(';')[0]?.replace('data:', '') || 'application/octet-stream',
                  status: 'pending',
                }
              : null,
            insuranceCoiFilePath
              ? {
                  partner_id: provisioned.partnerId,
                  document_type: 'liability_insurance',
                  program_id: 'barber',
                  file_name: body.insuranceFileName || 'insurance-coi.pdf',
                  file_url: insuranceCoiFilePath,
                  file_type: body.insuranceFileData?.split(';')[0]?.replace('data:', '') || 'application/octet-stream',
                  status: 'pending',
                }
              : null,
            einDocumentPath
              ? {
                  partner_id: provisioned.partnerId,
                  document_type: 'ein_letter',
                  program_id: 'barber',
                  file_name: body.einFileName || 'ein-letter.pdf',
                  file_url: einDocumentPath,
                  file_type: body.einFileData?.split(';')[0]?.replace('data:', '') || 'application/octet-stream',
                  status: 'pending',
                }
              : null,
          ].filter(Boolean);

          if (initialDocs.length) {
            const documentTypes = initialDocs.map((doc: any) => doc.document_type);
            await supabase
              .from('partner_documents')
              .delete()
              .eq('partner_id', provisioned.partnerId)
              .in('document_type', documentTypes)
              .then(undefined, () => undefined);
            await supabase.from('partner_documents').insert(initialDocs).then(undefined, () => undefined);
          }
        }
      }
    } catch (accountErr) {
      logger.error('Failed to create/update barbershop partner account', accountErr as Error);
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: data.id,
      approvalHeld: approvalHoldReasons.length > 0,
      approvalHoldReasons,
    });
  } catch (error) {
    logger.error('Barbershop partner application error', error as Error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/partners/barber-host-shop/apply', _POST);
