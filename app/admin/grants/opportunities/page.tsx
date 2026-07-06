import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import OpportunitiesClient from './OpportunitiesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Grant Opportunities | Admin' };

export default async function GrantOpportunitiesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  // Load cached opportunities from DB
  const { data: cached } = await db
    .from('grant_opportunities')
    .select('id, title, agency_name, opportunity_number, cfda_number, close_date, award_ceiling, award_floor, status, source, opportunity_url, description, imported_at')
    .order('close_date', { ascending: true, nullsFirst: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/grants" className="hover:text-slate-700">Grants</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Opportunities</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grant Opportunities</h1>
            <p className="text-sm text-slate-500 mt-1">
              Search SAM.gov and Grants.gov — save opportunities and start applications.
            </p>
          </div>
          <Link
            href="/admin/grants/applications/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            + New Application
          </Link>
        </div>
      </div>
      <OpportunitiesClient cached={cached ?? []} />
    </div>
  );
}
