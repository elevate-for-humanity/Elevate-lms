import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, TrendingUp } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { EMPLOYER_ROLES, normalizeRoles } from '@/lib/rbac/role-matrix';
import { loadEmployerApprenticeshipSummary } from '@/lib/employer/apprenticeship-dashboard-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprenticeships | Employer Portal',
  description: 'Review apprenticeship programs mapped to your employer organization.',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ employerId?: string }>;
};

export default async function EmployerApprenticeshipsPage({ searchParams }: PageProps) {
  const { user, effectiveRoles } = await requireRole(EMPLOYER_ROLES);
  const roles = normalizeRoles(effectiveRoles);
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const { employerId } = await searchParams;

  const summary = await loadEmployerApprenticeshipSummary(user.id, {
    employerId: isAdmin ? employerId : undefined,
  });
  const dashboardHref = isAdmin && employerId
    ? `/employer/dashboard?employerId=${encodeURIComponent(employerId)}`
    : '/employer/dashboard';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-blue-700">
              Employer Portal
            </p>
            <h1 className="text-3xl font-black text-slate-950">Apprenticeship Programs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Programs shown here come from explicit employer-to-program mappings. The larger Elevate apprenticeship catalog is reported separately and is not automatically assigned to your organization.
            </p>
          </div>
          <Link
            href="https://www.elevateforhumanity.org/apply/employer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
          >
            Request an apprenticeship partnership
          </Link>
        </div>

        {summary.sourceState === 'unavailable' ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-black">Apprenticeship data is temporarily unavailable</h2>
                <p className="mt-1 text-sm leading-6">
                  The canonical employer mapping query failed. The portal is intentionally showing an unavailable state instead of a misleading zero.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <TrendingUp className="h-6 w-6 text-blue-700" />
                <p className="mt-4 text-3xl font-black text-slate-950">{summary.mappedProgramCount}</p>
                <p className="mt-1 font-bold text-slate-800">Programs mapped to this employer</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">Source: employer_partnerships → programs</p>
              </div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <Building2 className="h-6 w-6 text-blue-700" />
                <p className="mt-4 text-3xl font-black text-slate-950">
                  {summary.availableStandardsCount == null ? '—' : summary.availableStandardsCount}
                </p>
                <p className="mt-1 font-bold text-slate-800">Available apprenticeship standards</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">Catalog count only; these are not all employer assignments.</p>
              </div>
            </section>

            {summary.mappedPrograms.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Building2 className="mx-auto h-11 w-11 text-slate-400" />
                <h2 className="mt-4 text-xl font-black text-slate-950">No apprenticeship program is mapped yet</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-700">
                  This means your employer record has no active program mapping. It does not mean Elevate has zero apprenticeship programs.
                </p>
              </section>
            ) : (
              <section className="space-y-4">
                {summary.mappedPrograms.map((program) => (
                  <article key={program.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                      <div>
                        <h2 className="text-lg font-black text-slate-950">{program.name}</h2>
                        <p className="mt-1 text-sm text-slate-600">{program.slug || 'Canonical program record'}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-green-800">Active employer mapping</p>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
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
