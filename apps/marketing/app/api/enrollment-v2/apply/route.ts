import { NextRequest, NextResponse } from 'next/server';
import { POST as submitCanonicalApplication } from '../../applications/route';
import { GET as trackCanonicalApplication } from '../../applications/track/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROGRAM_ALIASES: Record<string, string> = {
  'medical-assistant': 'medical-assistant',
  phlebotomy: 'phlebotomy',
  'hvac-technician': 'hvac-technician',
  barber: 'barber-apprenticeship',
  'barber-apprenticeship': 'barber-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  'cosmetology-apprenticeship': 'cosmetology-apprenticeship',
  esthetician: 'esthetician-apprenticeship',
  'esthetician-apprenticeship': 'esthetician-apprenticeship',
  nail: 'nail-technician-apprenticeship',
  'nail-technician': 'nail-technician-apprenticeship',
  'nail-technician-apprenticeship': 'nail-technician-apprenticeship',
  cna: 'cna',
  qma: 'qma',
};

const FUNDING_ALIASES: Record<string, string> = {
  self: 'self_pay',
  self_pay: 'self_pay',
  wioa: 'wioa',
  next_level_jobs: 'wrg',
  wrg: 'wrg',
  snap: 'snap',
  employer: 'employer',
  other: 'unsure',
};

function normalizedProgram(value: unknown): string {
  const key = String(value ?? '').trim().toLowerCase();
  return PROGRAM_ALIASES[key] ?? key;
}

function legacySuccessResponse(data: Record<string, unknown>, program: string) {
  const referenceNumber = String(data.referenceNumber ?? '');
  const applicationId = String(data.id ?? '');
  const confirmationParams = new URLSearchParams();
  if (referenceNumber) confirmationParams.set('ref', referenceNumber);
  if (program) confirmationParams.set('program', program);

  return NextResponse.json({
    success: true,
    applicationId,
    referenceNumber,
    nextStep: referenceNumber ? `/apply/track?id=${encodeURIComponent(referenceNumber)}` : '/apply/track',
    confirmationUrl: `/apply/confirmation?${confirmationParams.toString()}`,
    canonical: true,
  });
}

/**
 * Compatibility POST for historical /api/enrollment-v2/apply callers.
 *
 * No application is written here. The payload is normalized and forwarded to
 * the canonical /api/applications handler so validation, rate limiting,
 * idempotency, program-state checks, account provisioning, notifications,
 * auditing, and job-queue behavior cannot drift into a second implementation.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, any> | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid application payload.' }, { status: 400 });
  }
  if (!body.consentAcknowledged) {
    return NextResponse.json({ error: 'Consent acknowledgment is required.' }, { status: 400 });
  }

  const program = normalizedProgram(body.programSlug || body.program || body.programName);
  if (!program) {
    return NextResponse.json({ error: 'Program is required.' }, { status: 400 });
  }

  // The retired v2 funnel mixed standalone testing products into student
  // training enrollment. Keep those callers out of the training application.
  if (program === 'act-workkeys' || program === 'epa-608') {
    return NextResponse.json(
      { error: 'Testing registrations are handled through the Testing Center.', redirect: '/testing' },
      { status: 410 },
    );
  }

  const fundingRaw = String(body.fundingSource ?? body.fundingType ?? '').trim().toLowerCase();
  const fundingType = (FUNDING_ALIASES[fundingRaw] ?? fundingRaw) || null;
  const mapped = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    dateOfBirth: body.dateOfBirth,
    address: body.addressLine1 || body.address,
    city: body.addressCity || body.city,
    state: body.addressState || body.state,
    zip: body.addressZip || body.zip,
    program,
    programSlug: program,
    fundingSource: fundingType,
    fundingType,
    preferredStartDate: body.preferredStartDate,
    highestEducation: body.educationLevel || body.highestEducation,
    employmentStatus: body.employmentStatus,
    goals: body.goals,
    howDidYouHear: body.howHeard || body.howDidYouHear,
    emergencyContactName: body.emergencyContactName,
    emergencyContactRelationship: body.emergencyContactRelationship,
    emergencyContactPhone: body.emergencyContactPhone,
    source: 'legacy-enrollment-v2-adapter',
  };

  const headers = new Headers(req.headers);
  headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');

  const canonicalRequest = new Request(new URL('/api/applications', req.url), {
    method: 'POST',
    headers,
    body: JSON.stringify(mapped),
  });

  const response = await submitCanonicalApplication(canonicalRequest);
  const data = (await response.clone().json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || !data.ok) return response;

  return legacySuccessResponse(data, program);
}

/**
 * Compatibility GET for historical v2 status lookups.
 * It delegates to /api/applications/track, then reshapes the response for old
 * clients. No legacy status-column query remains here.
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref');
  const email = req.nextUrl.searchParams.get('email');
  if (!ref && !email) {
    return NextResponse.json({ error: 'ref or email parameter required' }, { status: 400 });
  }

  const trackUrl = new URL('/api/applications/track', req.url);
  if (ref) trackUrl.searchParams.set('id', ref);
  if (!ref && email) trackUrl.searchParams.set('email', email);

  const tracked = await trackCanonicalApplication(new NextRequest(trackUrl, { headers: req.headers }));
  const payload = (await tracked.clone().json().catch(() => ({}))) as Record<string, any>;
  if (!tracked.ok) return tracked;

  const app = payload.application ?? payload;
  return NextResponse.json({
    data: {
      id: app.id,
      reference_number: app.reference_number,
      first_name: app.first_name,
      last_name: app.last_name,
      email: app.email,
      phone: app.phone,
      program_slug: app.program_interest,
      program_name: app.program_interest,
      application_status: app.status,
      submitted_at: app.submitted_at || app.created_at,
      created_at: app.created_at,
      updated_at: app.updated_at,
    },
    canonical: true,
  });
}
