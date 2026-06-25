import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import OrgProfileClient from './OrgProfileClient';
import { ORG_PROFILE } from '@/lib/grants/org-profile';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Organization Profile | Admin' };

export default async function OrgProfilePage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const { data: org } = await db
    .from('sos_organizations')
    .select('*')
    .limit(1)
    .maybeSingle();

  const { data: facts } = await db
    .from('sos_organization_facts')
    .select('id, fact_key, fact_value_json, source_type, source_reference, status, approved_at, updated_at')
    .order('fact_key');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Organization Profile</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Organization Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Source of truth for all contract and grant prefill — EIN, UEI, CAGE, SAM, signatory, mission, programs, and workforce metrics.
        </p>
      </div>
      <OrgProfileClient org={org} facts={facts ?? []} staticProfile={ORG_PROFILE} />
    </div>
  );
}
