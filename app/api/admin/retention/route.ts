import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { enforceDocumentRetention } from '@/lib/retention/document-retention';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/retention
 *
 * Trigger document retention enforcement.
 *
 * Auth: super_admin required. Cron jobs must also provide CRON_SECRET
 * (defense-in-depth — secret alone is not sufficient).
 *
 * Body (optional):
 *   dryRun: boolean  — preview what would be deleted without deleting (default: false)
 *   batchSize: number — max documents to process per run (default: 50, max: 200)
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    // Always require super_admin auth — cron secret is an additional check, not a bypass
    const supabase = await createClient();
    const admin = createAdminClient();
    const db = admin || supabase;

    const { data: { user } } = await supabase.auth.getUser();
    let actorId = 'cron';

    if (user) {
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!profile || profile.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden — super_admin required' }, { status: 403 });
      }
      actorId = user.id;
    } else {
      // No authenticated user — require CRON_SECRET
      const cronSecret = request.headers.get('x-cron-secret');
      const expectedSecret = process.env.CRON_SECRET;
      if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const batchSize = Math.min(Math.max(parseInt(body.batchSize) || 50, 1), 200);

    const result = await enforceDocumentRetention({ dryRun, batchSize, actorId });

    return NextResponse.json({
      success: true,
      dryRun,
      batchSize,
      ...result,
    });
  } catch (error) {
    logger.error('[Retention API] Error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/retention
 *
 * Returns the current retention policy configuration. Super_admin only.
 */
async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const admin = createAdminClient();
  const db = admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    retentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS || '1095', 10),
    piiDocumentTypes: [
      'government_id',
      'income_proof',
      'residency_proof',
      'selective_service',
      'tax_document',
      'w9',
      'ssn_form',
    ],
    note: 'WIOA requires 3-year retention from program exit. Default is 1095 days.',
  });
}
export const GET = withApiAudit('/api/admin/retention', _GET);
export const POST = withApiAudit('/api/admin/retention', _POST);
