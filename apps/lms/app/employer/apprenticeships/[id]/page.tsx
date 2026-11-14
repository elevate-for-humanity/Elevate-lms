import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprenticeship Program | Employer Portal',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-slate-100 text-slate-700',
  inactive: 'bg-red-100 text-red-700',
};

export default async function EmployerApprenticeshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRole(['employer', 'sponsor', 'admin', 'staff']);
  const { id } = await params;
  const supabase = await createClient();
  const employer = await getEmployerRecord(supabase, user.id);

  if (!employer) notFound();

  const { data: apprenticeship } = await supabase
    .from('apprenticeships')
    .select('id, title, description, duration_months, requirements, benefits, wage_progression, status, created_at, updated_at')
    .eq('id', id)
    .eq('employer_id', employer.id)
    .maybeSingle();

  if (!apprenticeship) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/employer/apprenticeships" className="text-sm text-brand-blue-700 hover:underline">
            ← Apprenticeship Programs
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Employer Portal</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{apprenticeship.title}</h1>
            </div>
            <span className={`self-start text-xs font-bold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[apprenticeship.status] ?? STATUS_STYLES.draft}`}>
              {apprenticeship.status ?? 'draft'}
            </span>
          </div>
        </div>

        {apprenticeship.status === 'draft' && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <p className="font-semibold">Draft proposal</p>
            <p className="text-sm mt-1">
              This record is not represented as approved or registered until administrative review and required apprenticeship documentation are complete.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <section className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-2">Description</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{apprenticeship.description || 'No description provided.'}</p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-2">Duration</h2>
            <p className="text-sm text-slate-700">
              {apprenticeship.duration_months ? `${apprenticeship.duration_months} months` : 'Not specified'}
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-2">Created</h2>
            <p className="text-sm text-slate-700">
              {apprenticeship.created_at ? new Date(apprenticeship.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-2">Requirements</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{apprenticeship.requirements || 'Not specified'}</p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-2">Benefits / Wage Notes</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{apprenticeship.benefits || 'Not specified'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
