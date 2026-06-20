import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import GrantApplicationForm from '../GrantApplicationForm';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Grant Application | Admin' };

export default async function GrantApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const { data: application } = await db
    .from('grant_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!application) notFound();

  const { data: org } = await db
    .from('sos_organizations')
    .select('id, legal_name, ein, uei, sam_status, phone, general_email, address_line_1, address_line_2, city, state, zip, authorized_signatory_name, authorized_signatory_title')
    .limit(1)
    .maybeSingle();

  const { data: facts } = await db
    .from('sos_organization_facts')
    .select('fact_key, fact_value_json')
    .eq('status', 'approved');

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
          <span className="text-slate-900 font-medium truncate max-w-xs">
            {application.opportunity_title ?? application.project_title ?? id.slice(0, 8)}
          </span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {application.opportunity_title ?? application.project_title ?? 'Grant Application'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {application.agency_name ?? ''}{application.deadline ? ` · Due ${new Date(application.deadline).toLocaleDateString()}` : ''}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            application.status === 'submitted' ? 'bg-green-100 text-green-700' :
            application.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
            application.status === 'in_review' ? 'bg-amber-100 text-amber-700' :
            application.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {application.status ?? 'draft'}
          </span>
        </div>
      </div>
      <GrantApplicationForm
        org={org}
        facts={facts ?? []}
        application={application}
        mode="edit"
      />
    </div>
  );
}
