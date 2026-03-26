import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ApplicationQueue from './ApplicationQueue';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Provider Applications | Admin',
};

export default async function ProviderApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/provider-applications');

  const db = createAdminClient();
  if (!db) return <div className="p-8 text-red-600">Database unavailable</div>;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const { status: filterStatus } = await searchParams;
  const activeFilter = filterStatus ?? 'pending';

  // Counts per status for tab badges
  const { data: counts } = await supabase
    .from('provider_applications')
    .select('status');

  const statusCounts = (counts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  // Applications for active tab
  const query = supabase
    .from('provider_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (activeFilter !== 'all') {
    query.eq('status', activeFilter);
  }

  const { data: applications } = await query;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Provider Applications' },
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Provider Applications</h1>
            <p className="text-slate-500 text-sm mt-1">
              Review and approve training organizations applying to join the network.
            </p>
          </div>
        </div>

        <ApplicationQueue
          applications={applications ?? []}
          statusCounts={statusCounts}
          activeFilter={activeFilter}
        />
      </div>
    </div>
  );
}
