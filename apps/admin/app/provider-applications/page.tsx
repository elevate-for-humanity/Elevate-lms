import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ApplicationQueue from './ApplicationQueue';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Provider Applications | Admin',
};

export default async function ProviderApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const { status: filterStatus } = await searchParams;
  const activeFilter = filterStatus ?? 'pending';

  // Counts per status for tab badges
  const { data: counts } = await db.from('provider_applications').select('status');

  const statusCounts = (counts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  // Applications for active tab
  const query = db
    .from('provider_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (activeFilter !== 'all') {
    query.eq('status', activeFilter);
  }

  const { data: applications } = await query;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Provider Applications' }]}
        />
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
