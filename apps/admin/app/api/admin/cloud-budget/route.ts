import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { readCloudBudget } from '@/lib/gcp/cloud-budget';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  try {
    const state = await readCloudBudget(await requireAdminClient());
    return NextResponse.json({ state, warningAt: 90 }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Cloud spending data is unavailable.' }, { status: 503 });
  }
}
