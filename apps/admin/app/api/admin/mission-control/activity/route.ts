import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await createAdminClient();

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
    return NextResponse.json(safeError(auditRes.error), { status: 500 });
  }

  return NextResponse.json({
    auditLogs: auditRes.data ?? [],
    snapshots: snapshotRes.data ?? [],
  });
}
