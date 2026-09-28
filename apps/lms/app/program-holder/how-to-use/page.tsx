import Image from 'next/image';
import Link from 'next/link';
import { Bot, CheckCircle2, CreditCard, DollarSign, PhoneCall, ShieldCheck, Smartphone, Sparkles, Users } from 'lucide-react';
import { ProgramHolderDashboardGuide } from '@/components/program-holder/ProgramHolderDashboardGuide';
import { getProgramHolderWorkspace } from '@/lib/program-holder/workspace';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Start Here | Program Holder Portal',
  description: 'Personalized Program Holder orientation, dashboard walkthrough, responsibilities, pricing, phone, email, and PARIS guide.',
};

const responsibilities = [
  'Call each newly routed applicant, explain the correct next step, and document the outcome and follow-up date.',
  'Confirm whether written funding approval exists. If it does not, explain that the program is self-pay and state the published amount.',
  'Provide a safe, professional training environment and qualified day-to-day supervision.',
  'Deliver the approved curriculum and hands-on training consistently.',
  'Record attendance, training hours, progress, case notes, credentials, and outcome information on time.',
  'Report safety, eligibility, engagement, attendance, or progress concerns promptly.',
  'Protect student information and use it only for approved training activity.',
  'Keep business registration, insurance, W-9, credentials, profile photo, and required agreements current.',
];

const paymentRequirements = [
  'The learner must be officially enrolled, funded when applicable, and started in the approved program.',
  'Payment milestones must match the signed Program Holder agreement; an application or phone call alone does not create a payout.',
  'Attendance, hours, progress, practical skills, credential evidence, and closeout records must be complete and verified.',
  'Elevate must receive and reconcile applicable funding before a funded Program Holder payment can be released.',
  'Missing documents, unverified hours, incomplete closeout records, or compliance concerns can delay payment.',
];

function amount(program: any) {
  if (['nha-ekg-technician', 'nha-ehr', 'nha-billing-coding'].includes(program.slug)) {
    return 'Contact admissions — à-la-carte items';
  }
  const value = Number(program.tuition ?? program.total_cost ?? program.price);
  if (Number.isFinite(value) && value >= 0) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  if (program.is_free === true) return '$0.00';
  return 'Not configured — do not quote';
}

function fundingPath(program: any) {
  const tags = Array.isArray(program.funding_tags) ? program.funding_tags.filter(Boolean) : [];
  if (tags.length) return `Funding may be available: ${tags.join(', ')}. Verify written approval.`;
  if (program.wioa_approved || program.etpl_listed || program.funding_eligible) {
    return 'Funding may be available. Written eligibility and authorization are required.';
  }
  return 'Self-pay unless Elevate documents funding approval.';
}

export default async function ProgramHolderStartHerePage() {
  const data = await getProgramHolderWorkspace();
  const holderName = data.holder?.organization_name || data.holder?.name || 'Your organization';
  const profileName = data.profile?.full_name || 'Program Holder';

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <div className="grid lg:grid-cols-[360px_1fr]">
          <div className="relative min-h-[360px] bg-slate-900">
            <Image src="/images/team/elizabeth-greene-headshot.webp" alt="Elizabeth Greene, Founder and Chief Executive Officer" fill priority sizes="(min-width: 1024px) 360px, 100vw" className="object-cover object-top" />
          </div>
          <div className="p-6 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Welcome {profileName}</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{holderName} Program Holder Orientation</h1>
            <div className="mt-5 space-y-4 text-base leading-7 text-slate-200">
              <p>Your dashboard is the official workspace for routed applicants, enrolled learners, program delivery, communications, compliance, evidence, reporting, and payment readiness.</p>
              <p>Every person in Applicants must be contacted. Confirm the selected program, explain whether verified funding exists or the program is self-pay, state the published amount, schedule the next step, and document the call.</p>
              <p>PARIS can explain the dashboard, open workspaces, identify missing actions, and prepare drafts. You remain responsible for reviewing facts, protecting student information, supervising training, and verifying every submitted record.</p>
            </div>
            <p className="mt-5 text-sm font-bold text-white">— Elizabeth Greene, Founder &amp; Chief Executive Officer</p>
          </div>
        </div>
      </section>

      <ProgramHolderDashboardGuide />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-1 h-8 w-8 shrink-0 text-blue-700" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Your assigned programs</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Published amount and funding conversation</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          These are the programs currently assigned to {holderName}. “Funding may be available” is not an approval. Treat the learner as self-pay until written authorization or a verified voucher appears in the record.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="p-3">Program</th><th className="p-3">Published amount</th><th className="p-3">What to tell the student</th></tr></thead>
            <tbody>
              {(data.programs || []).map((program: any) => (
                <tr key={program.id} className="border-b border-slate-100 align-top">
                  <td className="p-3 font-black">{program.title || program.name}</td>
                  <td className={`p-3 font-black ${amount(program).startsWith('Not configured') || amount(program).startsWith('Contact admissions') ? 'text-rose-700' : 'text-slate-950'}`}>{amount(program)}</td>
                  <td className="max-w-xl p-3 leading-6 text-slate-700">{fundingPath(program)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
          <strong>Buy now, pay later:</strong> for self-pay programs, show the student only the options presented by the official Elevate checkout. Affirm may appear for eligible purchases. Approval, down payment, terms, and payment schedule come from the payment provider. Never promise approval or collect card information by phone.
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <Users className="h-8 w-8 text-blue-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">Applicant and student responsibility</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li><strong>1. Call:</strong> contact every new applicant promptly using the dashboard phone.</li>
            <li><strong>2. Verify:</strong> confirm identity, selected program, availability, and whether funding is documented.</li>
            <li><strong>3. Explain:</strong> funded only after approval; otherwise self-pay at the published amount.</li>
            <li><strong>4. Schedule:</strong> set orientation, intake, training, or a follow-up date.</li>
            <li><strong>5. Document:</strong> save call date, outcome, notes, and the next action in the applicant record.</li>
            <li><strong>6. Monitor:</strong> after enrollment, track attendance, hours, progress, risk, completion, credential, and placement.</li>
          </ol>
        </article>
        <article className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
          <Bot className="h-8 w-8 text-violet-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">How to use PARIS</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li><strong>Navigate:</strong> “Open my applicant queue” or “Show my compliance items.”</li>
            <li><strong>Prioritize:</strong> “Which applicants need a call today?”</li>
            <li><strong>Explain:</strong> “What does payout readiness mean for this record?”</li>
            <li><strong>Draft:</strong> ask for a call outline, follow-up email, meeting agenda, or case-note draft.</li>
            <li><strong>Check:</strong> ask PARIS to identify missing hours, documents, follow-ups, or reports.</li>
          </ul>
          <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">PARIS assists with the work. Review the student record and approve the facts before sending, calling, or submitting anything.</div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
          <Smartphone className="h-8 w-8 text-cyan-800" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">Install the app and use the phone</h2>
          <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
            <li><strong>iPhone/iPad:</strong> open the portal in Safari, tap Share, then Add to Home Screen.</li>
            <li><strong>Android/Chrome:</strong> open the browser menu, choose Install app, and confirm.</li>
            <li>Open Phone, verify your name and extension, allow microphone and notifications, choose a ring mode and work hours, then select Connect phone.</li>
            <li>Place calls from the dialer or applicant call action. Keep the app connected for inbound calls and return missed calls from the task list.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/install" className="inline-flex min-h-11 items-center rounded-xl bg-cyan-800 px-4 text-sm font-black text-white">Install the app</Link>
            <Link href="/program-holder/phone" className="inline-flex min-h-11 items-center rounded-xl border border-cyan-800 bg-white px-4 text-sm font-black text-cyan-900">Open Phone</Link>
          </div>
        </article>
        <article className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
          <PhoneCall className="h-8 w-8 text-indigo-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">AirScript call support</h2>
          <p className="mt-4 text-sm leading-6 text-slate-700">Open AirScript beside the applicant record for an approved live-call opening, voicemail wording, funding and self-pay language, and a post-call documentation checklist.</p>
          <Link href="/program-holder/airscript" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-4 text-sm font-black text-white">Open AirScript</Link>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <ShieldCheck className="h-8 w-8 text-blue-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">Operating responsibilities</h2>
          <ul className="mt-4 space-y-3">{responsibilities.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" /> {item}</li>)}</ul>
          <Link href="/program-holder/sign-mou" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white">Review the complete MOU</Link>
        </article>
        <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <DollarSign className="h-8 w-8 text-emerald-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">Payment readiness</h2>
          <ol className="mt-4 space-y-3">{paymentRequirements.map((item, index) => <li key={item} className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><strong className="mr-2 text-emerald-800">{index + 1}.</strong>{item}</li>)}</ol>
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/program-holder/compliance" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white">Check compliance</Link><Link href="/program-holder/payouts" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700 bg-white px-4 text-sm font-black text-emerald-800">Review payouts</Link></div>
        </article>
      </section>

      <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
        <Sparkles className="h-8 w-8 text-orange-700" />
        <h2 className="mt-3 text-2xl font-black text-slate-950">Keep this orientation available</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Return here whenever you need the complete workflow. The Reference Library contains additional portal documentation.</p>
        <Link href="/program-holder/documentation" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-orange-700 px-4 text-sm font-black text-white">Open the Reference Library</Link>
      </section>
    </div>
  );
}
