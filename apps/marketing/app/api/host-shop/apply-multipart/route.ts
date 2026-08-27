import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { notifyApplicationSubmission } from '@/lib/applications/submission-notifications';
import { provisionHostShopApplication } from '@/lib/partners/provision-host-shop-application';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const REQUIRED_FILES = [
  ['shopLicense', 'host-shop-license-documents'],
  ['insurance', 'host-shop-insurance-coi-documents'],
  ['workersComp', 'host-shop-workers-comp-documents'],
  ['supervisorLicense', 'host-shop-supervisor-license-documents'],
  ['ein', 'host-shop-ein-documents'],
] as const;

const BUSINESS_TYPE_MAP: Record<string, string> = {
  barbershop: 'barbershop',
  salon: 'salon',
  esthetics_spa: 'esthetics_studio',
  nail_salon: 'nail_studio',
  mobile: 'other',
  other: 'other',
};

function text(form: FormData, key: string, max = 500): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function emailValue(form: FormData): string {
  return text(form, 'email', 254).toLowerCase();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAcknowledged(form: FormData, key: string): boolean {
  const value = text(form, key, 10).toLowerCase();
  return ['true', 'yes', 'on', '1'].includes(value);
}

function validFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.size <= MAX_FILE_BYTES && ALLOWED_MIME.has(value.type);
}

function safeExtension(file: File): string {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function uploadFile(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  file: File,
  prefix: string,
  email: string,
): Promise<string> {
  const storagePath = `${prefix}/${Date.now()}-${crypto.randomUUID()}-${email.replace(/[^a-z0-9]/gi, '_')}.${safeExtension(file)}`;
  const { error } = await db.storage.from('documents').upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Unable to upload ${file.name}: ${error.message}`);
  return storagePath;
}

async function cleanup(db: Awaited<ReturnType<typeof requireAdminClient>>, paths: string[]) {
  if (!paths.length) return;
  await db.storage.from('documents').remove(paths).catch(() => undefined);
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  let db: Awaited<ReturnType<typeof requireAdminClient>> | null = null;
  const uploadedPaths: string[] = [];

  try {
    const form = await request.formData();
    const legalBusinessName = text(form, 'legalBusinessName', 255);
    const dbaName = text(form, 'dbaName', 255);
    const businessName = dbaName || legalBusinessName;
    const ownerName = text(form, 'ownerName', 255);
    const contactName = text(form, 'contactName', 255);
    const email = emailValue(form);
    const phone = text(form, 'phone', 50);
    const address1 = text(form, 'address1', 255);
    const address2 = text(form, 'address2', 255);
    const city = text(form, 'city', 120);
    const state = text(form, 'state', 80) || 'Indiana';
    const zip = text(form, 'zip', 20);
    const industryType = text(form, 'industryType', 50);
    const licenseNumber = text(form, 'licenseNumber', 100);
    const supervisorName = text(form, 'supervisorName', 255);
    const supervisorLicenseNumber = text(form, 'supervisorLicenseNumber', 100);
    const supervisorYearsLicensed = text(form, 'supervisorYearsLicensed', 20);
    const workersCompStatus = text(form, 'workersCompStatus', 60);
    const compensationModel = text(form, 'compensationModel', 100);
    const numberOfEmployees = text(form, 'numberOfEmployees', 20);
    const numberOfChairs = text(form, 'numberOfChairs', 20);
    const signerName = text(form, 'signerName', 255);
    const signerTitle = text(form, 'signerTitle', 255);
    const programs = form
      .getAll('programs')
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 10);

    if (!legalBusinessName || !ownerName || !contactName || !email || !phone || !address1 || !city || !state || !zip || programs.length === 0) {
      return NextResponse.json({ ok: false, error: 'Complete the business identity, contact, address, and select at least one apprenticeship program.' }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!licenseNumber || !supervisorName || !supervisorLicenseNumber || !supervisorYearsLicensed) {
      return NextResponse.json({ ok: false, error: 'Business license and supervising professional license information are required.' }, { status: 400 });
    }
    if (text(form, 'canSuperviseAndVerify', 10) !== 'yes') {
      return NextResponse.json({ ok: false, error: 'A licensed supervisor who can verify OJL hours and competencies is required.' }, { status: 400 });
    }
    if (text(form, 'hasInsurance', 10) !== 'yes') {
      return NextResponse.json({ ok: false, error: 'Current commercial/general liability insurance is required.' }, { status: 400 });
    }
    if (!workersCompStatus || workersCompStatus === 'none') {
      return NextResponse.json({ ok: false, error: "Workers' compensation coverage or a valid exemption is required." }, { status: 400 });
    }
    if (!compensationModel) {
      return NextResponse.json({ ok: false, error: 'Select the apprentice compensation/employment model.' }, { status: 400 });
    }
    if (!signerName || !isAcknowledged(form, 'signatureAcknowledged') || !isAcknowledged(form, 'mouAcknowledged') || !isAcknowledged(form, 'consentAcknowledged')) {
      return NextResponse.json({ ok: false, error: 'Complete all required acknowledgements and authorized signature certification.' }, { status: 400 });
    }

    for (const [field] of REQUIRED_FILES) {
      if (!validFile(form.get(field))) {
        return NextResponse.json({ ok: false, error: `Upload every required compliance document. ${field} must be PDF, JPG, PNG, or WEBP and no larger than 10 MB.` }, { status: 400 });
      }
    }
    const optionalLocalBusiness = form.get('localBusiness');
    if (optionalLocalBusiness instanceof File && optionalLocalBusiness.size > 0 && !validFile(optionalLocalBusiness)) {
      return NextResponse.json({ ok: false, error: 'The optional local business document must be PDF, JPG, PNG, or WEBP and no larger than 10 MB.' }, { status: 400 });
    }

    db = await requireAdminClient();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await db
      .from('host_shop_applications')
      .select('id')
      .eq('contact_email', email)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();
    if (recent) {
      return NextResponse.json({ ok: false, error: 'A Host Site application from this email was already received in the last 24 hours.' }, { status: 409 });
    }

    const uploaded: Record<string, string> = {};
    for (const [field, prefix] of REQUIRED_FILES) {
      const file = form.get(field) as File;
      const path = await uploadFile(db, file, prefix, email);
      uploaded[field] = path;
      uploadedPaths.push(path);
    }
    if (validFile(optionalLocalBusiness)) {
      const path = await uploadFile(db, optionalLocalBusiness, 'host-shop-local-business-documents', email);
      uploaded.localBusiness = path;
      uploadedPaths.push(path);
    }

    const shopLicenseDocument = uploaded.shopLicense;
    const liabilityInsuranceDocument = uploaded.insurance;
    const workersCompDocument = uploaded.workersComp;
    const supervisorLicenseDocument = uploaded.supervisorLicense;
    const einDocument = uploaded.ein;
    if (!shopLicenseDocument || !liabilityInsuranceDocument || !workersCompDocument || !supervisorLicenseDocument || !einDocument) {
      throw new Error('Required host-shop compliance uploads were not persisted.');
    }

    const fullAddress = [address1, address2, city, state, zip].filter(Boolean).join(', ');
    const businessType = BUSINESS_TYPE_MAP[industryType] || 'other';
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('host_shop_applications')
      .insert({
        shop_name: businessName,
        owner_name: ownerName,
        email,
        phone,
        address: fullAddress,
        contact_email: email,
        business_name: legalBusinessName,
        status: 'submitted',
        submitted_at: now,
        license_info: {
          businessType,
          licenseNumber,
          shopLicenseDocument: uploaded.shopLicense,
          liabilityInsuranceDocument: uploaded.insurance,
          workersCompStatus,
          workersCompDocument: uploaded.workersComp,
          supervisor: {
            name: supervisorName,
            licenseNumber: supervisorLicenseNumber,
            yearsLicensed: supervisorYearsLicensed,
            licenseDocument: uploaded.supervisorLicense,
            canSuperviseAndVerify: true,
          },
          einDocument: uploaded.ein,
          localBusinessDocument: uploaded.localBusiness || null,
        },
        intake: {
          legalBusinessName,
          dbaName: dbaName || null,
          contactName,
          programs,
          numberOfEmployees: numberOfEmployees || null,
          numberOfChairs: numberOfChairs || null,
          hasInsurance: true,
          workersCompStatus,
          compensationModel,
          acknowledgements: { mou: true, verificationConsent: true, signatureCertification: true },
          authorizedSigner: { name: signerName, title: signerTitle || null, signedAt: now },
          source: 'universal-host-site-multipart-application',
        },
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      await cleanup(db, uploadedPaths);
      logger.error('[host-shop/apply-multipart] insert failed', error ?? undefined, { email, businessName });
      return NextResponse.json({ ok: false, error: 'We could not save the Host Site application. Please try again.' }, { status: 500 });
    }

    let provisioned: Awaited<ReturnType<typeof provisionHostShopApplication>> | null = null;
    let provisioningError: string | null = null;
    try {
      provisioned = await provisionHostShopApplication({
        db,
        applicationId: data.id,
        businessName,
        legalBusinessName,
        ownerName,
        contactName,
        email,
        phone,
        address1,
        address2: address2 || null,
        city,
        state,
        zip,
        businessType,
        licenseNumber,
        supervisorName,
        supervisorLicenseNumber,
        supervisorYearsLicensed,
        workersCompStatus,
        compensationModel,
        numberOfEmployees: numberOfEmployees || null,
        programs,
        documents: {
          shopLicense: shopLicenseDocument,
          insurance: liabilityInsuranceDocument,
          workersComp: workersCompDocument,
          supervisorLicense: supervisorLicenseDocument,
          ein: einDocument,
          localBusiness: uploaded.localBusiness || null,
        },
      });
    } catch (caught) {
      provisioningError = caught instanceof Error ? caught.message : String(caught);
      logger.error('[host-shop/apply-multipart] conditional portal provisioning failed', caught instanceof Error ? caught : undefined, {
        applicationId: data.id,
        email,
      });
      await db.from('staff_notifications').insert({
        type: 'host_shop_provisioning_failed',
        title: `Host Shop portal provisioning failed: ${businessName}`,
        message: `Application ${data.id} was saved, but conditional portal access could not be provisioned. ${provisioningError}`,
        severity: 'error',
        metadata: { application_id: data.id, email, business_name: businessName, error: provisioningError },
      });
    }

    const safeContact = escapeHtml(contactName);
    const safeBusiness = escapeHtml(businessName);
    const safeEmail = escapeHtml(email);
    const safeReference = escapeHtml(data.id);
    const portalUrl = provisioned?.portalUrl || 'https://app.elevateforhumanity.org/host-shop/login';
    const accessLink = provisioned?.accessLink || portalUrl;
    const requestedPrograms = programs.map(escapeHtml).join(', ');

    const applicantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
        <h2>Host Site Application Received</h2>
        <p>Hello ${safeContact},</p>
        <p>Elevate received the Host Site application for <strong>${safeBusiness}</strong>.</p>
        <p><strong>Reference:</strong> ${safeReference}</p>
        <p><strong>Programs requested:</strong> ${requestedPrograms}</p>
        ${provisioned ? `
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;margin:20px 0">
            <h3 style="margin-top:0">Your Host Shop portal is ready for onboarding</h3>
            <p><strong>Username:</strong> ${safeEmail}</p>
            <p>For security, Elevate does not email a plaintext password. Use the secure button below to access your account or set your password.</p>
            <p><a href="${accessLink}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Secure Host Shop Access</a></p>
            <p>If the secure link expires, use the magic-link option at <a href="${portalUrl}">${portalUrl}</a>.</p>
          </div>` : `
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px;margin:20px 0">
            <strong>Your application is saved.</strong> Elevate staff has also been alerted that portal provisioning needs attention. You do not need to submit the application again.
          </div>`}
        <h3>What happens next</h3>
        <ol>
          <li>Sign in to the Host Shop portal and review your business profile.</li>
          <li>Complete the Host Site onboarding/MOU items shown in the portal.</li>
          <li>Elevate reviews the license, insurance, workers' compensation/exemption, supervisor credential, EIN/W-9 record, and worksite capacity you uploaded.</li>
          <li>Portal access is conditional while compliance review is pending; submission does not mean final Host Site approval.</li>
          <li>After approval and apprentice matching, assigned apprentices appear in your Host Shop board.</li>
          <li>The Host Shop supervises on-the-job learning, verifies hours and competencies, and responds to Elevate compliance requests through the portal.</li>
        </ol>
        <p>If additional documentation is required, Elevate will identify the exact item in the portal or by email.</p>
        <p>Questions? Reply to this email or call ${PLATFORM_DEFAULTS.supportPhone}.</p>
      </div>`;

    const staffHtml = `
      <h2>New Host Site Application</h2>
      <p><strong>${safeBusiness}</strong><br>${safeContact}<br>${safeEmail}<br>${escapeHtml(phone)}</p>
      <p><strong>Reference:</strong> ${safeReference}</p>
      <p><strong>Programs:</strong> ${requestedPrograms}</p>
      <p><strong>Supervisor:</strong> ${escapeHtml(supervisorName)} — ${escapeHtml(supervisorLicenseNumber)}</p>
      <p><strong>Conditional portal provisioning:</strong> ${provisioned ? `completed (Partner ${escapeHtml(provisioned.partnerId)})` : `FAILED — ${escapeHtml(provisioningError || 'unknown error')}`}</p>
      <p>All required application uploads were saved. Review the Host Shop compliance queue before changing the application to approved.</p>`;

    const notifications = await notifyApplicationSubmission({
      db,
      applicationId: data.id,
      applicationType: 'host_shop',
      applicantName: contactName,
      applicantEmail: email,
      applicantSubject: 'Host Site Application Received + Portal Next Steps | Elevate for Humanity',
      applicantHtml,
      staffSubject: `[HOST SITE APPLICATION] ${businessName}`,
      staffHtml,
      metadata: {
        business_name: businessName,
        programs,
        partner_id: provisioned?.partnerId || null,
        portal_provisioned: Boolean(provisioned),
        provisioning_error: provisioningError,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        applicationId: data.id,
        referenceNumber: data.id,
        portalProvisioned: Boolean(provisioned),
        partnerId: provisioned?.partnerId || null,
        notificationStatus: notifications,
      },
      { status: 201 },
    );
  } catch (error) {
    if (db) await cleanup(db, uploadedPaths);
    logger.error('[host-shop/apply-multipart] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json({ ok: false, error: 'Unable to submit the Host Site application. Please try again.' }, { status: 500 });
  }
}
