import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { getProgramHolderWorkspace, programTitle } from '@/lib/program-holder/workspace';
import { ProgramHolderDocumentUpload } from './ProgramHolderDocumentUpload';
import { ProgramHolderTrainingLogForm } from './ProgramHolderTrainingLogForm';
import { ProgramHolderStudentCloseoutForm } from './ProgramHolderStudentCloseoutForm';
import { ProgramHolderAcknowledgements } from './ProgramHolderAcknowledgements';
import { ProgramHolderNotificationPreferences } from './ProgramHolderNotificationPreferences';
import { WorkOneOutreachButton } from './WorkOneOutreachButton';
import { AlumniCareerOutreachButton } from './AlumniCareerOutreachButton';
import { getProgramCardImage } from '@/lib/images/programImages';

type Section =
  | 'dashboard'
  | 'students'
  | 'pending'
  | 'programs'
  | 'hours'
  | 'compliance'
  | 'documents'
  | 'reports'
  | 'payouts'
  | 'settings';

export async function ProgramHolderWorkspaceView({
  section,
  payoutPanel,
}: {
  section: Section;
  payoutPanel?: React.ReactNode;
}) {
  const data = await getProgramHolderWorkspace();
  if (data.mode === 'admin') return <AdminBoundary />;

  const active = data.enrollments.filter((row) =>
    ['active', 'enrolled', 'in_progress'].includes(row.enrollment_state || row.status),
  );
  const completed = data.enrollments.filter((row) =>
    ['completed', 'graduated'].includes(row.enrollment_state || row.status),
  );
  const incompleteBackWork = completed.filter((row) =>
    Number(row.total_hours_completed || 0) < 48 ||
    !row.training_start_date ||
    !row.training_end_date ||
    !row.lms_completed ||
    !row.practical_skills_verified,
  );
  const atRisk = data.enrollments.filter((row) => row.at_risk);
  const pendingHours = data.hours.filter((row) =>
    ['pending', 'submitted'].includes(row.approval_status || row.status),
  );
  const isHvac = data.programs.some((program) => program.slug === 'hvac-technician');
  const complianceItems = [
    {
      label: 'Program-holder approval',
      complete: ['active', 'approved'].includes(data.holder?.status),
    },
    { label: 'Memorandum of Understanding', complete: Boolean(data.holder?.mou_signed) },
    { label: 'HVAC program assignment', complete: isHvac },
    {
      label: 'HVAC license or instructor credential',
      complete: !isHvac || Boolean(data.holder?.hvac_license_url),
    },
    { label: 'Required program documents', complete: data.documents.length > 0 },
    {
      label: 'Profile picture',
      complete: Boolean(data.profile?.avatar_url) || data.documents.some((row) => row.document_type === 'profile_photo'),
    },
    {
      label: 'Student photos and training videos',
      complete: data.documents.some((row) => ['student_photo', 'student_video'].includes(row.document_type)),
    },
    { label: 'Graduated-student back work and 48-hour sign-offs', complete: incompleteBackWork.length === 0 },
    { label: 'Course delivery assignment', complete: data.courseAssignments.length > 0 },
  ];
  const complianceScore = Math.round(
    (complianceItems.filter((item) => item.complete).length / complianceItems.length) * 100,
  );
  const completedRequirements = complianceItems.filter((item) => item.complete).length;
  const missingRequirements = complianceItems.length - completedRequirements;
  const primaryProgramLabel = data.programs[0]?.title || data.programs[0]?.name || 'Assigned program';
  const callQueue = data.applicants.filter((row) => !row.call_date || !row.call_outcome);
  const payoutReady = Boolean(
    data.payoutProfile?.payouts_enabled &&
    data.payoutProfile?.transfers_enabled &&
    data.payoutProfile?.verification_status === 'active',
  );

  if (section === 'students')
    return <Students title="Enrolled Students" rows={data.enrollments} programs={data.programs} />;
  if (section === 'pending') return <Applicants rows={data.applicants} programs={data.programs} />;
  if (section === 'programs') return <Programs data={data} />;
  if (section === 'hours')
    return <Hours rows={data.hours} programs={data.programs} enrollments={data.enrollments} />;
  if (section === 'compliance')
    return <Compliance score={complianceScore} items={complianceItems} atRisk={atRisk.length} />;
  if (section === 'documents') return <Documents rows={data.documents} />;
  if (section === 'reports')
    return (
      <Reports
        rows={data.reports}
        enrolled={data.enrollments.length}
        active={active.length}
        completed={completed.length}
        programLabel={primaryProgramLabel}
      />
    );
  if (section === 'payouts')
    return <Payouts schedules={data.payoutSchedules} panel={payoutPanel} />;
  if (section === 'settings') return <Settings holder={data.holder} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHero
        title={data.holder?.organization_name || data.holder?.name || 'Program Holder'}
        programLabel={primaryProgramLabel}
        status={data.holder?.status || 'active'}
        complianceScore={complianceScore}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Enrolled Students"
          value={data.enrollments.length}
          helper="Canonical program enrollments"
        />
        <Metric label="Active Students" value={active.length} helper={`Currently enrolled in ${primaryProgramLabel}`} />
        <Metric label="At-Risk Students" value={atRisk.length} helper="Flagged for follow-up" />
        <Metric
          label="Pending Verifications"
          value={pendingHours.length}
          helper="Training-hour reviews"
        />
      </section>
      {(!payoutReady || missingRequirements > 0) && (
        <section role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Payment action required</p>
              <h2 className="mt-1 text-xl font-black text-red-950">Complete setup before Elevate can release payment</h2>
              <p className="mt-2 text-sm leading-6 text-red-900">{missingRequirements} onboarding requirements remain incomplete. {payoutReady ? 'Your payout account is connected.' : 'Your debit card or bank account is not ready for payouts.'}</p>
              <p className="mt-2 rounded-xl bg-red-100 p-3 text-sm font-black text-red-950">You will not be able to receive funds until every required to-do below is completed and approved.</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {complianceItems.filter((item) => !item.complete).map((item) => (
                  <li key={item.label} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white p-3 text-sm font-bold text-red-950">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" /> {item.label}
                  </li>
                ))}
                {!payoutReady && <li className="flex items-center gap-2 rounded-lg border border-red-200 bg-white p-3 text-sm font-bold text-red-950"><AlertTriangle className="h-4 w-4 shrink-0 text-red-700" /> Debit card or bank payout account</li>}
              </ul>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href="/program-holder/documents" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white">Complete documents</Link>
                <Link href="/program-holder/compliance" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-black text-red-900">Review every requirement</Link>
                <Link href="/program-holder/payouts" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-black text-red-900">Add debit card or bank</Link>
                {incompleteBackWork.length > 0 && <Link href="/program-holder/students" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-black text-red-900">Complete prior student records</Link>}
              </div>
            </div>
          </div>
        </section>
      )}
      <section aria-labelledby="program-holder-actions-heading">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Your workspace</p>
          <h2 id="program-holder-actions-heading" className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
            Run the program from one place
          </h2>
          <p className="mt-1 text-sm text-slate-600">Open the work that needs attention without searching through the menu.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ActionLink href="/program-holder/students/pending" icon={<Users className="h-5 w-5" />} title="Review applicants" detail={`${data.applicants.length} waiting for review`} tone="amber" />
          <ActionLink href="/program-holder/hours" icon={<Clock className="h-5 w-5" />} title="Record training" detail={`${pendingHours.length} logs awaiting verification`} tone="blue" />
          <ActionLink href="/program-holder/documents" icon={<FileText className="h-5 w-5" />} title="Complete documents" detail={`${data.documents.length} documents on file`} tone="violet" />
          <ActionLink href="/program-holder/compliance" icon={<ShieldCheck className="h-5 w-5" />} title="Resolve compliance" detail={`${missingRequirements} requirements incomplete`} tone="emerald" />
          <ActionLink href="/program-holder/programs" icon={<BookOpen className="h-5 w-5" />} title="Open program delivery" detail={`${data.courseAssignments.length} course assignments`} tone="blue" />
          <ActionLink href="/program-holder/payouts" icon={<CheckCircle2 className="h-5 w-5" />} title="Manage payouts" detail={String(data.holder?.payout_status || 'Setup required').replaceAll('_', ' ')} tone="emerald" />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Program readiness</h2>
              <p className="mt-1 text-sm text-slate-600">{completedRequirements} of {complianceItems.length} requirements complete.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-800">{complianceScore}%</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {complianceItems.map((item) => (
              <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 p-3">
                {item.complete ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
                <span className="min-w-0 text-sm font-bold text-slate-800">{item.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Next best action</p>
          <h2 className="mt-2 text-xl font-black">Finish onboarding for payment readiness</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Upload required business and training records, complete acknowledgements, and connect the delivery course before funds can be released.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/program-holder/documents" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">Upload documents</Link>
            <Link href="/program-holder/compliance" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-sm font-black text-white">View requirements</Link>
          </div>
        </article>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Call and enrollment queue</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">People who still need follow-up</h2>
              <p className="mt-1 text-sm text-slate-600">{callQueue.length} applicants have no completed call outcome and {data.applicants.length} are not enrolled.</p>
            </div>
            <Link href="/program-holder/students/pending" className="inline-flex min-h-10 items-center rounded-xl bg-amber-100 px-4 py-2 text-sm font-black text-amber-950">Open full queue</Link>
            <WorkOneOutreachButton count={data.applicants.length} />
          </div>
          <div className="mt-4 grid gap-2">
            {callQueue.slice(0, 6).map((row) => (
              <div key={row.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-black text-slate-950">{row.applicant_name || 'Applicant'}</p>
                  <p className="break-all text-xs text-slate-500">{row.applicant_email || 'No email on file'}</p>
                  <p className="mt-1 text-xs font-bold text-slate-700">{row.applicant_phone || 'No phone on file'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-800">Not enrolled</span>
                  {row.applicant_email && <a href={`mailto:${row.applicant_email}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-900">Email</a>}
                  {row.applicant_phone ? <a href={`tel:${row.applicant_phone}`} className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">Call</a> : <span className="text-xs font-bold text-slate-500">Phone missing</span>}
                </div>
              </div>
            ))}
            {!callQueue.length && <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Every applicant has a recorded call outcome.</p>}
          </div>
        </article>
        <div className="min-w-0">{payoutPanel}</div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Current semester</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Current and incoming students</h2>
          <p className="mt-1 text-sm text-slate-600">Only names and training dates are shown here. Voucher and funding documents remain private.</p>
          <div className="mt-4 grid gap-2">
            {data.upcomingEnrollments.length ? data.upcomingEnrollments.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-slate-950">{row.full_name || 'Incoming student'}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${row.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {row.status === 'active' ? 'In progress' : 'Starting soon'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">Start: {row.training_start_date || row.student_start_date || row.start_date || 'Not set'} · End: {row.training_end_date || row.expected_end_date || 'Not set'}</p>
              </div>
            )) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No current or future-dated enrollments are linked yet.</p>}
          </div>
        </article>
        <ProgramHolderNotificationPreferences initial={data.notificationPreferences} phone={data.profile?.phone || data.holder?.contact_phone || ''} />
      </section>
      <section aria-labelledby="program-holder-programs-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="program-holder-programs-heading" className="text-xl font-black text-slate-950">
              Your programs
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Approved training pathways connected to this Program Holder account.
            </p>
          </div>
          <Link href="/program-holder/programs" className="text-sm font-bold text-blue-700">
            View details
          </Link>
        </div>
        <ProgramCards programs={data.programs} courseAssignments={data.courseAssignments} compact />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Enrolled {primaryProgramLabel} students</h2>
              <p className="mt-1 text-sm text-slate-600">
                Only confirmed enrollments appear here. Applicants stay in the separate Applicants
                queue.
              </p>
            </div>
            <Link
              href="/program-holder/students"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white"
            >
              Manage Students
            </Link>
            <AlumniCareerOutreachButton count={completed.length} />
          </div>
          <EnrollmentTable rows={data.enrollments.slice(0, 8)} programs={data.programs} />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-black">Compliance Score</h2>
              <span className="text-2xl font-black text-blue-700">{complianceScore}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-700"
                style={{ width: `${complianceScore}%` }}
              />
            </div>
            <Link
              href="/program-holder/compliance"
              className="mt-4 inline-flex text-sm font-bold text-blue-700"
            >
              Review requirements
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-black">Required actions</h2>
            <p className="mt-2 text-sm text-slate-600">
              {data.applicants.length} applicants awaiting enrollment review · {pendingHours.length}{' '}
              hour entries awaiting verification.
            </p>
            <Link
              href="/program-holder/reports"
              className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
            >
              Submit Reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Hero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-5 text-white shadow-lg sm:rounded-3xl sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{eyebrow}</p>
      <h1 className="mt-2 break-words text-2xl font-black sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50 sm:text-base">
        {description}
      </p>
    </section>
  );
}

function DashboardHero({ title, programLabel, status, complianceScore }: { title: string; programLabel: string; status: string; complianceScore: number }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl sm:rounded-3xl">
      <Image src="/images/trades/hero-program-hvac.jpg" alt="HVAC technician training workspace" fill priority sizes="100vw" className="object-cover object-center opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-blue-950/60" />
      <div className="relative grid gap-5 p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Program Holder Command Center</p>
          <h1 className="mt-2 break-words text-2xl font-black leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-200 sm:text-base">Manage enrollment, instruction, compliance, records, reporting, and payouts for {programLabel}.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-emerald-100">Account {status.replaceAll('_', ' ')}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-white">{programLabel}</span>
            <span className="rounded-full bg-blue-400/20 px-3 py-1.5 text-blue-100">Compliance {complianceScore}%</span>
          </div>
        </div>
        <Link href="/program-holder/hours" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm sm:w-auto">Record training hours</Link>
      </div>
    </section>
  );
}

function ActionLink({ href, icon, title, detail, tone }: { href: string; icon: React.ReactNode; title: string; detail: string; tone: 'amber' | 'blue' | 'violet' | 'emerald' }) {
  const colors = { amber: 'bg-amber-50 text-amber-800', blue: 'bg-blue-50 text-blue-800', violet: 'bg-violet-50 text-violet-800', emerald: 'bg-emerald-50 text-emerald-800' };
  return (
    <Link href={href} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-slate-950">{title}</span>
        <span className="block truncate text-sm text-slate-600">{detail}</span>
      </span>
      <span aria-hidden="true" className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700">→</span>
    </Link>
  );
}
function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 font-bold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </article>
  );
}

function EnrollmentTable({ rows, programs }: { rows: any[]; programs: any[] }) {
  return (
    <div className="mt-5 min-w-0">
      <div className="grid gap-3 md:hidden">
        {rows.length ? rows.map((row) => (
          <article key={row.id} data-testid="student-card" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-black text-slate-950">{row.full_name || 'Student'}</p>
                <p className="break-all text-xs text-slate-500">{row.email || ''}</p>
              </div>
              <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-800">{Number(row.progress_percent || 0)}%</span>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <Row label="Program" value={programTitle(programs, row.program_id, row.program_slug)} />
              <Row label="Enrollment" value={String(row.enrollment_state || row.status || 'enrolled').replaceAll('_', ' ')} />
              <Row label="Training" value={`${row.training_start_date || 'Start missing'} — ${row.training_end_date || 'End missing'}`} />
              <Row label="Next action" value={row.next_required_action || 'Continue training'} />
              <Row label="WorkOne hours" value={`${Math.min(48, Number(row.total_hours_completed || 0))} of 48 complete`} />
            </dl>
            <Link href="/program-holder/hours" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white">Record progress</Link>
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No confirmed student enrollments are linked.</div>
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3">Student</th>
            <th className="px-3 py-3">Program</th>
            <th className="px-3 py-3">Enrollment</th>
            <th className="px-3 py-3">Progress</th>
            <th className="px-3 py-3">WorkOne hours</th>
            <th className="px-3 py-3">Training dates</th>
            <th className="px-3 py-3">Next action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} data-testid="student-row">
                <td className="px-3 py-4">
                  <p className="font-bold">{row.full_name || 'Student'}</p>
                  <p className="text-xs text-slate-500">{row.email || ''}</p>
                </td>
                <td className="px-3 py-4">
                  {programTitle(programs, row.program_id, row.program_slug)}
                </td>
                <td className="px-3 py-4 capitalize">
                  {String(row.enrollment_state || row.status || 'enrolled').replaceAll('_', ' ')}
                </td>
                <td className="px-3 py-4 font-bold">{Number(row.progress_percent || 0)}%</td>
                <td className="px-3 py-4 font-bold">{Math.min(48, Number(row.total_hours_completed || 0))} / 48</td>
                <td className="px-3 py-4 text-xs">
                  <span className="block">Start: {row.training_start_date || 'Missing'}</span>
                  <span className="block">End: {row.training_end_date || 'Missing'}</span>
                </td>
                <td className="px-3 py-4">{row.next_required_action || 'Continue training'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                No confirmed student enrollments are linked.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function Students({ title, rows, programs }: { title: string; rows: any[]; programs: any[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const finalWeek = rows.filter(
    (row) =>
      row.training_end_date && row.training_end_date >= today && row.training_end_date <= sevenDays,
  );
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Student Management"
        title={title}
        description="This roster uses canonical enrollments. Application leads are not counted as enrolled students."
      />
      {finalWeek.length > 0 && (
        <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-black text-amber-950">Final-week completion alert</p>
          <p className="mt-1 text-sm text-amber-900">
            {finalWeek.map((row) => row.full_name || 'Student').join(', ')}{' '}
            {finalWeek.length === 1 ? 'is' : 'are'} in the last week of training. Complete the
            closeout before payment can be released.
          </p>
        </section>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Search students"
          placeholder="Search students"
          className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4"
        />
        <details className="relative">
