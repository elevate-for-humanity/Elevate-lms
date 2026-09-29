import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reinstatement must be driven by a provider-confirmed payment mapped to the
// learner. Legacy subscription IDs cannot verify current QuickBooks/PayPal state.
export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const { count, error } = await db
    .from('barber_subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('payment_status', ['past_due', 'suspended']);
  if (error) return NextResponse.json({ error: 'Legacy billing review unavailable' }, { status: 503 });

  return NextResponse.json({
    success: true,
    action: 'review_only',
    legacySubscriptionsNeedingReview: count ?? 0,
    reinstated: 0,
    reason: 'A provider-confirmed invoice and learner mapping are required before restoring access.',
  });
});
