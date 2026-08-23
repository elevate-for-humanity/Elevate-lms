export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { reconcileApplicationRemediations } from '@/lib/automation/reconcile-application-remediations';
import { requireAdminClient } from '@/lib/supabase/admin';

function authorized(request: NextRequest): boolean {
  const configured = process.env.AUTOMATION_CRON_SECRET?.trim();
  if (!configured) return false;
  const supplied = request.headers.get('x-automation-secret')?.trim();
  return Boolean(supplied && supplied === configured);
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedLimit = Number(body?.limit || 50);

  try {
    const db = await requireAdminClient();
    const result = await reconcileApplicationRemediations(db, requestedLimit);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeInternalError(error, 'Application remediation reconciliation failed');
  }
}
