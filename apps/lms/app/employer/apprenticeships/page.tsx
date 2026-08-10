import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import Link from 'next/link';
import { Plus, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprenticeships | Employer Portal',
  description: 'Manage employer-sponsored apprenticeship program proposals and active programs.',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ employerId?: string }>;
};

export default async function EmployerApprenticeshipsPage() {
  const { user } = await requireRole(['employer', 'sponsor', 'admin', 'staff']);
  const supabase = await createClient();
  const employer = await getEmployerRecord(supabase, user.id);

  const { data: apprenticeships } = employer
    ? await supabase
        .from('apprenticeships')
        .select('id, program_id, title, description, status, duration_months, created_at')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  const list = apprenticeships || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-blue-700">
              Employer Portal
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900">Apprenticeship Programs</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage apprenticeship program proposals and programs associated with your employer account.
            </p>
          </div>
          {employer && (
            <Link
              href="/employer/apprenticeships/new"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Program
            </Link>
          )}
        </div>

        {!employer ? (
          <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center">
            <Briefcase className="w-12 h-12 text-amber-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Employer profile required</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Complete employer onboarding before creating or managing apprenticeship program proposals.
            </p>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">No apprenticeship programs yet</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Start a draft program proposal. Drafts are not represented as approved or registered until administrative review is complete.
            </p>
            <Link
              href="/employer/apprenticeships/new"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Draft Program
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((apprenticeship: any) => (
              <Link
                key={apprenticeship.id}
                href={`/employer/apprenticeships/${apprenticeship.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="font-bold text-slate-900 text-base truncate">{apprenticeship.title}</h2>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                          STATUS_STYLES[apprenticeship.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {apprenticeship.status ?? 'draft'}
                      </span>
                    </div>
                    {apprenticeship.description && (
                      <p className="text-slate-500 text-sm line-clamp-2">{apprenticeship.description}</p>
                    )}
                  </div>
                  {apprenticeship.duration_months && (
                    <div className="shrink-0 text-center">
                      <p className="text-xl font-extrabold text-slate-900">{apprenticeship.duration_months}</p>
                      <p className="text-xs text-slate-500">Months</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href={dashboardHref} className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> Back to Employer Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
