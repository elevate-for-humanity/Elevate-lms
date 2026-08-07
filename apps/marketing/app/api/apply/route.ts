// PUBLIC ROUTE: compatibility wrapper for legacy apply submissions
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { POST as submitApplication } from '../applications/route';
import {
  WORKONE_INDY_INTAKE_URL,
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
} from '@/lib/programs/funding-registry';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
}

async function parseLegacyRequest(req: Request): Promise<{
  contentType: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  funding?: string;
  source?: string;
  pathwaySlug?: string;
  workOneAppointmentConfirmed?: boolean;
}> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await req.json();
    const name = (data.name || `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`).trim();
    return {
      contentType,
      name,
      email: String(data.email || '').trim(),
      phone: String(data.phone || '').trim(),
      program: String(data.program || data.programInterest || data.program_interest || data.programSlug || data.program_slug || '').trim(),
      funding: data.funding || data.fundingInterest || data.fundingSource || data.funding_type || data.fundingType || undefined,
      source: data.source || undefined,
      pathwaySlug: data.pathway_slug || data.program_slug || data.programSlug || data.programInterest || undefined,
      workOneAppointmentConfirmed: data.workOneAppointmentConfirmed === true,
    };
  }

  const formData = await req.formData();
  const first = String(formData.get('first_name') || '').trim();
  const last = String(formData.get('last_name') || '').trim();
  const name = String(formData.get('name') || `${first} ${last}`.trim()).trim();

  return {
    contentType,
    name,
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    program: String(formData.get('program') || formData.get('program_interest') || formData.get('program_slug') || '').trim(),
    funding: String(formData.get('funding') || formData.get('funding_type') || '').trim() || undefined,
    source: String(formData.get('source') || '').trim() || undefined,
    pathwaySlug: String(formData.get('pathway_slug') || '').trim() || undefined,
    workOneAppointmentConfirmed: String(formData.get('workOneAppointmentConfirmed') || '').toLowerCase() === 'true' || formData.get('workOneAppointmentConfirmed') === 'on',
  };
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const parsed = await parseLegacyRequest(req);
    const { name, email, phone, program, funding, source, pathwaySlug, contentType, workOneAppointmentConfirmed } = parsed;

    if (!name || !email || !phone || !program) {
      return NextResponse.json({ error: 'Missing required fields: name, email, phone, program' }, { status: 400 });
    }

    const programSlug = pathwaySlug || program;
    const workforceFunded = isStrictWorkforceFundedProgram(programSlug);
    const fundingRecord = getVerifiedProgramFunding(programSlug);
    const requestedFunding = (funding || '').toLowerCase();

    if (workforceFunded && !workOneAppointmentConfirmed) {
      return NextResponse.json(
        {
          error: 'WorkOne intake appointment is required before submitting this funded-program application.',
          code: 'WORKONE_APPOINTMENT_REQUIRED',
          workOneAppointmentUrl: WORKONE_INDY_INTAKE_URL,
        },
        { status: 400 },
      );
    }

    if (!workforceFunded && (requestedFunding === 'wioa' || requestedFunding === 'wrg' || requestedFunding.includes('workone'))) {
      return NextResponse.json(
        {
          error: 'This program is not in Elevate’s verified WIOA/Workforce Ready Grant track. Select self-pay, employer-sponsored, or another available option.',
          code: 'PROGRAM_NOT_WORKFORCE_FUNDED',
        },
        { status: 400 },
      );
    }

    if (workforceFunded && requestedFunding === 'wrg' && !fundingRecord?.wrgEligible) {
      return NextResponse.json({ error: 'Workforce Ready Grant is not verified for this program. Select WIOA or another available funding path.' }, { status: 400 });
    }
    if (workforceFunded && requestedFunding === 'wioa' && !fundingRecord?.wioaEligible) {
      return NextResponse.json({ error: 'WIOA is not verified for this program. Select another available funding path.' }, { status: 400 });
    }

    const { firstName, lastName } = splitName(name);
    const payload = {
      firstName,
      lastName,
      email,
      phone,
      program,
      fundingType: funding || (workforceFunded ? 'workforce_funded_pending_authorization' : 'self_pay'),
      source: source || 'website',
      programSlug,
      fundingTrack: workforceFunded ? 'workforce-funded' : 'self-pay',
      workOneAppointmentConfirmed: workforceFunded ? true : false,
      workOneAppointmentUrl: workforceFunded ? WORKONE_INDY_INTAKE_URL : null,
    };

    const canonicalUrl = new URL('/api/applications', req.url);
    const canonicalHeaders = new Headers({ 'Content-Type': 'application/json' });
    const origin = req.headers.get('origin');
    if (origin) canonicalHeaders.set('Origin', origin);
    const idempotencyKey = req.headers.get('idempotency-key');
    if (idempotencyKey) canonicalHeaders.set('Idempotency-Key', idempotencyKey);

    const upstream = await submitApplication(
      new Request(canonicalUrl, {
        method: 'POST',
        headers: canonicalHeaders,
        body: JSON.stringify(payload),
      }),
    );

    const upstreamJson = await upstream.json().catch(() => ({}));

    if (contentType.includes('application/json')) {
      return NextResponse.json({ ok: upstream.ok, fundingTrack: workforceFunded ? 'workforce-funded' : 'self-pay', ...upstreamJson }, { status: upstream.status });
    }

    if (!upstream.ok) return NextResponse.redirect(new URL('/apply?error=submission-failed', req.url), { status: 303 });

    const dest = new URL(workforceFunded ? '/apply/pending-workone' : '/apply/success', req.url);
    if (funding) dest.searchParams.set('funding', funding);
    if (program) dest.searchParams.set('program', program);
    if (upstreamJson?.duplicateWarning) dest.searchParams.set('warning', upstreamJson.duplicateWarning);
    return NextResponse.redirect(dest, { status: 303 });
  } catch (error) {
    logger.error('Apply compatibility route error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Submission failed. Please call 317-314-3757.' }, { status: 500 });
  }
}
