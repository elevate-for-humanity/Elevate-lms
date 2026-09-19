import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Shop Guides & Agreements | Elevate LMS',
  robots: { index: false, follow: false },
};

const guideSteps = [
  [
    'Confirm apprentices',
    '/host-shop/dashboard/apprentices',
    'Verify each active placement, supervisor, occupation, and start date.',
  ],
  [
    'Set the schedule',
    '/host-shop/dashboard/schedule',
    'Keep supervised training schedules current.',
  ],
  [
    'Record attendance',
    '/host-shop/dashboard/attendance/record',
    'Document attendance against the active placement.',
  ],
  [
    'Review work hours',
    '/host-shop/dashboard/hours/pending',
    'Approve accurate OJL entries and return incorrect entries with a correction note.',
  ],
  [
    'Verify competencies',
    '/host-shop/dashboard/competencies',
    'Record skills only after they are demonstrated under qualified supervision.',
  ],
  [
    'Check wages and reports',
    '/host-shop/dashboard/reports',
    'Review wages, RTI, OJL, attendance, documents, and exceptions each month.',
  ],
] as const;

const handbookSections = [
  {
    title: 'Supervision and safety',
    text: 'Maintain the supervision ratio required by the active registered standard. Provide a safe, lawful workplace and never approve training that was not directly observed or supported by reliable records.',
  },
  {
    title: 'Time, attendance, and geofencing',
    text: 'Apprentices must use the approved time and attendance workflow. Do not falsify, share, bypass, or alter location, clock, attendance, or work records. Return inaccurate entries for correction.',
  },
  {
    title: 'Wages and payroll evidence',
    text: 'Apprentices are paid workers. Follow the applicable registered wage schedule and any higher wage required by law. Keep payroll evidence current and do not treat estimated or unpaid time as verified OJL.',
  },
  {
    title: 'RTI and competency progress',
    text: 'Related technical instruction is separate from work hours. Verify competencies against the active occupation standard; a percentage of hours alone does not prove competency.',
  },
  {
    title: 'Funding and truthful reporting',
    text: 'Workforce reimbursement requires authorization before it is treated as funded. Never bill the same allowable cost to more than one funding source, and report corrections promptly.',
  },
  {
    title: 'Privacy and records',
    text: 'Use learner information only for authorized training operations. Keep the MOU, licenses, insurance, supervisor records, payroll evidence, attendance, OJL, RTI, and corrective records current in the portal.',
  },
] as const;

export default async function HostShopResourcesPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const shopName = board.partner?.name || board.shops[0]?.name || 'Host Shop';
  const programs = board.registeredPrograms.map(
    (program) => `${program.label} · RAPIDS ${program.rapidsCode}`,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
        Host Shop resource center
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Guides, handbook, and agreements</h1>
      <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-700">
        These resources belong to <strong>{shopName}</strong>. They use the same verified shop,
        placements, programs, and compliance record as the rest of this portal.
      </p>
      {programs.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {programs.map((program) => (
            <span
              key={program}
              className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-950"
            >
              {program}
            </span>
          ))}
        </div>
      ) : null}

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResourceCard
          icon={BookOpen}
          title="Host Shop user guide"
          detail="Follow the daily and weekly portal workflow below."
          href="#user-guide"
          action="Read guide"
        />
        <ResourceCard
          icon={ClipboardList}
          title="Host Shop handbook"
          detail="Review supervision, safety, payroll, reporting, and privacy requirements."
          href="#handbook"
          action="Read handbook"
        />
        <ResourceCard
          icon={FileSignature}
          title="Current MOU"
          detail={
            board.partner?.mou_signed
              ? 'A signed MOU is recorded for this Host Shop.'
              : 'Review and sign the current Host Shop MOU.'
          }
          href="/host-shop/onboarding/mou"
          action={board.partner?.mou_signed ? 'View MOU status' : 'Review and sign MOU'}
          complete={Boolean(board.partner?.mou_signed)}
        />
        <ResourceCard
          icon={FileText}
          title="Compliance documents"
          detail={`${board.acceptedDocumentCount}/${board.requiredDocumentCount} required documents accepted.`}
          href="/host-shop/dashboard/documents"
          action="Open documents"
          complete={board.documentsComplete}
        />
      </section>

      <section
        id="user-guide"
        className="mt-8 scroll-mt-24 rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8"
      >
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-7 w-7 shrink-0 text-blue-800" />
          <div>
            <h2 className="text-2xl font-black text-slate-950">Host Shop user guide</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
              Use these steps for every apprentice. Each link opens the shop-isolated operational
              record.
            </p>
          </div>
        </div>
        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {guideSteps.map(([title, href, text], index) => (
            <li key={title}>
              <Link
                href={href}
                className="block h-full rounded-2xl border border-blue-200 bg-white p-4 hover:border-blue-500 hover:shadow-sm"
              >
                <h3 className="font-black text-slate-950">
                  {index + 1}. {title}
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{text}</p>
              </Link>
            </li>
          ))}
        </ol>
        <Link
          href="/host-shop/orientation"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-5 py-3 font-black text-white hover:bg-blue-900"
        >
          Open required orientation
        </Link>
      </section>

      <section
        id="handbook"
        className="mt-8 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-2xl font-black text-slate-950">Host Shop operating handbook</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
              The MOU and active registered-program standard control if any summary below conflicts
              with a signed or governing requirement.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {handbookSections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="font-black text-slate-950">{section.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{section.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ResourceCard({
  icon: Icon,
  title,
  detail,
  href,
  action,
  complete = false,
}: {
  icon: typeof BookOpen;
  title: string;
  detail: string;
  href: string;
  action: string;
  complete?: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Icon className="h-6 w-6 text-blue-800" />
        {complete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-900">
            <CheckCircle2 className="h-3.5 w-3.5" /> Current
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 font-black text-slate-950">{title}</h2>
      <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-700">{detail}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-black text-white hover:bg-slate-800"
      >
        {action}
      </Link>
    </article>
  );
}
