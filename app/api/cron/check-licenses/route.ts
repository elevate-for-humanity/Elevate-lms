/**
 * GET /api/cron/check-licenses
 * Verify license status against DB — flag any active licenses with missing required fields.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();

  // Find active licenses missing required fields
  const { data: incomplete, error } = await db
    .from('licenses')
    .select('id, holder_id, license_type, license_number, expiry_date, issuing_authority')
    .eq('status', 'active')
    .or('license_number.is.null,expiry_date.is.null,issuing_authority.is.null')
    .limit(100);

  if (error) {
    logger.error('[cron/check-licenses] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let flagged = 0;
  for (const lic of incomplete ?? []) {
    const missing = [
      !lic.license_number && 'license_number',
      !lic.expiry_date && 'expiry_date',
      !lic.issuing_authority && 'issuing_authority',
    ].filter(Boolean).join(', ');

    await db.from('admin_alerts').insert({
      alert_type: 'incomplete_license',
      severity: 'warning',
      message: `License ${lic.id} (${lic.license_type ?? 'unknown type'}) missing required fields: ${missing}`,
      metadata: { license_id: lic.id, holder_id: lic.holder_id, missing_fields: missing },
    })

    flagged++;
  }

  // Count expiring in 60 days
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  const { count: expiringSoon } = await db
    .from('licenses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('expiry_date', in60);

  logger.info('[cron/check-licenses] Done', { flagged, expiring_in_60_days: expiringSoon ?? 0 });
  return NextResponse.json({ ok: true, flagged, expiring_in_60_days: expiringSoon ?? 0 });
});
