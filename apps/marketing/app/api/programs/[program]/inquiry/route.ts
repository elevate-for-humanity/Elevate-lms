// PUBLIC ROUTE: program inquiry compatibility adapter.
// Information requests belong to CRM leads, not the admissions applications table.
import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;
  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    message?: string;
    fundingQuestion?: string;
    fundingSource?: string;
    source?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const email = String(body.email || '').trim();
  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: 'First name, last name, and email are required' },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const target = new URL('/api/inquiries', siteUrl);
  const upstream = await fetch(target, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: target.origin,
    },
    cache: 'no-store',
    body: JSON.stringify({
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone: body.phone || null,
      program,
      message: body.message || '',
      fundingQuestion: body.fundingQuestion || '',
      fundingSource: body.fundingSource || null,
      source: body.source || 'program-request-info',
    }),
  });

  const result = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(
    {
      ...result,
      success: Boolean(result.ok),
      recordType: 'lead',
    },
    { status: upstream.status },
  );
}
