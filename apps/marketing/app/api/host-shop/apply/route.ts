import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { uploadApplicationDocument } from '@/lib/partners/upload-application-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BUSINESS_TYPE_MAP: Record<string, string> = {
  barbershop: 'barbershop',
  salon: 'salon',
  esthetics_spa: 'esthetics_studio',
  nail_salon: 'nail_studio',
  mobile: 'other',
  other: 'other',
};

function clean(value: unknown, max = 500): string {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeEmail(value: unknown): string {
  return clean(value, 254).toLowerCase();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function saveDocument(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  prefix: string,
  email: string,
  fileData: unknown,
  fileName: unknown,
): Promise<string | null> {
  if (!admin || !fileData || !fileName) return null;
  return uploadApplicationDocument(
    admin,
    prefix,
    email,
    String(fileData),
    String(fileName),
  );
}

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const body = await request.json();
    const businessName = clean(body.businessName || body.dbaName || body.legalBusinessName, 255);
    const legalBusinessName = clean(body.legalBusinessName || body.businessName, 255);
    const dbaName = clean(body.dbaName, 255);
    const ownerName = clean(body.ownerName, 255);
    const contactName = clean(body.contactName, 255);
    const email = normalizeEmail(body.email);
    const phone = clean(body.phone, 50);
    const address1 = clean(body.address1, 255);
    const address2 = clean(body.address2, 255);
    const city = clean(body.city, 120);
    const state = clean(body.state || 'Indiana', 80);
    const zip = clean(body.zip, 20);
    const licenseNumber = clean(body.licenseNumber, 100);
    const supervisorName = clean(body.supervisorName, 255);
    const supervisorLicenseNumber = clean(body.supervisorLicenseNumber, 100);
    const supervisorYearsLicensed = clean(body.supervisorYearsLicensed, 20);
    const workersCompStatus = clean(body.workersCompStatus, 60);
    const compensationModel = clean(body.compensationModel, 100);
    const numberOfEmployees = clean(body.numberOfEmployees, 20);
    const canSuperviseAndVerify = clean(body.canSuperviseAndVerify, 20);
    const documentReadiness = clean(body.documentReadiness, 100);
    const documentSupportNeeded = clean(body.documentSupportNeeded, 500);
    const hasInsurance = clean(body.hasInsurance, 40);
    const signerName = clean(body.signerName, 255);
    const signerTitle = clean(body.signerTitle, 255);
    const programs = Array.isArray(body.programs)
      ? body.programs.map((p: unknown) => clean(p, 80)).filter(Boolean).slice(0, 10)
      : [];

    if (
      !businessName ||
      !legalBusinessName ||
      !ownerName ||
      !contactName ||
      !email ||
      !phone ||
      !address1 ||
      !city ||
      !zip ||
      programs.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Legal business name, owner, contact information, full business address, and at least one program are required.',
        },
        { status: 400 },
      );
    }
    if (!validEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!licenseNumber || !supervisorName || !supervisorLicenseNumber || !supervisorYearsLicensed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Business license number, supervising professional name, supervisor license number, and years licensed are required for host-shop review.',
        },
        { status: 400 },
      );
    }
    if (canSuperviseAndVerify !== 'yes') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'A licensed supervisor who can supervise the apprentice and verify OJL hours and competencies is required.',
        },
        { status: 400 },
      );
    }
    if (hasInsurance !== 'yes') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Current commercial/general liability insurance is required for Host Shop approval.',
        },
        { status: 400 },
      );
    }
    if (!workersCompStatus || workersCompStatus === 'none') {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Workers' compensation coverage or a valid Indiana exemption is required before a shop can be approved.",
        },
        { status: 400 },
      );
    }
    if (!compensationModel) {
      return NextResponse.json(
        { ok: false, error: 'Select the apprentice compensation/employment model.' },
        { status: 400 },
      );
    }
    if (!body.shopLicenseFileData || !body.shopLicenseFileName) {
      return NextResponse.json(
        { ok: false, error: 'Upload a copy of the current shop/business license.' },
        { status: 400 },
      );
    }
    if (!body.insuranceFileData || !body.insuranceFileName) {
      return NextResponse.json(
        { ok: false, error: 'Upload the current commercial/general liability insurance COI.' },
        { status: 400 },
      );
    }
    if (!body.supervisorLicenseFileData || !body.supervisorLicenseFileName) {
      return NextResponse.json(
        { ok: false, error: "Upload the supervising professional's current license." },
        { status: 400 },
      );
    }
    if (!body.workersCompFileData || !body.workersCompFileName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Upload the workers' compensation certificate or the valid exemption documentation.",
        },
        { status: 400 },
      );
    }
    if (!body.einFileData || !body.einFileName) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Upload EIN verification (IRS CP 575/147C) or an acceptable W-9 business record.',
        },
        { status: 400 },
      );
    }
    if (!signerName || body.signatureAcknowledged !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: 'An authorized representative must provide a typed signature and certification.',
        },
        { status: 400 },
      );
    }
    if (body.mouAcknowledged !== true || body.consentAcknowledged !== true) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Host Shop program responsibilities and information-release/verification consent must be acknowledged.',
        },
        { status: 400 },
      );
    }

    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json(
        {
          ok: false,
          error: `Applications are temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone}.`,
        },
        { status: 503 },
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from('host_shop_applications')
      .select('id')
      .eq('contact_email', email)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();

    if (recent) {
      return NextResponse.json(
        {
          ok: false,
          error: 'A host shop application from this email was already received in the last 24 hours.',
        },
        { status: 409 },
      );
    }

    const licensePath = await saveDocument(
      admin,
      'host-shop-license-documents',
      email,
      body.shopLicenseFileData,
      body.shopLicenseFileName,
    );
    const insurancePath = await saveDocument(
      admin,
      'host-shop-insurance-coi-documents',
      email,
      body.insuranceFileData,
      body.insuranceFileName,
    );
    const supervisorLicensePath = await saveDocument(
      admin,
      'host-shop-supervisor-license-documents',
      email,
      body.supervisorLicenseFileData,
      body.supervisorLicenseFileName,
    );
    const workersCompPath = await saveDocument(
      admin,
      'host-shop-workers-comp-documents',
      email,
      body.workersCompFileData,
      body.workersCompFileName,
    );
    const einPath = await saveDocument(
      admin,
      'host-shop-ein-documents',
      email,
      body.einFileData,
      body.einFileName,
    );
    const localBusinessPath = body.localBusinessFileData
      ? await saveDocument(
          admin,
          'host-shop-local-business-documents',
          email,
          body.localBusinessFileData,
          body.localBusinessFileName,
        )
      : null;

    if (!licensePath || !insurancePath || !supervisorLicensePath || !workersCompPath || !einPath) {
      return NextResponse.json(
        {
          ok: false,
          error: 'One or more required compliance documents could not be uploaded. Please try again.',
        },
        { status: 500 },
      );
    }

    const businessType = BUSINESS_TYPE_MAP[clean(body.industryType, 50)] || 'other';
    const notes = [
      `Programs requested: ${programs.join(', ')}`,
      `Legal business name: ${legalBusinessName}`,
      dbaName ? `DBA: ${dbaName}` : '',
      `Owner: ${ownerName}`,
      `Full address: ${[address1, address2, city, state, zip].filter(Boolean).join(', ')}`,
      body.yearsInBusiness ? `Years in business: ${clean(body.yearsInBusiness, 20)}` : '',
      body.numberOfChairs ? `Number of chairs/workstations: ${clean(body.numberOfChairs, 20)}` : '',
      numberOfEmployees ? `Number of employees: ${numberOfEmployees}` : '',
      'Liability insurance status: yes',
      `Workers comp status: ${workersCompStatus}`,
      `Apprentice compensation model: ${compensationModel}`,
      `Supervisor: ${supervisorName}`,
      `Supervisor license: ${supervisorLicenseNumber}`,
      `Supervisor years licensed: ${supervisorYearsLicensed}`,
      'Can supervise and verify OJL/competencies: yes',
      documentReadiness ? `Document readiness: ${documentReadiness}` : '',
      documentSupportNeeded ? `Document support needed: ${documentSupportNeeded}` : '',
      `Shop license document: ${licensePath}`,
      `Insurance COI document: ${insurancePath}`,
      `Supervisor license document: ${supervisorLicensePath}`,
      `Workers comp/exemption document: ${workersCompPath}`,
      `EIN/W-9 verification document: ${einPath}`,
      localBusinessPath ? `Local business/occupancy document: ${localBusinessPath}` : '',
      body.howHeard ? `How heard: ${clean(body.howHeard, 80)}` : '',
      body.message ? `Applicant notes: ${clean(body.message, 2000)}` : '',
      `Authorized signer: ${signerName}${signerTitle ? `, ${signerTitle}` : ''}`,
      `Certification signed at: ${new Date().toISOString()}`,
      'Host Shop responsibilities acknowledged: yes',
      'Verification / information release consent acknowledged: yes',
      'Signature certification acknowledged: yes',
    ]
      .filter(Boolean)
      .join('\n');

    const { data, error } = await admin
      .from('host_shop_applications')
      .insert({
        status: 'pending_review',
        fee_status: 'pending',
        fee_amount_cents: 0,
        business_name: businessName,
        business_type: businessType,
        license_number: licenseNumber,
        address: [address1, address2, city, state, zip].filter(Boolean).join(', '),
        contact_name: contactName,
        contact_email: email,
        contact_phone: phone,
        partner_tier: 'free',
        internal_notes: notes,
      })
      .select('id')
      .maybeSingle();

    if (error || !data?.id) {
      logger.error('[host-shop/apply] insert failed', error ?? undefined, { email, businessName });
      return NextResponse.json(
        {
          ok: false,
          error: `We could not save the application. Please call ${PLATFORM_DEFAULTS.supportPhone}.`,
        },
        { status: 500 },
      );
    }

    const applicantEmail = sendEmail({
      to: email,
      subject: 'Host Shop Application Received | Elevate for Humanity',
      html: `<p>Hello ${contactName},</p><p>We received the host shop application for <strong>${businessName}</strong>.</p><p>Reference: <strong>${data.id}</strong></p><p>Our team will verify the business license, supervisor credentials, liability insurance, workers' compensation/exemption documentation, business identity documentation, worksite capacity, and program fit before approval.</p>`,
    });
    const adminEmail = sendEmail({
      to: process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com',
      subject: `[HOST SHOP APPLICATION] ${businessName}`,
      html: `<p>New host shop application.</p><p><strong>${businessName}</strong><br>${contactName}<br>${email}<br>${phone}</p><p>Programs: ${programs.join(', ')}</p><p>Supervisor: ${supervisorName} — ${supervisorLicenseNumber}</p><p>Shop license: ${licensePath}</p><p>Insurance COI: ${insurancePath}</p><p>Workers comp/exemption: ${workersCompPath}</p><p>Supervisor license: ${supervisorLicensePath}</p><p>EIN/W-9 record: ${einPath}</p><p>Reference: ${data.id}</p>`,
    });
    await Promise.allSettled([applicantEmail, adminEmail]);

    return NextResponse.json({ ok: true, applicationId: data.id, referenceNumber: data.id }, { status: 201 });
  } catch (error) {
    logger.error('[host-shop/apply] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { ok: false, error: 'Unable to submit the host shop application. Please try again.' },
      { status: 500 },
    );
  }
}
