import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { PORTAL_MAP, type PortalKey } from '@/lib/routing/portal-map';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portal Switcher | Elevate Admin',
  description: 'Platform administrator access to every canonical Elevate portal.',
  robots: { index: false, follow: false },
};

const LABELS: Record<PortalKey, string> = {
  lms: 'Learner / LMS',
  apprentice: 'Apprentice',
  employer: 'Employer',
  parent: 'Parent',
  workforce: 'Workforce Partner',
  hostshop: 'Host Shop',
  programholder: 'Program Holder',
  creator: 'Creator',
  admin: 'Admin',
  instructor: 'Instructor',
  staff: 'Staff',
  testing: 'Testing Center',
  workforceboard: 'Workforce Board',
  casemanager: 'Case Manager',
  provider: 'Provider',
};

const DESCRIPTIONS: Record<PortalKey, string> = {
  lms: 'Courses, assignments, progress, certificates, and learner operations.',
  apprentice: 'OJL, RTI, competencies, attendance, documents, and apprenticeship progress.',
  employer: 'Hiring, candidates, employer records, apprenticeship and workforce operations.',
  parent: 'Parent or guardian view of linked learner information.',
  workforce: 'Workforce partner participant and service operations.',
  hostshop: 'Host-site apprentices, hour approvals, competencies, documents, and compliance.',
  programholder: 'Program holder programs, students, hours, documents, and compliance.',
  creator: 'Creator product and content workspace.',
  admin: 'Platform administration, settings, operations, analytics, security, and Dev Studio.',
  instructor: 'Instructional delivery, learners, grading, and course operations.',
  staff: 'Staff workflows and operational casework.',
  testing: 'Testing-center, proctoring, exam authorization, and credential operations.',
  workforceboard: 'Workforce-board oversight and participant outcomes.',
  casemanager: 'Case management and participant service workflows.',
  provider: 'Provider programs, learners, documentation, and reporting.',
};

export default async function PortalSwitcherPage() {
  await requireRole(['admin']);
  const entries = Object.entries(PORTAL_MAP) as Array<[PortalKey, (typeof PORTAL_MAP)[PortalKey]]>;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Admin oversight</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">All portals</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Platform Admin can enter every canonical portal without being assigned a fake tenant, shop, employer, learner, or program-holder identity. Scoped portals retain their own data-boundary rules while exposing an admin oversight mode where required.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, portal]) => {
          const href = `${portal.host}${portal.defaultPath}`;
          return (
            <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{portal.subdomain}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{LABELS[key]}</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">Admin access</span>
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{DESCRIPTIONS[key]}</p>
              <p className="mt-3 break-all text-xs font-medium text-slate-500">{href}</p>
              <Link href={href} className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
                Open portal
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
