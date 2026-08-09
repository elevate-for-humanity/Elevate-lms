import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { ensureWorkOneHandoffByReference } from '@/lib/workone/handoff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';

  if (!reference || !reference.startsWith('EFH-')) {
    return NextResponse.json({ error: 'A valid application reference is required.' }, { status: 400 });
  }

  try {
    const result = await ensureWorkOneHandoffByReference(reference);
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'We could not prepare the WorkOne program packet right now. Your application is still saved.',
      },
      { status: 500 },
    );
  }
}

export const POST = withApiAudit('/api/workone/handoff', _POST);
