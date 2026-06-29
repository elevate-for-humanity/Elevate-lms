import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { Inbox, Clock, CheckCircle, XCircle, Eye, Users } from 'lucide-react';
import {
  AdminPageShell,
  AdminFilterBar,
  AdminCard,
  AdminEmptyState,
  AdminPagination,
  StatusBadge,
} from '@/components/admin/AdminPageShell';
import { FollowUpBlastButton } from '@/components/admin/FollowUpBlastButton';
import { BulkOnboardingButton } from '@/components/admin/BulkOnboardingButton';
import ApplicationsTableClient from './ApplicationsTableClient';
import type { ApplicationRow } from './ApplicationsTableClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Applications | Admin',
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string; program?: string }>;
}) {
  await requireRole(['admin', 'staff', 'org_admin', 'instructor']);
  const params = await searchParams;

  const sessionClient = await createClient();

  const rawStatus = params.status;
  const search = params.search;
  const programFilter = params.program || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  // Resolve virtual filter aliases and comma-separated multi-status
  const resolvedStatuses: string[] =
    rawStatus === 'awaiting_review'
      ? ['submitted', 'pending', 'in_review']
      : rawStatus && rawStatus !== 'all'
        ? rawStatus.split(',').filter(Boolean)
        : [];

  // Use admin client for data queries to bypass RLS
  let adminDb: Awaited<ReturnType<typeof requireAdminClient>> | null = null;
  try {
    adminDb = await requireAdminClient();
  } catch {
    /* handled by null check below */
  }
  if (!adminDb)
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold mb-2">Service temporarily unavailable.</p>
        <p className="text-slate-500 text-sm mb-4">
          The admin database client could not be initialised. This usually means
          <code className="mx-1 px-1 bg-slate-100 rounded">SUPABASE_SERVICE_ROLE_KEY</code>
          is missing from the container environment.
        </p>
        <Link href="/admin/applications" className="text-sm text-blue-600 underline">Retry</Link>
      </div>
    );

  // Optimize: use getApplicationCounts RPC if available; fall back to two parallel queries
  // one for paginated results, one for counts only
  const [
    { data: applications, count: totalCount, error: applicationsError },
    { data: countData, error: countError },
    { count: guestPendingCount, error: guestError },
  ] = await Promise.all([
    // Query 1: Paginated applications with filters
    (async () => {
      let query = adminDb!
        .from('applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (resolvedStatuses.length === 1) query = query.eq('status', resolvedStatuses[0]);
      else if (resolvedStatuses.length > 1) query = query.in('status', resolvedStatuses);
      if (programFilter === 'cdl-training')
        query = query.or('program_slug.eq.cdl-training,program_interest.ilike.%cdl%');
      if (search)
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`,
        );
      return query.range(offset, offset + pageSize - 1);
    })(),
    // Query 2: Status counts only (head=true to avoid transferring full rows)
    adminDb
      .from('applications')
      .select('id, status', { head: false }),
    // Query 3: Guest pending count (separate count query)
    adminDb
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .is('user_id', null)
      .is('onboarding_sent_at', null)
      .in('status', ['submitted', 'pending_admin_review', 'under_review', 'approved']),
  ]);

  if (applicationsError) {
    logger.error('[admin/applications] query failed', applicationsError);
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold mb-2">Failed to load applications.</p>
        <p className="text-slate-500 text-sm mb-1">
          Database error — check server logs for details.
        </p>
        <Link href="/admin/applications" className="text-sm text-blue-600 underline">Retry</Link>
      </div>
    );
  }
  if (countError) {
    logger.error('[admin/applications] count query failed', countError);
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold mb-2">Failed to load application counts.</p>
        <p className="text-slate-500 text-sm mb-1">
          Database error — check server logs for details.
        </p>
        <Link href="/admin/applications" className="text-sm text-blue-600 underline">Retry</Link>
      </div>
    );
  }

  const visibleApplications = (applications ?? []).filter((app: any) => {
    const id = String(app?.id ?? '');
    return !id.startsWith('intake-');
  });

  // Compute status counts from countData
  const statusCounts: Record<string, number> = {};
  let totalApplications = 0;
  countData?.forEach((app: { id?: string; status: string }) => {
    const id = String(app.id ?? '');
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    totalApplications++;
  });

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  const pending = (statusCounts['pending'] || 0) + (statusCounts['submitted'] || 0);

  const baseHref = `/admin/applications${rawStatus && rawStatus !== 'all' ? `?status=${rawStatus}` : ''}${search ? `${rawStatus && rawStatus !== 'all' ? '&' : '?'}search=${search}` : ''}`;

  return (
    <AdminPageShell
      title="Applications"
      description="Review, approve, and manage program applications."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Applications' }]}
      stats={[
        { label: 'Total', value: totalApplications, icon: Inbox, color: 'slate' },
        { label: 'Needs Review', value: pending, icon: Clock, color: 'amber', alert: pending > 0 },
        {
          label: 'In Review',
          value: (statusCounts['in_review'] || 0) + (statusCounts['under_review'] || 0),
          icon: Eye,
          color: 'blue',
        },
        {
          label: 'Approved',
          value: (statusCounts['approved'] || 0) + (statusCounts['ready_to_enroll'] || 0),
          icon: CheckCircle,
          color: 'green',
        },
        {
          label: 'Enrolled',
          value: statusCounts['enrolled'] || 0,
          icon: CheckCircle,
          color: 'blue',
        },
        { label: 'Rejected', value: statusCounts['rejected'] || 0, icon: XCircle, color: 'red' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <BulkOnboardingButton guestCount={guestPendingCount ?? 0} />
          <FollowUpBlastButton pendingCount={pending} />
        </div>
      }
    >
      {/* Filters */}
      <AdminFilterBar>
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              name="status"
              defaultValue={rawStatus || 'all'}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="under_review">Under Review</option>
              <option value="pending_workone">Pending WorkOne</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="approved">Approved</option>
              <option value="ready_to_enroll">Ready to Enroll</option>
              <option value="enrolled">Enrolled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Program</label>
            <select
              name="program"
              defaultValue={programFilter || 'all'}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              <option value="all">All Programs</option>
              <option value="cdl-training">CDL Training</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Name or email…"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Filter
          </button>
          <Link
            href="/admin/applications"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Clear
          </Link>
        </form>
      </AdminFilterBar>

      {/* Table */}
      <AdminCard>
        {visibleApplications.length > 0 ? (
          <>
            <ApplicationsTableClient applications={visibleApplications as ApplicationRow[]} />
            <AdminPagination page={page} totalPages={totalPages} baseHref={baseHref} />
          </>
        ) : (
          <AdminEmptyState
            message={`No applications found${rawStatus && rawStatus !== 'all' ? ' matching your filters' : ''}.`}
          />
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
