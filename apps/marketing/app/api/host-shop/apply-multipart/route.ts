import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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

    await Promise.allSettled([
      sendEmail({
        to: email,
        subject: 'Host Site Application Received | Elevate for Humanity',
        html: `<p>Hello ${contactName},</p><p>We received the Host Site application for <strong>${businessName}</strong>.</p><p>Reference: <strong>${data.id}</strong></p><p>Our team will verify licensing, insurance, workers' compensation/exemption documentation, supervisor credentials, worksite capacity, and program fit before approval.</p>`,
      }),
      sendEmail({
        to: process.env.PARTNER_NOTIFICATION_EMAIL || PLATFORM_DEFAULTS.supportEmail,
        subject: `[HOST SITE APPLICATION] ${businessName}`,
        html: `<p>New Host Site application.</p><p><strong>${businessName}</strong><br>${contactName}<br>${email}<br>${phone}</p><p>Programs: ${programs.join(', ')}</p><p>Reference: ${data.id}</p>`,
      }),
    ]);

    return NextResponse.json({ ok: true, applicationId: data.id, referenceNumber: data.id }, { status: 201 });
  } catch (error) {
    if (db) await cleanup(db, uploadedPaths);
    logger.error('[host-shop/apply-multipart] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json({ ok: false, error: 'Unable to submit the Host Site application. Please try again.' }, { status: 500 });
  }
}
