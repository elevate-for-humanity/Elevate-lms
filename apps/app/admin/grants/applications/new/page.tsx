import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import GrantApplicationForm from '../GrantApplicationForm';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Grant Application | Admin' };

export default async function NewGrantApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunity_id?: string; title?: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { opportunity_id, title } = await searchParams;
  const db = await requireAdminClient();

  // Load org for prefill
  const { data: org } = await db
    .from('sos_organizations')
    .select('id, legal_name, ein, uei, sam_status, phone, general_email, address_line_1, address_line_2, city, state, zip, authorized_signatory_name, authorized_signatory_title')
    .limit(1)
    .maybeSingle();

  // Load org facts
  const { data: facts } = await db
    .from('sos_organization_facts')
    .select('fact_key, fact_value_json')
    .eq('status', 'approved');

  // Load opportunity if linked
  let opportunity = null;
  if (opportunity_id) {
    const { data } = await db
      .from('grant_opportunities')
      .select('*')
      .eq('id', opportunity_id)
      .maybeSingle();
    opportunity = data;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/grants" className="hover:text-slate-700">Grants</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/grants/applications" className="hover:text-slate-700">Applications</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">New</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">New Grant Application</h1>
        <p className="text-sm text-slate-500 mt-1">
          Prefilled from org profile — review and complete all narrative sections before submitting.
        </p>
      </div>
      <GrantApplicationForm
        org={org}
        facts={facts ?? []}
        opportunity={opportunity}
        prefillTitle={title}
        mode="new"
      />
    </div>
  );
}
