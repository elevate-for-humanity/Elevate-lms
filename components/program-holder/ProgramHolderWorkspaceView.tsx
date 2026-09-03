import Link from 'next/link';
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
    { label: 'Course delivery assignment', complete: data.courseAssignments.length > 0 },
  ];
  const complianceScore = Math.round(
    (complianceItems.filter((item) => item.complete).length / complianceItems.length) * 100,
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
      />
    );
  if (section === 'payouts')
    return <Payouts schedules={data.payoutSchedules} panel={payoutPanel} />;
  if (section === 'settings') return <Settings holder={data.holder} />;

  return (
    <div className="space-y-8">
      <Hero
        eyebrow="Program Holder Portal"
        title={data.holder?.organization_name || data.holder?.name || 'Program Holder'}
        description={
          isHvac
            ? 'Your HVAC Certification program, enrolled students, training progress, and compliance requirements are connected below.'
            : 'Your programs, enrolled students, training progress, and compliance requirements are connected below.'
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Enrolled Students"
          value={data.enrollments.length}
          helper="Canonical program enrollments"
        />
        <Metric label="Active Students" value={active.length} helper="Currently enrolled in HVAC" />
        <Metric label="At-Risk Students" value={atRisk.length} helper="Flagged for follow-up" />
        <Metric
          label="Pending Verifications"
          value={pendingHours.length}
          helper="Training-hour reviews"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Enrolled HVAC students</h2>
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
    <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-7 text-white shadow-lg">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50 sm:text-base">
        {description}
      </p>
    </section>
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
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3">Student</th>
            <th className="px-3 py-3">Program</th>
            <th className="px-3 py-3">Enrollment</th>
            <th className="px-3 py-3">Progress</th>
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
                <td className="px-3 py-4 text-xs">
                  <span className="block">Start: {row.training_start_date || 'Missing'}</span>
                  <span className="block">End: {row.training_end_date || 'Missing'}</span>
                </td>
                <td className="px-3 py-4">{row.next_required_action || 'Continue training'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                No confirmed student enrollments are linked.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
          <summary className="flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-4 font-bold">
            Filter
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border bg-white p-2 shadow-xl">
            <Link
              className="block rounded-lg px-3 py-2 hover:bg-slate-50"
              href="/program-holder/students"
            >
              All
            </Link>
            <Link
              className="block rounded-lg px-3 py-2 hover:bg-slate-50"
              href="/program-holder/students?status=active"
            >
              Active
            </Link>
          </div>
        </details>
        <Link
          href="/program-holder/students/pending"
          className="flex min-h-11 items-center rounded-xl bg-amber-100 px-4 font-bold text-amber-900"
        >
          View Applicants
        </Link>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <EnrollmentTable rows={rows} programs={programs} />
      </section>
      <ProgramHolderStudentCloseoutForm enrollments={rows} />
    </div>
  );
}
function Applicants({ rows, programs }: { rows: any[]; programs: any[] }) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Enrollment Pipeline"
        title="Pending Students"
        description="These people have applied but are not counted as enrolled until a canonical enrollment is created."
      />
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-black text-amber-950">{rows.length} applicants require review</p>
        <p className="mt-1 text-sm text-amber-900">
          Review eligibility and enrollment requirements in Admin before activating a student.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Applicant</th>
                <th className="p-3">Program</th>
                <th className="p-3">Status</th>
                <th className="p-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="p-3">
                    <p className="font-bold">{row.applicant_name || 'Applicant'}</p>
                    <p className="text-xs text-slate-500">{row.applicant_email || ''}</p>
                  </td>
                  <td className="p-3">{programTitle(programs, row.program_id)}</td>
                  <td className="p-3 capitalize">
                    {row.application_status || row.status || 'pending'}
                  </td>
                  <td className="p-3">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Programs({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Program Delivery"
        title="HVAC Program"
        description="Review approved program ownership, delivery readiness, credentials, and course assignments."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {data.programs.map((program: any) => {
          const courses = data.courseAssignments.filter(
            (item: any) => item.program_id === program.id,
          );
          return (
            <article
              key={program.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <BookOpen className="h-7 w-7 text-blue-700" />
              <h2 className="mt-3 text-2xl font-black">{program.title || program.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {program.slug} · {program.is_active ? 'Active' : program.status || 'Inactive'}
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <Row
                  label="Credential"
                  value={program.credential_name || 'EPA 608 / HVAC credential pathway'}
                />
                <Row
                  label="Program hours"
                  value={
                    program.duration_hours
                      ? String(program.duration_hours)
                      : 'Review program record'
                  }
                />
                <Row label="Course assignments" value={String(courses.length)} />
              </dl>
              {!courses.length && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                  HVAC is assigned, but no delivery course is connected yet.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
function Hours({
  rows,
  programs,
  enrollments,
}: {
  rows: any[];
  programs: any[];
  enrollments: any[];
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Training Operations"
        title="Training Hours"
        description="Record what each student completed daily or weekly, enter training hours, and submit progress for Admin review."
      />
      <ProgramHolderTrainingLogForm enrollments={enrollments} programs={programs} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Submitted training logs</h2>
        <p className="mt-1 text-sm text-slate-600">
          Admin can review every submitted entry. Entries remain read-only after submission.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Date</th>
                <th className="p-3">Student</th>
                <th className="p-3">Program</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Work completed</th>
                <th className="p-3">Approval</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="p-3">{row.work_date || '—'}</td>
                    <td className="p-3 font-semibold">
                      {enrollments.find((item) => item.user_id === row.user_id)?.full_name ||
                        'Student'}
                    </td>
                    <td className="p-3">{programTitle(programs, null, row.program_slug)}</td>
                    <td className="p-3 font-bold">{row.hours_claimed ?? row.hours ?? 0}</td>
                    <td className="max-w-md p-3 text-slate-700">{row.notes || '—'}</td>
                    <td className="p-3 capitalize">
                      {row.approval_status || row.status || 'pending'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No training logs have been submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Compliance({
  score,
  items,
  atRisk,
}: {
  score: number;
  items: { label: string; complete: boolean }[];
  atRisk: number;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Program Oversight"
        title="Compliance"
        description="Track the operational requirements that keep the HVAC program ready for delivery and reporting."
      />
      <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-500">Compliance Score</p>
          <p className="mt-2 text-5xl font-black text-blue-700">{score}%</p>
          <p className="mt-3 text-sm text-slate-600">
            {atRisk} enrolled students currently flagged at risk.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Requirements</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <span className="font-semibold">{item.label}</span>
                {item.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
function Documents({ rows }: { rows: any[] }) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Compliance Records"
        title="Documents"
        description="Upload and track protected Program Holder onboarding records for HVAC delivery and payment readiness."
      />
      <ProgramHolderDocumentUpload />
      <ProgramHolderAcknowledgements />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Document register</h2>
        <div className="mt-4 space-y-3">
          {rows.length ? (
            rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-xl border p-4">
                <FileText className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="font-bold">
                    {row.document_type || row.file_name || 'Program document'}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{row.status || 'submitted'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
              No Program Holder documents are on file. Use the protected upload above to submit
              onboarding records for review.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function Reports({
  rows,
  enrolled,
  active,
  completed,
}: {
  rows: any[];
  enrolled: number;
  active: number;
  completed: number;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Outcomes & Reporting"
        title="Reports"
        description="Enrollment and completion figures are generated from David’s canonical HVAC enrollment records."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total Enrolled" value={enrolled} helper="Confirmed enrollments" />
        <Metric label="Currently Active" value={active} helper="In training" />
        <Metric label="Completed" value={completed} helper="Program completions" />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Submitted reports</h2>
        <p className="mt-2 text-sm text-slate-600">
          {rows.length
            ? `${rows.length} reports are on file.`
            : 'No submitted Program Holder reports are on file.'}
        </p>
      </section>
    </div>
  );
}
function Payouts({ schedules, panel }: { schedules: any[]; panel?: React.ReactNode }) {
  const pending = schedules.reduce(
    (sum, row) =>
      sum +
      (row.increment_1_status === 'paid' ? 0 : Number(row.increment_1_cents || 0)) +
      (row.increment_2_status === 'paid' ? 0 : Number(row.increment_2_cents || 0)),
    0,
  );
  const paid = schedules.reduce(
    (sum, row) =>
      sum +
      (row.increment_1_status === 'paid' ? Number(row.increment_1_cents || 0) : 0) +
      (row.increment_2_status === 'paid' ? Number(row.increment_2_cents || 0) : 0),
    0,
  );
  const usd = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Payments & Reconciliation"
        title="Payouts"
        description="Connect a secure payout destination, review scheduled funds, and access released balances. QuickBooks records approved payments separately for accounting."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Scheduled" value={usd(pending)} helper="Not yet marked paid" />
        <Metric label="Paid" value={usd(paid)} helper="Completed payout increments" />
        <Metric
          label="Payout schedules"
          value={schedules.length}
          helper="Enrollment-linked schedules"
        />
      </section>
      {panel}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Release schedule</h2>
        <p className="mt-2 text-sm text-slate-600">
          Funds become available only after Elevate receives and approves the corresponding funding
          payment. Connecting a card does not release unapproved funds.
        </p>
        {!schedules.length ? (
          <div className="mt-5 rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
            No funds have been loaded or scheduled yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {schedules.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 rounded-xl border border-slate-200 p-4 sm:grid-cols-3"
              >
                <span className="font-bold">{usd(Number(row.total_payout_cents || 0))}</span>
                <span className="text-sm capitalize">
                  First: {row.increment_1_status || 'pending'}
                </span>
                <span className="text-sm capitalize">
                  Second: {row.increment_2_status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function Settings({ holder }: { holder: any }) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Account Configuration"
        title="Settings"
        description="Review the Program Holder account and connected operational services."
      />
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Organization</h2>
          <dl className="mt-4 space-y-3">
            <Row
              label="Name"
              value={holder?.organization_name || holder?.name || 'Program Holder'}
            />
            <Row label="Account status" value={holder?.status || 'Unknown'} />
            <Row
              label="Internal LMS"
              value={holder?.is_using_internal_lms ? 'Connected' : 'Not connected'}
            />
            <Row label="Payout setup" value={holder?.payout_status || 'Not started'} />
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">QuickBooks accounting parallel</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The portal is ready for payout and revenue reconciliation. QuickBooks must be connected
            before accounting balances or sync status can be shown.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
            Connection required
          </span>
        </div>
      </section>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-bold text-right">{value}</dd>
    </div>
  );
}
function AdminBoundary() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <ShieldCheck className="h-8 w-8 text-blue-700" />
      <h1 className="mt-4 text-3xl font-black">Program Holder administrator preview</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Select a Program Holder in Admin or use the audited support preview to inspect a
        holder-scoped workspace. No learner data is attached to the administrator session.
      </p>
      <Link
        href="https://admin.elevateforhumanity.org/program-holders"
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
      >
        Open Program Holder management
      </Link>
    </div>
  );
}
