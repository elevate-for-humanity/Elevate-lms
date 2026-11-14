import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  const [auditRes, snapshotRes] = await Promise.all([
    db
      .from('audit_logs')
      .select('id, action, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10),
    db
      .from('platform_snapshots')
      .select('id, snapshot_type, label, rolled_back, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (auditRes.error) {
    return safeInternalError(auditRes.error, 'Failed to load mission-control audit activity');
  }
  if (snapshotRes.error) {
    return safeInternalError(snapshotRes.error, 'Failed to load mission-control snapshots');
  }

  return NextResponse.json({
    auditLogs: auditRes.data ?? [],
    snapshots: snapshotRes.data ?? [],
  });
}
