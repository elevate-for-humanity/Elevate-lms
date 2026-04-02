// Server component — enforces admin auth and passes real stats to client.
import AdminClientPage from '@/components/admin/AdminClientPage';
import EmailMarketingClient from './EmailMarketingClient';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/authGuards';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  const db = createAdminClient();

  // Real subscriber count from profiles
  const [{ count: subscriberCount }, { count: sentCount }] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('email_automations')
      .select('total_recipients', { count: 'exact', head: false })
      .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const emailsSentThisMonth = sentCount ?? 0;
  const totalSubscribers = subscriberCount ?? 0;

  return (
    <AdminClientPage>
      <EmailMarketingClient stats={{ emailsSentThisMonth, totalSubscribers }} />
    </AdminClientPage>
  );
}
