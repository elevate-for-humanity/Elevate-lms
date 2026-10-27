import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { attachComplianceEvidence } from '@/lib/admin/compliance-items';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data: items, error: itemsError } = await db
      .from('compliance_items')
      .select('id,title,category,status,description,last_reviewed_at')
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (itemsError) {
      logger.error('[admin/api/compliance/items] items query failed', itemsError);
      return safeInternalError(itemsError, 'Failed to load compliance items');
    }

    const itemIds = (items ?? []).map((item) => item.id);
    let evidence: { id: string; item_id: string; file_url: string; file_name: string; created_at: string }[] = [];

    if (itemIds.length > 0) {
      const { data, error: evidenceError } = await db
        .from('compliance_evidence')
        .select('id,item_id,file_url,file_name,created_at')
        .in('item_id', itemIds)
        .order('created_at', { ascending: false });
      if (evidenceError) {
        logger.error('[admin/api/compliance/items] evidence query failed', evidenceError);
        return safeInternalError(evidenceError, 'Failed to load compliance evidence');
      }
      evidence = data ?? [];
    }

    return NextResponse.json({ items: attachComplianceEvidence(items ?? [], evidence) });
  } catch (err) {
    logger.error('[admin/api/compliance/items] error', err);
    return safeInternalError(err, 'Failed to load compliance items');
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { id, status } = await request.json().catch(() => ({}));
    const allowedStatuses = new Set(['compliant', 'non_compliant', 'pending', 'not_applicable']);
    if (!id || typeof status !== 'string' || !allowedStatuses.has(status)) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const { error } = await db
      .from('compliance_items')
      .update({ status, last_reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      logger.error('[admin/api/compliance/items PATCH] update failed', error);
      return safeInternalError(error, 'Failed to update compliance item');
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[admin/api/compliance/items PATCH] error', err);
    return safeInternalError(err, 'Failed to update compliance item');
  }
}
