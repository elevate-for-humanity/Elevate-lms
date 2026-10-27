import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Reference Library | Program Holder Portal',
  description: 'Reference guide for every Program Holder dashboard tab.',
};

const references = [
  ['Dashboard', '/program-holder/dashboard', 'Daily command center', 'Start here each day to see urgent agreements, readiness, student activity, compliance gaps, and payout status.'],
  ['Students', '/program-holder/students', 'Active learner roster', 'Review assigned students, training state, contact actions, progress, risk indicators, and completion work.'],
  ['Pending', '/program-holder/students/pending', 'Applicant follow-up', 'Work only the applicants released to your organization and record call dates and outcomes.'],
  ['At-Risk', '/program-holder/students/at-risk', 'Student intervention', 'Identify learners who need attendance, engagement, academic, or completion support.'],
  ['Grades', '/program-holder/grades', 'Learning performance', 'Review academic progress and use it with attendance and hands-on evidence—not as the only readiness measure.'],
  ['Create Course', '/program-holder/courses/create', 'Approved course authoring', 'Create training content for review while preserving assigned program and compliance requirements.'],
  ['Documents', '/program-holder/documents', 'Protected evidence', 'Upload current organization, instructor, student, training, and closeout documentation.'],
  ['Verification', '/program-holder/verification', 'Approval status', 'Confirm which business, instructor, facility, and program requirements have been verified.'],
  ['Compliance', '/program-holder/compliance', 'Readiness checklist', 'Resolve missing agreements, credentials, insurance, W-9, evidence, and closeout requirements.'],
  ['MOU', '/program-holder/mou', 'Partnership terms', 'Review responsibilities, confidentiality, reporting, payment milestones, and the signed agreement.'],
  ['Reports', '/program-holder/reports', 'Funding and outcomes reporting', 'Submit accurate enrollment, hours, progress, credential, completion, and placement information.'],
  ['Campaigns', '/program-holder/campaigns', 'Approved outreach', 'Prepare and track program communications. Review recipients and content before Paris sends.'],
  ['Notifications', '/program-holder/notifications', 'Action alerts', 'Review system, student, compliance, delivery, and operational notifications.'],
  ['Start Here', '/program-holder/how-to-use', 'Orientation and walkthrough', 'Replay the Paris dashboard walkthrough and review Elizabeth Greene’s expectations.'],
  ['Documentation', '/program-holder/documentation', 'Reference library', 'Return here whenever you need to understand a tab or workflow.'],
  ['Support', '/program-holder/support', 'Escalation and help', 'Request assistance when records, access, student safety, compliance, or payment readiness need review.'],
  ['Employer Workspace', '/employer/dashboard', 'Employment connections', 'Use employer tools only when your assigned role includes job, employer, or placement activity.'],
  ['Settings', '/program-holder/settings', 'Profile and alerts', 'Maintain your profile and choose enrollment and Paris delivery notifications by email or text.'],
];

export default function ProgramHolderDocumentationPage() {
  return (
    <div className="space-y-7">
      <header className="rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Program Holder Reference Library</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Every dashboard tab, explained</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
          Use this library to understand where work belongs, what each tab controls, and when a record affects compliance or payment readiness.
        </p>
        <Link href="/program-holder/how-to-use" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 text-sm font-black text-slate-950">Replay the walkthrough</Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {references.map(([name, href, purpose, description]) => (
          <article id={name.toLowerCase().replaceAll(' ', '-')} key={href} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BookOpen className="h-6 w-6 text-blue-700" />
            <h2 className="mt-3 text-xl font-black text-slate-950">{name}</h2>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-blue-700">{purpose}</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
            <Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-slate-950 px-4 text-sm font-black text-white">
              Open {name} <ExternalLink className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        <strong>Recordkeeping rule:</strong> enter accurate information in the correct tab as work happens. Do not wait until payment or an audit is pending to reconstruct attendance, hours, case notes, credentials, or completion evidence.
      </aside>
    </div>
  );
}
