import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  let admin;
  try {
    admin = await apiRequireAdmin(req);
  } catch (err) {
    return err as NextResponse;
  }

  const { id } = await params;
  if (!id) return safeError('Missing log ID', 400);

  const db = await getAdminClient();

  // Confirm the record exists and is not already approved
  const { data: existing, error: fetchError } = await db
    .from('ojt_hours_log')
    .select('id, approved')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return safeInternalError(fetchError, 'Failed to fetch OJT hours log');
  if (!existing) return safeError('OJT hours log not found', 404);
  if (existing.approved) return safeError('Hours already approved', 409);

  const { error: updateError } = await db
    .from('ojt_hours_log')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: admin.id,
    })
    .eq('id', id);

  if (updateError) return safeInternalError(updateError, 'Failed to approve OJT hours');

  logger.info('[admin/apprenticeships/hours/approve]', { logId: id, approvedBy: admin.id });

  return NextResponse.json({ success: true });
}
