// Thin alias for /api/applications — used by program-specific apply pages
// (e.g. /programs/cosmetology-apprenticeship/apply) that POST here directly.
// Forwards the body unchanged; /api/applications handles dedup, email, and auto-approve.

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Forward to canonical applications endpoint
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const res = await fetch(`${siteUrl}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: 'Unexpected response from applications service' }));
  return NextResponse.json(data, { status: res.status });
}
