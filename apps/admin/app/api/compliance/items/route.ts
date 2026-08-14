import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();

    const { data: items, error } = await db
      .from('compliance_items')
      .select('*, compliance_evidence(*)')
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      logger.error('[admin/api/compliance/items] query failed', error);
      return safeInternalError();
    }

    return NextResponse.json({ items: items ?? [] });
  } catch (err) {
    logger.error('[admin/api/compliance/items] error', err);
    return safeInternalError();
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

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const { error } = await db
      .from('compliance_items')
      .update({ status, last_reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('[admin/api/compliance/items PATCH] update failed', error);
      return safeInternalError();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[admin/api/compliance/items PATCH] error', err);
    return safeInternalError();
  }
}
