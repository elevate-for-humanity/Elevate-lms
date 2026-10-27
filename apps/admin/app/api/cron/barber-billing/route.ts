import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Legacy barber subscription rows have no verified link to the current billing
// schedules. A past-due flag alone cannot authorize a new suspension.
export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const { count, error } = await db
    .from('barber_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('payment_status', 'past_due');
  if (error) return NextResponse.json({ error: 'Legacy billing review unavailable' }, { status: 503 });

  return NextResponse.json({
    success: true,
    action: 'review_only',
    legacyPastDueSubscriptions: count ?? 0,
    suspended: 0,
    reason: 'A provider-confirmed invoice and learner mapping are required before changing access.',
  });
});
