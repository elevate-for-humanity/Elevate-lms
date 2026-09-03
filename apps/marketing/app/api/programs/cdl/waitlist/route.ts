// PUBLIC ROUTE: legacy CDL waitlist — enrollment open; redirect to standard application.

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APPLY_PATH = '/apply?program=cdl-training';

function redirectToApply(request: NextRequest, status = 307) {
  return NextResponse.redirect(new URL(APPLY_PATH, request.url), status);
}

/** Browser / link visits */
export async function GET(request: NextRequest) {
  return redirectToApply(request, 307);
}

/** Legacy waitlist form POST — send users to the regular application flow */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  return redirectToApply(request, 303);
}
