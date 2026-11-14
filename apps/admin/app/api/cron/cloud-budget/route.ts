import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/server/cron-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { refreshCloudBudget } from '@/lib/gcp/cloud-budget';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await refreshCloudBudget(await requireAdminClient());
    return NextResponse.json({ checked: true });
  } catch (error) {
    // Emit only our error code, never provider payloads or identity tokens.
    const code = error instanceof Error && /^CLOUD_BUDGET_[A-Z_0-9]+$/.test(error.message) ? error.message : 'CLOUD_BUDGET_UNAVAILABLE';
    return NextResponse.json({ error: code }, { status: 503 });
  }
}
