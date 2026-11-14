import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { loadEmployerApprenticeshipData } from '@/lib/employer/apprenticeship-dashboard-data';
import Link from 'next/link';
import { Plus, Briefcase, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprenticeships | Employer Portal',
  description: 'Employer apprenticeship mappings, available pathways, and draft proposals.',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  approved: 'bg-brand-green-100 text-brand-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-slate-100 text-slate-700',
  inactive: 'bg-red-100 text-red-700',
};

export default async function EmployerApprenticeshipsPage() {
  const { user } = await requireRole(['employer', 'sponsor', 'admin', 'staff']);
  const supabase = await createClient();
  const employer = await getEmployerRecord(supabase, user.id);

  const data = employer
    ? await loadEmployerApprenticeshipData(supabase, employer.id)
    : { partnerships: [], mappedPrograms: [], availablePrograms: [], draftProposals: [] };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-700 mb-1">Employer Portal</p>
            <h1 className="text-2xl font-extrabold text-slate-900">Apprenticeship Programs</h1>
            <p className="text-slate-600 text-sm mt-1">
              Employer mappings are separate from draft proposals and the platform apprenticeship catalog.
            </p>
          </div>
          {employer ? (
            <Link href="/employer/apprenticeships/new" className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
              <Plus className="w-4 h-4" /> New Draft Proposal
            </Link>
          ) : null}
        </div>

        {!employer ? (
          <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center">
            <Briefcase className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Employer profile required</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">Complete employer onboarding before managing apprenticeship relationships.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Programs mapped to your employer</h2>
                  <p className="text-sm text-slate-600">These records come from the employer-program partnership table.</p>
                </div>
                <span className="text-2xl font-black text-slate-950">{data.mappedPrograms.length}</span>
              </div>

              {data.mappedPrograms.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-7">
                  <p className="font-bold text-slate-900">No apprenticeship program is mapped to this employer yet.</p>
                  <p className="mt-2 text-sm text-slate-600">This does not mean Elevate has zero apprenticeship programs. Available pathways are listed below.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.mappedPrograms.map(({ mapping, program }) => (
                    <article key={mapping.id} className="rounded-2xl border border-green-200 bg-white p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-950">{program?.title ?? 'Mapped apprenticeship program'}</h3>
                          <p className="mt-1 text-sm text-slate-600">{program?.description ?? 'Program mapping is active in the employer relationship record.'}</p>
                        </div>
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-700" />
                      </div>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-green-800">{mapping.status ?? 'mapped'}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Available apprenticeship pathways</h2>
                  <p className="text-sm text-slate-600">Active apprenticeship programs in the canonical program catalog.</p>
                </div>
                <span className="text-2xl font-black text-slate-950">{data.availablePrograms.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {data.availablePrograms.map((program) => (
                  <article key={program.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="font-black text-slate-950">{program.title ?? program.slug ?? 'Apprenticeship Program'}</h3>
                    {program.description ? <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{program.description}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-700">
                      {program.required_hours ? <span>{program.required_hours.toLocaleString()} required hours</span> : null}
                      {program.duration ? <span>{program.duration}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Draft proposals</h2>
                  <p className="text-sm text-slate-600">Drafts are proposals only; they are not counted as mapped or approved programs.</p>
                </div>
                <span className="text-2xl font-black text-slate-950">{data.draftProposals.length}</span>
              </div>

              {data.draftProposals.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-7 text-sm text-slate-600">No draft proposals.</div>
              ) : (
                <div className="space-y-4">
                  {data.draftProposals.map((draft) => (
                    <Link key={draft.id} href={`/employer/apprenticeships/${draft.id}`} className="block rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-950">{draft.title ?? 'Untitled draft'}</h3>
                          {draft.description ? <p className="mt-1 text-sm text-slate-600 line-clamp-2">{draft.description}</p> : null}
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[draft.status ?? 'draft'] ?? STATUS_STYLES.draft}`}>
                          {draft.status ?? 'draft'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-8">
          <Link href="/employer/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
