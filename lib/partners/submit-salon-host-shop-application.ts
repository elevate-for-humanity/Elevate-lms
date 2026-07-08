import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { uploadApplicationDocument } from '@/lib/partners/upload-application-document';
import { sendEmail } from '@/lib/email/sendgrid';

export type SalonHostShopProgramType = 'cosmetology' | 'esthetician' | 'nail_technician';

export type SalonHostShopApplicationInput = {
  salonLegalName: string;
  salonDbaName?: string;
  ownerName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  salonAddressLine1?: string;
  salonAddressLine2?: string;
  salonCity?: string;
  salonState?: string;
  salonZip?: string;
  indianaSalonLicenseNumber: string;
  supervisorName: string;
  supervisorLicenseNumber: string;
  supervisorYearsLicensed?: string;
  compensationModel?: string;
  numberOfEmployees?: string;
  workersCompStatus?: string;
  hasGeneralLiability?: string;
  canSuperviseAndVerify?: string;
  documentReadiness?: string;
  documentSupportNeeded?: string;
  mouAcknowledged: boolean;
  consentAcknowledged: boolean;
  notes?: string;
  shopLicenseFileData: string;
  shopLicenseFileName: string;
  insuranceFileData?: string;
  insuranceFileName?: string;
};

export type SalonHostShopProgramConfig = {
  programType: SalonHostShopProgramType;
  programTitle: string;
  licenseLabel: string;
  mouSignPath: string;
  emailAccentHex: string;
  adminEmailSubjectTag: string;
};

const CONFIG: Record<SalonHostShopProgramType, SalonHostShopProgramConfig> = {
  cosmetology: {
    programType: 'cosmetology',
    programTitle: 'Indiana Cosmetology Apprenticeship Program',
    licenseLabel: 'Salon',
    mouSignPath: '/partners/cosmetology-host-shop/sign-mou',
    emailAccentHex: '#7c3aed',
    adminEmailSubjectTag: 'Cosmetology Salon',
  },
  esthetician: {
    programType: 'esthetician',
    programTitle: 'Indiana Esthetician Apprenticeship Program',
    licenseLabel: 'Establishment',
    mouSignPath: '/partners/esthetician-apprenticeship/sign-mou',
    emailAccentHex: '#db2777',
    adminEmailSubjectTag: 'Esthetician Host Spa',
  },
  nail_technician: {
    programType: 'nail_technician',
    programTitle: 'Indiana Nail Technician Apprenticeship Program',
    licenseLabel: 'Salon',
    mouSignPath: '/partners/nail-technician-apprenticeship/sign-mou',
    emailAccentHex: '#7c3aed',
    adminEmailSubjectTag: 'Nail Technician Host Salon',
  },
};

export function getSalonHostShopConfig(programType: SalonHostShopProgramType): SalonHostShopProgramConfig {
  return CONFIG[programType];
}

export async function submitSalonHostShopApplication(
  db: SupabaseClient,
  programType: SalonHostShopProgramType,
  input: SalonHostShopApplicationInput,
): Promise<{ partnerId: string }> {
  const cfg = getSalonHostShopConfig(programType);
  const {
    salonLegalName,
    salonDbaName,
    ownerName,
    contactName,
    contactEmail,
    contactPhone,
    salonAddressLine1,
    salonAddressLine2,
    salonCity,
    salonState,
    salonZip,
    indianaSalonLicenseNumber,
    supervisorName,
    supervisorLicenseNumber,
    supervisorYearsLicensed,
    compensationModel,
    numberOfEmployees,
    workersCompStatus,
    hasGeneralLiability,
    canSuperviseAndVerify,
    documentReadiness,
    documentSupportNeeded,
    mouAcknowledged,
    notes,
    shopLicenseFileData,
    shopLicenseFileName,
    insuranceFileData,
    insuranceFileName,
  } = input;

  const emailKey = String(contactEmail).toLowerCase();
  const licensePath = await uploadApplicationDocument(
    db,
    'salon-license-documents',
    emailKey,
    shopLicenseFileData,
    shopLicenseFileName,
  );
  const insurancePath = insuranceFileData
    ? await uploadApplicationDocument(
        db,
        'salon-insurance-coi-documents',
        emailKey,
        insuranceFileData,
        insuranceFileName ?? 'coi.pdf',
      )
    : null;

  const notesWithDocumentStatus = [
    notes,
    licensePath
      ? `${cfg.licenseLabel} license file: ${licensePath}`
      : `${cfg.licenseLabel} license upload failed`,
    insurancePath ? `Insurance COI file: ${insurancePath}` : 'Insurance COI: not uploaded at apply',
    documentReadiness ? `Document readiness: ${documentReadiness}` : null,
    documentSupportNeeded ? `Document support needed: ${documentSupportNeeded}` : null,
  ]
    .filter(Boolean)
    .join('\n');

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
      program_type: cfg.programType,
      status: 'active',
      approval_status: 'approved',
      account_status: 'conditional_access',
      documents_verified: false,
      onboarding_completed: false,
      license_number: indianaSalonLicenseNumber,
      supervisor_name: supervisorName,
      supervisor_license_number: supervisorLicenseNumber,
      supervisor_years_licensed: supervisorYearsLicensed ? parseInt(supervisorYearsLicensed, 10) : null,
      compensation_model: compensationModel,
      number_of_employees: numberOfEmployees ? parseInt(numberOfEmployees, 10) : null,
      workers_comp_status: workersCompStatus,
      has_general_liability: hasGeneralLiability === 'yes',
      can_supervise_and_verify: canSuperviseAndVerify === 'yes',
      mou_acknowledged: mouAcknowledged,
      mou_signed: false,
      programs: [cfg.programType],
      notes: notesWithDocumentStatus || null,
      applied_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (partnerError) {
    if (partnerError.code === '23505') {
      throw Object.assign(new Error('DUPLICATE_EMAIL'), { status: 409 });
    }
    logger.error(`${cfg.adminEmailSubjectTag} application insert error:`, partnerError);
    throw partnerError;
  }

  if (!partner?.id) {
    throw new Error('Partner insert returned no id');
  }

  logger.info(
    `${cfg.adminEmailSubjectTag} application submitted: ${partner.id} — ${salonLegalName}`,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const adminEmail = process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';
  const applicantName = contactName || ownerName || 'Partner';
  const mouLink = `${siteUrl}/login?redirect=${cfg.mouSignPath}`;
  const accent = cfg.emailAccentHex;

  const applicantHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
  <tr><td style="background:${accent};padding:28px 32px;text-align:center">
    <img src="${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" width="120" style="max-width:120px;height:auto;filter:brightness(10)" />
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px">Application Received — ${salonLegalName}</h2>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
      Hi ${applicantName}, thank you for applying to the <strong>${cfg.programTitle}</strong> as a host partner.
      Our team will review your application within 2–3 business days and contact you at <strong>${contactEmail}</strong>.
    </p>
    <div style="background:#f5f3ff;border-radius:6px;padding:16px 20px;margin:0 0 24px">
      <p style="color:${accent};font-size:13px;font-weight:bold;margin:0 0 8px">Your next step:</p>
      <p style="color:#334155;font-size:13px;margin:0 0 12px">Sign the Memorandum of Understanding (MOU) to complete your onboarding.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <a href="${mouLink}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:14px">
            Log In &amp; Sign the MOU →
          </a>
        </td></tr>
      </table>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    const adminHtml = `<h2>New ${cfg.adminEmailSubjectTag} Application</h2>
<table style="border-collapse:collapse;font-size:13px">
  <tr><td style="padding:6px;font-weight:bold">Business</td><td>${salonLegalName}${salonDbaName ? ` (${salonDbaName})` : ''}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Contact</td><td>${contactName} — ${contactEmail} — ${contactPhone}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">License</td><td>${indianaSalonLicenseNumber}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Supervisor</td><td>${supervisorName} — ${supervisorLicenseNumber}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Partner ID</td><td>${partner.id}</td></tr>
</table>
<p><a href="${siteUrl}/admin/program-holders">Review in Admin Dashboard →</a></p>`;

  const emailResults = await Promise.allSettled([
    sendEmail({
      to: contactEmail,
      subject: `Application Received — ${salonLegalName} | Elevate ${cfg.programTitle}`,
      html: applicantHtml,
      replyTo: 'elevate4humanityedu@gmail.com',
    }),
    sendEmail({
      to: adminEmail,
      subject: `[NEW APPLICATION] ${cfg.adminEmailSubjectTag} — ${salonLegalName}`,
      html: adminHtml,
    }),
  ]);
  emailResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error(`${cfg.adminEmailSubjectTag} email ${index === 0 ? 'applicant' : 'admin'} send failed:`, result.reason);
      return;
    }
    if (!result.value.success) {
      logger.warn(`${cfg.adminEmailSubjectTag} email ${index === 0 ? 'applicant' : 'admin'} not sent`, {
        error: result.value.error,
      });
    }
  });

  const mouRedirect = `${siteUrl}${cfg.mouSignPath}`;
  try {
    const normalizedEmail = contactEmail.toLowerCase().trim();
    const { data: existingUsers } = await db.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail,
    );

    const invited = existingUser
      ? null
      : await db.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo: mouRedirect,
          data: {
            full_name: applicantName,
            role: 'partner',
            partner_type: `${cfg.programType}_salon`,
            partner_id: partner.id,
          },
        });

    if (existingUser) {
      await db.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo: mouRedirect },
      });
    }

    const userId = existingUser?.id || invited?.data?.user?.id;
    if (userId) {
      const [firstName = applicantName, ...lastNameParts] = applicantName.split(' ');
      await db.from('profiles').upsert(
        {
          id: userId,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastNameParts.join(' ') || null,
          full_name: applicantName,
          role: 'partner',
        },
        { onConflict: 'id' },
      );

      await db.from('partner_users').upsert(
        {
          partner_id: partner.id,
          user_id: userId,
          role: 'partner_admin',
          status: 'active',
        },
        { onConflict: 'partner_id,user_id' },
      );

      await db.from('partner_program_access').upsert(
        {
          partner_id: partner.id,
          program_id: cfg.programType,
          can_view_apprentices: true,
          can_enter_progress: true,
          can_view_reports: true,
        },
        { onConflict: 'partner_id,program_id' },
      );

      const initialDocs = [
        licensePath
          ? {
              partner_id: partner.id,
              document_type: 'salon_license',
              program_id: cfg.programType,
              file_name: shopLicenseFileName,
              file_url: licensePath,
              file_type: shopLicenseFileData?.split(';')[0]?.replace('data:', '') || 'application/octet-stream',
              status: 'pending',
            }
          : null,
        insurancePath
          ? {
              partner_id: partner.id,
              document_type: 'liability_insurance',
              program_id: cfg.programType,
              file_name: insuranceFileName ?? 'insurance-coi.pdf',
              file_url: insurancePath,
              file_type: insuranceFileData?.split(';')[0]?.replace('data:', '') || 'application/octet-stream',
              status: 'pending',
            }
          : null,
      ].filter(Boolean);

      if (initialDocs.length) {
        const documentTypes = initialDocs.map((doc: any) => doc.document_type);
        await db
          .from('partner_documents')
          .delete()
          .eq('partner_id', partner.id)
          .in('document_type', documentTypes)
          .then(undefined, () => undefined);
        await db.from('partner_documents').insert(initialDocs).then(undefined, () => undefined);
      }
    }
  } catch (authErr) {
    logger.error('Failed to create/invite partner auth account:', authErr);
  }

  return { partnerId: partner.id };
}
