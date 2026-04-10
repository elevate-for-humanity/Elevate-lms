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
  if (!id) return safeError('Missing module ID', 400);

  const db = await getAdminClient();

  const { data: existing, error: fetchError } = await db
    .from('external_modules')
    .select('id, approval_status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return safeInternalError(fetchError, 'Failed to fetch external module');
  if (!existing) return safeError('External module not found', 404);
  if (existing.approval_status === 'rejected') return safeError('Module already rejected', 409);

  const { error: updateError } = await db
    .from('external_modules')
    .update({
      approval_status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: admin.id,
    })
    .eq('id', id);

  if (updateError) return safeInternalError(updateError, 'Failed to reject external module');

  logger.info('[admin/external-modules/reject]', { moduleId: id, rejectedBy: admin.id });

  return NextResponse.json({ success: true });
}
