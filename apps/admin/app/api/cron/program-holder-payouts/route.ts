import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCronRequest } from '@/lib/server/cron-auth';
import { releaseProgramHolderPayment } from '@/lib/program-holder/release-payment';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const { data: schedules, error } = await db
    .from('payout_schedules')
    .select('id,enrollment_id')
    .eq('increment_1_status', 'approved')
    .not('enrollment_id', 'is', null)
    .lte('increment_1_release_date', today)
    .limit(25);
  if (error) return NextResponse.json({ error: 'Unable to load approved payments.' }, { status: 500 });

  const results = [];
  for (const schedule of schedules || []) {
    results.push({
      scheduleId: schedule.id,
      ...(await releaseProgramHolderPayment(db, schedule.enrollment_id, null)),
    });
  }
  return NextResponse.json({
    processed: results.length,
    released: results.filter((item) => item.released).length,
    held: results.filter((item) => !item.released).length,
    results,
  });
}
