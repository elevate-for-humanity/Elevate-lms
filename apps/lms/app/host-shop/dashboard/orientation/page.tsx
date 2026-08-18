import Link from 'next/link';
import { CheckCircle2, DollarSign, MapPin, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Required Orientation | Host Shop Portal', robots: { index: false, follow: false } };

const modules = [
  ['1. Registered Apprenticeship Basics', 'Understand the sponsor-of-record structure, the Host Shop role, required supervision, and the difference between RTI and paid on-the-job learning.'],
  ['2. Sponsor vs. Host Shop Responsibilities', 'Elevate/2Exclusive administers the registered program. The Host Shop provides approved supervision, a safe workplace, accurate records, wage compliance, competency verification, and required documentation.'],
  ['3. How the Host Shop Makes Money', 'Apprentices can increase legitimate supervised service capacity, customer retention, retail sales, and workforce development value. Revenue is never guaranteed. Apprentice wages, payroll taxes, supplies, insurance, supervision, rent, processing fees, and other overhead remain shop expenses.'],
  ['4. Recruit and Sign Up an Apprentice', 'Send prospective apprentices the canonical Barber Apprenticeship application. Do not create a separate enrollment or promise acceptance. Elevate completes eligibility, enrollment, and program placement.'],
  ['5. Employment, W-2, Commission & Progressive Wages', 'The apprentice is a paid worker. Document the employment/pay structure and follow the registered progressive wage schedule and applicable law. Commission is a compensation method; it does not by itself determine worker classification.'],
  ['6. Payroll and Proof of Pay', 'Maintain payroll records showing the apprentice was paid for employment. Payroll evidence may be used to reconcile approved OJL hours. QuickBooks/payroll setup may be offered separately; core apprenticeship compliance tools remain included.'],
  ['7. 2,000 OJL / 144 RTI Structure', 'Coordinate hands-on training with the Prestige Elevation Barber Curriculum. RTI is the related instruction curriculum; OJL is supervised paid work and competency development at the approved shop.'],
  ['8. Hands-On Teaching', 'Use the Host Shop syllabus to sequence sanitation, consultation, tools, haircutting, shaving/beard services, chemical services, professionalism/business skills, and state-board preparation alongside the apprentice RTI modules.'],
  ['9. Geofenced Timeclock', 'Apprentices must clock in/out using the platform at the approved shop. GPS coordinates are required and the server validates the approved site geofence. Never approve falsified, off-site, duplicate, or otherwise unsupported time.'],
  ['10. Monitor Apprentice Progress', 'Use the Host Shop Board to review active apprentices, OJL totals, attendance, RTI/progress indicators, competencies, documents, and items requiring action.'],
  ['11. Approve Hours & Competencies', 'Review pending OJL entries and approve only hours actually worked at the assigned shop. Reject inaccurate entries with a reason. Supervisor competency sign-off means the apprentice demonstrated the skill to the required standard.'],
  ['12. Transfer Hours', 'Do not promise a transfer-hour amount. Transfer credit is subject to the apprentice program, documented prior training/work, sponsor review, and the rules of the state/jurisdiction governing the apprenticeship. Elevate must approve transfer credit before it changes the apprentice record.'],
  ['13. Documentation & Compliance', 'Keep licenses, insurance, MOU/host-site documents, payroll evidence, attendance, hours, competencies, corrective documentation, and other required records current.'],
  ['14. Final Host Shop Acknowledgment', 'The authorized shop representative must complete the orientation assessment and electronic acknowledgment before Host Shop onboarding is considered complete.'],
] as const;

export default async function HostShopOrientationPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const applicationUrl = '/apply/student?program=barber-apprenticeship';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Required Host Shop Training</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Host Shop Apprenticeship Orientation</h1>
      <p className="mt-3 max-w-3xl text-slate-700">{board.partner?.name || 'Your shop'} must understand and follow these operating requirements before managing apprentices independently.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4"><Users className="h-5 w-5"/><p className="mt-2 font-black">Recruit</p><p className="text-sm text-slate-600">Send the approved application.</p></div>
        <div className="rounded-2xl border bg-white p-4"><MapPin className="h-5 w-5"/><p className="mt-2 font-black">Verify</p><p className="text-sm text-slate-600">Geofenced OJL time.</p></div>
        <div className="rounded-2xl border bg-white p-4"><CheckCircle2 className="h-5 w-5"/><p className="mt-2 font-black">Approve</p><p className="text-sm text-slate-600">Hours and competencies.</p></div>
        <div className="rounded-2xl border bg-white p-4"><DollarSign className="h-5 w-5"/><p className="mt-2 font-black">Pay</p><p className="text-sm text-slate-600">Document wages/payroll.</p></div>
      </div>

      <section className="mt-6 rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-5">
        <h2 className="font-black text-slate-950">Apprentice recruitment link</h2>
        <p className="mt-1 text-sm text-slate-700">Send this link to prospective barber apprentices. Elevate handles the application and enrollment record.</p>
        <Link href={applicationUrl} className="mt-3 inline-flex rounded-xl bg-brand-blue-700 px-4 py-2 font-black text-white">Open apprentice application</Link>
      </section>

      <div className="mt-6 space-y-4">
        {modules.map(([title, body]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">{title}</h2><p className="mt-2 leading-7 text-slate-700">{body}</p></section>)}
      </div>

      <section className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="flex gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-800"/><div><h2 className="font-black text-amber-950">Completion is required</h2><p className="mt-1 text-sm leading-6 text-amber-900">The shop must acknowledge that apprentices are paid workers; revenue is not guaranteed; OJL hours and competency records must be truthful; geofence/time records may not be falsified; transfer credit is sponsor/state controlled; and compensation must follow the registered wage schedule and applicable law.</p></div></div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/host-shop/dashboard/board" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800">Host Shop Board</Link>
        <Link href="/host-shop/dashboard/hours" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800">Review OJL progress</Link>
        <Link href="/host-shop/dashboard/hours/pending" className="rounded-xl bg-brand-green-700 px-4 py-2 font-black text-white">Approve pending hours</Link>
      </div>
    </main>
  );
}
