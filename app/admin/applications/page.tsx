import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Inbox, Clock, CheckCircle, XCircle, Eye, Users } from 'lucide-react';
import { AdminPageShell, AdminFilterBar, AdminCard, AdminEmptyState, AdminPagination, StatusBadge } from '@/components/admin/AdminPageShell';
import { FollowUpBlastButton } from '@/components/admin/FollowUpBlastButton';
import ApplicationsTableClient from './ApplicationsTableClient';
import type { ApplicationRow } from './ApplicationsTableClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Applications | Admin',
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Auth check via session client
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  // All application queries use admin client to bypass RLS
  const supabase = createAdminClient();

  const statusFilter = params.status;
  const search = params.search;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  // Use admin client for data queries to bypass RLS
  const adminDb = createAdminClient();

  let query = adminDb.from('applications').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
  query = query.range(offset, offset + pageSize - 1);

  const { data: applications, count: totalCount, error } = await query;
  const { data: allApps } = await adminDb.from('applications').select('status');

  const statusCounts: Record<string, number> = {};
  let totalApplications = 0;
  allApps?.forEach((app: { status: string }) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    totalApplications++;
  });

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  const pending = (statusCounts['pending'] || 0) + (statusCounts['submitted'] || 0);

  const baseHref = `/admin/applications${statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''}${search ? `${statusFilter && statusFilter !== 'all' ? '&' : '?'}search=${search}` : ''}`;

  return (
    <AdminPageShell
      title="Applications"
      description="Review, approve, and manage program applications."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Applications' }]}
      stats={[
        { label: 'Total',      value: totalApplications,                    icon: Inbox,        color: 'slate' },
        { label: 'Pending',    value: pending,                              icon: Clock,        color: 'amber', alert: pending > 0 },
        { label: 'In Review',  value: statusCounts['in_review'] || 0,       icon: Eye,          color: 'blue' },
        { label: 'Approved',   value: statusCounts['approved'] || 0,        icon: CheckCircle,  color: 'green' },
        { label: 'Rejected',   value: statusCounts['rejected'] || 0,        icon: XCircle,      color: 'red' },
      ]}
      actions={
        <FollowUpBlastButton pendingCount={pending} />
      }
    >
      {/* Filters */}
      <AdminFilterBar>
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select name="status" defaultValue={statusFilter || 'all'}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue-500 focus:outline-none">
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending (legacy)</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="enrolled">Enrolled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <input type="text" name="search" defaultValue={search || ''} placeholder="Name or email…"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
            Filter
          </button>
          <Link href="/admin/applications" className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">
            Clear
          </Link>
        </form>
      </AdminFilterBar>

      {/* Table */}
      <AdminCard>
        {error ? (
          <div className="p-8 text-center text-brand-red-600 text-sm">Error loading applications.</div>
        ) : applications && applications.length > 0 ? (
          <>
            <ApplicationsTableClient applications={applications as ApplicationRow[]} />
            <AdminPagination page={page} totalPages={totalPages} baseHref={baseHref} />
          </>
        ) : (
          <AdminEmptyState message={`No applications found${statusFilter && statusFilter !== 'all' ? ' matching your filters' : ''}.`} />
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
