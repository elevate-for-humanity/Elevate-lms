// Server component — enforces admin auth and passes real SendGrid stats to client.
import AdminClientPage from '@/components/admin/AdminClientPage';
import EmailMarketingClient from './EmailMarketingClient';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/authGuards';
import { getSendGridStats } from '@/lib/email/sendgrid-stats';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  const db = createAdminClient();

  const [{ count: subscriberCount }, sgStats] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    getSendGridStats(),
  ]);

  return (
    <AdminClientPage>
      <EmailMarketingClient
        stats={{
          totalSubscribers:      subscriberCount ?? 0,
          emailsSentThisMonth:   sgStats.thisMonth?.requests ?? 0,
          deliveredThisMonth:    sgStats.thisMonth?.delivered ?? 0,
          openRateThisMonth:     sgStats.thisMonth?.openRate ?? null,
          clickRateThisMonth:    sgStats.thisMonth?.clickRate ?? null,
          openRateLastMonth:     sgStats.lastMonth?.openRate ?? null,
          clickRateLastMonth:    sgStats.lastMonth?.clickRate ?? null,
          bouncesThisMonth:      sgStats.thisMonth?.bounces ?? 0,
        }}
      />
    </AdminClientPage>
  );
}
