import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import TrafficReports from '@/components/analytics/TrafficReports';
export const dynamic = 'force-dynamic';
export default async function ApprenticeTrafficPage() {
  const { user } = await requireRole(['apprentice', 'student', 'admin']);
  const db = await createClient();
  const { data, error } = await db
    .from('website_domains')
    .select('hostname')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .eq('points_to_edge', true);
  const hosts = [
    ...new Set(
      (data || [])
        .map((row) => row.hostname)
        .filter((host): host is string => typeof host === 'string' && /^[a-z0-9.-]+$/i.test(host)),
    ),
  ];
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <Link href="/apprentice">← Apprentice dashboard</Link>
      {error ? (
        <p role="status">Your website connections could not be loaded. Please try again.</p>
      ) : hosts.length ? (
        <TrafficReports hostnames={hosts} />
      ) : (
        <section>
          <h1 className="text-2xl font-bold">My Website Traffic</h1>
          <p>
            Your account has no active verified website domain connected yet. Traffic reports will
            appear when your website is connected.
          </p>
        </section>
      )}
    </main>
  );
}
