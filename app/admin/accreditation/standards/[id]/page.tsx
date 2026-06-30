import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {};
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{value || '—'}</p>
    </div>
  );
}

export default async function AccreditationStandardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();
  if (!db) notFound();

  const { data: standard, error } = await db
    .from('accreditation_standards')
    .select('id, category, name, description, required, evidence_types, admin_link, sort_order, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !standard) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accreditation', href: '/admin/accreditation' },
          { label: standard.name },
        ]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/accreditation" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{standard.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{standard.category}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${standard.required ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
            {standard.required ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {standard.required ? 'Required' : 'Optional'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Description</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{standard.description || '—'}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Details</h2>
            <div className="space-y-4">
              <Field label="Category" value={standard.category} />
              <Field label="Sort Order" value={standard.sort_order?.toString()} />
              <Field label="Created" value={new Date(standard.created_at).toLocaleDateString()} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Evidence Types</h2>
            {standard.evidence_types?.length ? (
              <ul className="space-y-1">
                {(standard.evidence_types as string[]).map((e, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400">No evidence types defined</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {standard.admin_link && (
            <a href={standard.admin_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700">
              Open Admin Link
            </a>
          )}
          <Link href="/admin/accreditation"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 ml-auto">
            Back to Accreditation
          </Link>
        </div>
      </div>
    </div>
  );
}
