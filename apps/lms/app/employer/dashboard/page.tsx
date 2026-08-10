import type { ElementType } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase, Building2, FileText, Shield, TrendingUp, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { EMPLOYER_ROLES, normalizeRoles } from '@/lib/rbac/role-matrix';
import { loadEmployerApprenticeshipSummary } from '@/lib/employer/apprenticeship-dashboard-data';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Employer Dashboard',
  description: 'Employer jobs, candidates, apprenticeship programs, and workforce tools.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ employerId?: string }>;
};

async function AdminEmployerSelector() {
  const db = await requireAdminClient();
  const { data: employers } = await db
    .from('employers')
    .select('id, business_name, company_name, email, approved, accepts_apprentices')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <p className="text-xs font-extrabold uppercase tracking-wide text-blue-800">Admin portal override</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Choose an employer to preview</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Employer data is tenant-scoped. Admin access requires an explicit employer selection instead of
          silently treating the administrator profile as an employer.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(employers || []).map((employer: any) => (
          <Link
            key={employer.id}
            href={`/employer/dashboard?employerId=${encodeURIComponent(employer.id)}`}
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="font-black text-slate-950">
              {employer.business_name || employer.company_name || 'Employer'}
            </h2>
            <p className="mt-1 text-sm text-slate-700">{employer.email || 'No email on record'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className={`rounded-full px-2.5 py-1 ${employer.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
                {employer.approved ? 'Approved' : 'Pending'}
              </span>
              {employer.accepts_apprentices && (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">Accepts apprentices</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default async function EmployerDashboard({ searchParams }: PageProps) {
  const { user, effectiveRoles } = await requireRole(EMPLOYER_ROLES);
  const roles = normalizeRoles(effectiveRoles);
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const { employerId } = await searchParams;

  if (isAdmin && !employerId) return <AdminEmployerSelector />;

  const supabase = await createClient();
  const db = await requireAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, company_name, verified')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/unauthorized');

  const employerQuery = db
    .from('employers')
    .select('id, owner_user_id, business_name, company_name, email, approved, accepts_apprentices');

  const { data: employerRecord } = isAdmin && employerId
    ? await employerQuery.eq('id', employerId).maybeSingle()
    : await employerQuery
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

  const actingEmployerUserId =
    isAdmin && employerRecord?.owner_user_id ? employerRecord.owner_user_id : user.id;
  const isVerified = isAdmin || Boolean(profile.verified || employerRecord?.approved);

  if (!isAdmin && !isVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-8 w-8 text-blue-700" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Application Under Review</h1>
          <p className="mt-3 text-slate-700">
            Your employer application has been received. Hiring and apprenticeship operations unlock after approval.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            We will use <strong>{profile.email}</strong> for account updates.
          </p>
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9+]/g, '')}`}
            className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
          >
            Call {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </section>
      </main>
    );
  }

  const [{ data: postings }, { data: applications }, apprenticeship] = await Promise.all([
    db
      .from('job_postings')
      .select('id, title, status, created_at')
      .eq('employer_id', actingEmployerUserId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    db
      .from('job_applications')
      .select('id, status')
      .eq('employer_id', actingEmployerUserId)
      .eq('status', 'pending'),
    loadEmployerApprenticeshipSummary(user.id, {
      employerId: isAdmin ? employerId : undefined,
    }),
  ]);

  const companyName =
    employerRecord?.business_name ||
    employerRecord?.company_name ||
    profile.company_name ||
    'Your Company';

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <span>Admin preview: <strong>{companyName}</strong></span>
          <Link href="/employer/dashboard" className="font-bold hover:underline">Switch employer</Link>
        </div>
      )}

      <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Employer Portal</p>
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{companyName}</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Manage hiring, candidates, and only the apprenticeship programs explicitly mapped to your organization.
            </p>
          </div>
          <span className="self-start rounded-full bg-green-100 px-3 py-1.5 text-xs font-extrabold text-green-800 lg:self-auto">
            Verified Employer
          </span>
        </div>
      </section>

      {apprenticeship.sourceState === 'unavailable' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          Apprenticeship metrics are unavailable because the canonical mapping query failed. This is not being shown as zero.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Employer metrics">
        <Metric icon={Briefcase} label="Active job postings" value={String(postings?.length ?? 0)} />
        <Metric icon={Users} label="Pending applications" value={String(applications?.length ?? 0)} />
        <Metric
          icon={TrendingUp}
          label="Your mapped apprenticeship programs"
          value={apprenticeship.sourceState === 'unavailable' ? '—' : String(apprenticeship.mappedProgramCount)}
          detail="Explicit employer_partnerships → programs mappings"
        />
        <Metric
          icon={Building2}
          label="Available apprenticeship standards"
          value={apprenticeship.availableStandardsCount == null ? '—' : String(apprenticeship.availableStandardsCount)}
          detail="Platform catalog; not all standards belong to this employer"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Apprenticeship Programs</h2>
                <p className="mt-1 text-sm text-slate-700">Only explicit employer mappings appear as your programs.</p>
              </div>
              <Link href="/employer/apprenticeships" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
                Manage Apprenticeships
              </Link>
            </div>
            {apprenticeship.mappedPrograms.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {apprenticeship.mappedPrograms.map((program) => (
                  <div key={program.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-bold text-slate-950">{program.name}</p>
                    <p className="mt-1 text-xs text-slate-600">{program.slug || 'Program record'}</p>
                  </div>
                ))}
              </div>
            ) : apprenticeship.sourceState !== 'unavailable' ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
                No apprenticeship program is currently mapped to this employer. This no longer means the platform catalog is empty.
              </div>
            ) : null}
          </div>

          {(postings?.length ?? 0) > 0 && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Active Job Postings</h2>
              <div className="mt-4 divide-y">
                {postings?.slice(0, 5).map((posting: any) => (
                  <div key={posting.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-bold text-slate-950">{posting.title}</p>
                      <p className="text-xs text-slate-600">{new Date(posting.created_at).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/employer/postings/${posting.id}`} className="text-sm font-bold text-blue-700 hover:underline">View</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Action href="/employer/jobs" icon={Briefcase} title="Manage jobs" text="Create and manage employer job postings." />
          <Action href="/employer/candidates" icon={Users} title="Candidates" text="Review trained candidates and applications." />
          <Action href="/employer/apprenticeships" icon={TrendingUp} title="Apprenticeships" text="Manage mapped programs, apprentices, and compliance." />
          <Action href="/employer/compliance" icon={Shield} title="Compliance" text="Review required apprenticeship and employer records." />
          <Action href="/employer/reports" icon={FileText} title="Reports" text="Review hiring and workforce outcomes." />
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: ElementType; label: string; value: string; detail?: string }) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <Icon className="h-6 w-6 text-blue-700" />
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{label}</p>
      {detail && <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>}
    </article>
  );
}

function Action({ href, icon: Icon, title, text }: { href: string; icon: ElementType; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-2xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <Icon className="h-5 w-5 text-blue-700" />
      <h2 className="mt-3 font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
    </Link>
  );
}
