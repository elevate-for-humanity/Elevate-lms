import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import GrantIntakeClient from './GrantIntakeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Grant Intake | Admin | Elevate For Humanity',
  description: 'Submit new grant applications and manage intake process.',
};

export default async function GrantIntakePage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: opportunities } = await db
    .from('grant_opportunities')
    .select('id, title, agency_name')
    .in('status', ['posted', 'forecasted'])
    .order('close_date', { ascending: true })
    .limit(100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/grants" className="hover:text-slate-700">Grants</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">New Application</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">New Grant Application</h1>
        <p className="text-sm text-slate-500 mt-1">
          Start the intake process for a new grant opportunity.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <GrantIntakeClient opportunities={opportunities ?? []} />
      </div>
    </div>
  );
}
