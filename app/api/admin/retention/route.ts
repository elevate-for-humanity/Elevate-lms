import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { enforceDocumentRetention } from '@/lib/retention/document-retention';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/retention
 *
 * Trigger document retention enforcement. Super_admin only.
 * Can also be called by a cron job with CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Allow cron jobs with shared secret
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
      // Authorized via cron secret
    } else {
      // Require super_admin auth
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
    }

    const result = await enforceDocumentRetention();

    logger.info('[Retention API] Enforcement triggered', result);

    return NextResponse.json({
      success: true,
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
 * Returns the current retention policy configuration.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

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
