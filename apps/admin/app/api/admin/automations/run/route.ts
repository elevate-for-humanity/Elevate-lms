// POST /api/admin/automations/run
// Triggers the automation runner. Called by:
//   - job_queue (scheduled, via job type 'run_automations')
//   - Admin dashboard "Run automations" button
//   - Cron (external scheduler hitting this endpoint with INTERNAL_API_KEY)
//
// Auth: admin/super_admin session OR valid INTERNAL_API_KEY header.

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { runAutomations } from '@/lib/admin/run-automations';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Allow internal callers (cron, job_queue) via shared secret — skip rate limit for them
  const internalKey = request.headers.get('x-internal-key');
  const isInternalCaller = internalKey && internalKey === process.env.INTERNAL_API_KEY;

  if (!isInternalCaller) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;
  }

  try {
    const supabase = await createClient();
    const result = await runAutomations(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return safeInternalError(err, 'Automation run failed');
  }
}
