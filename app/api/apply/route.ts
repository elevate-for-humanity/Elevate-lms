// PUBLIC ROUTE: compatibility wrapper for legacy apply submissions
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const WORKFORCE_FUNDING_KEYS = [
  'wioa',
  'workone',
  'workforce ready',
  'workforce_ready',
  'fssa',
  'employindy',
  'employ_indy',
  'impact',
  'dwd',
];

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

function isWorkforceFunded(funding?: string | null): boolean {
  const value = (funding || '').toLowerCase();
  return WORKFORCE_FUNDING_KEYS.some((k) => value.includes(k));
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
}> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await req.json();
    const name = (data.name || `${data.first_name || ''} ${data.last_name || ''}`).trim();
    return {
      contentType,
      name,
      email: String(data.email || '').trim(),
      phone: String(data.phone || '').trim(),
      program: String(data.program || data.program_interest || data.programSlug || 'general').trim(),
      funding: data.funding || data.funding_type || data.fundingType || undefined,
      source: data.source || undefined,
      pathwaySlug: data.pathway_slug || data.program_slug || undefined,
    };
  }

  const formData = await req.formData();
  const first = String(formData.get('first_name') || '').trim();
  const last = String(formData.get('last_name') || '').trim();
  const derivedName = `${first} ${last}`.trim();
  const name = String(formData.get('name') || derivedName).trim();

  return {
    contentType,
    name,
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    program: String(
      formData.get('program') ||
        formData.get('program_interest') ||
        formData.get('program_slug') ||
        'general',
    ).trim(),
    funding: String(formData.get('funding') || formData.get('funding_type') || '').trim() || undefined,
    source: String(formData.get('source') || '').trim() || undefined,
    pathwaySlug: String(formData.get('pathway_slug') || '').trim() || undefined,
  };
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const parsed = await parseLegacyRequest(req);
    const { name, email, phone, program, funding, source, pathwaySlug, contentType } = parsed;

    if (!name || !email || !phone || !program) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, program' },
        { status: 400 },
      );
    }

    const { firstName, lastName } = splitName(name);

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      program,
      fundingType: funding || null,
      source: source || 'website',
      programSlug: pathwaySlug || undefined,
    };

    const applicationsUrl = new URL('/api/applications', req.url);
    const upstream = await fetch(applicationsUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const upstreamJson = await upstream.json().catch(() => ({}));

    if (contentType.includes('application/json')) {
      return NextResponse.json(upstreamJson, { status: upstream.status });
    }

    if (!upstream.ok) {
      return NextResponse.redirect(new URL('/apply?error=submission-failed', req.url), { status: 303 });
    }

    if (isWorkforceFunded(funding)) {
      const dest = new URL('/apply/pending-workone', req.url);
      if (funding) dest.searchParams.set('funding', funding);
      if (program) dest.searchParams.set('program', program);
      return NextResponse.redirect(dest, { status: 303 });
    }

    const dest = new URL('/apply/success', req.url);
    if (funding) dest.searchParams.set('funding', funding);
    if (program) dest.searchParams.set('program', program);
    return NextResponse.redirect(dest, { status: 303 });
  } catch (error) {
    logger.error('Apply compatibility route error: ' + (error instanceof Error ? error.message : String(error)));
    return NextResponse.json(
      { error: 'Submission failed. Please call 317-314-3757.' },
      { status: 500 },
    );
  }
}
