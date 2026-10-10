import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { loadAdminHours } from '@/lib/apprenticeship/admin-hours';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { entries } = await loadAdminHours(await requireAdminClient());
    return NextResponse.json(
      {
        entries: entries.filter(
          (e) => ['submitted', 'draft'].includes(e.status) && e.hours_worked > 0,
        ),
        incompleteCount: entries.filter(
          (e) => ['submitted', 'draft'].includes(e.status) && e.hours_worked <= 0,
        ).length,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return safeInternalError(
      error,
      'Load apprenticeship hours',
      'Could not load hours. Please refresh to try again.',
    );
  }
}
