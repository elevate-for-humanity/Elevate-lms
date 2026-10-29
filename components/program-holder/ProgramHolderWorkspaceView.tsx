import { hasRecruitingAssignment } from '@/lib/program-holder/recruiting-access';
import { TestingReadinessForm } from './TestingReadinessForm';
import { PortalStartChecklist } from '@/components/portal/PortalStartChecklist';
import { CommunicationTodos } from '@/components/communications/CommunicationTodos';
import { ProgramHolderPaymentAddendum } from './ProgramHolderPaymentAddendum';
import { filterHolderStudents } from '@/lib/program-holder/roster-filter';
import { requiredProgramHolderDocuments } from '@/lib/program-holder/onboarding-readiness';
import { isEpaTestingProgram } from '@/lib/program-holder/enrollment-identity';
import CourseSyllabus from '@/components/learner/CourseSyllabus';
import { completionAlert } from '@/lib/program-holder/student-training';
import { HolderHourSubmissionForm } from './HolderHourSubmissionForm';
import Link from 'next/link';
import { StudentProgressReportForm } from './StudentProgressReportForm';
import Image from 'next/image';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Users,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  MessageSquare,
} from 'lucide-react';
import { formatUsPhone } from '@/lib/phone/config';
import { getProgramHolderWorkspace, programTitle } from '@/lib/program-holder/workspace';
import { ProgramHolderDocumentUpload } from './ProgramHolderDocumentUpload';
import { ProgramHolderTrainingLogForm } from './ProgramHolderTrainingLogForm';
import { ProgramHolderStudentCloseoutForm } from './ProgramHolderStudentCloseoutForm';
import { ProgramHolderAcknowledgements } from './ProgramHolderAcknowledgements';
import { ProgramHolderNotificationPreferences } from './ProgramHolderNotificationPreferences';
import { WorkOneOutreachButton } from './WorkOneOutreachButton';
import { StudentCommunicationActions } from './StudentCommunicationActions';
import { AlumniCareerOutreachButton } from './AlumniCareerOutreachButton';
import { getProgramCardImage } from '@/lib/images/programImages';
import { UniversalProfilePhotoEditor } from '@/components/profile/UniversalProfilePhotoEditor';
import { ENCHANTED_HEARTS, formatUsd } from '@/lib/partners/enchanted-hearts';
import { CallListPanel } from './CallListPanel';
import { StudentReadyForTestingButton } from './StudentReadyForTestingButton';

type Section =
  | 'dashboard'
  | 'students'
  | 'at-risk'
  | 'pending'
  | 'programs'
  | 'hours'
  | 'compliance'
  | 'documents'
  | 'ready-to-test'
  | 'recruiting'
  | 'reports'
  | 'payouts'
  | 'settings';

export async function ProgramHolderWorkspaceView({
  section,
  workspace,
  payoutPanel,
  studentQuery = '',
  studentStatus = 'all',
}: {
  section: Section;
  workspace?: Awaited<ReturnType<typeof getProgramHolderWorkspace>>;
  payoutPanel?: React.ReactNode;
  studentQuery?: string;
  studentStatus?: string;
}) {
  const data = workspace || await getProgramHolderWorkspace();
  const coordinatorRole =
    data.mode === 'holder'
      ? String(
          data.holder?.features?.approved_role ||
            (data.profile?.role === 'site_coordinator' ? 'Site Coordinator' : ''),
        )
      : '';
  const isTexasStateCoordinator = coordinatorRole === 'Texas State Site Coordinator';
  const isGaryRegionalCoordinator = coordinatorRole === 'Gary Regional Site Coordinator';
  if (data.mode === 'admin') return <AdminBoundary />;
  const active = data.enrollments.filter((row) =>
    ['active', 'enrolled', 'in_progress'].includes(row.enrollment_state || row.status),
  );
  const completed = data.enrollments.filter((row) =>
    ['completed', 'graduated'].includes(row.enrollment_state || row.status),
  );
  const incompleteBackWork = completed.filter(
    (row) =>
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
  const approvedDocumentTypes = new Set(
    data.documents
      .filter((row) => row.approved === true || row.status === 'approved')
      .map((row) => row.document_type),
  );
  const holderFeatures =
    data.holder?.features && typeof data.holder.features === 'object' ? data.holder.features : {};
  const requiredDocumentTypes = requiredProgramHolderDocuments(isHvac, holderFeatures).map(
    (item) => item.type,
  );
  const regionalAssignment =
    holderFeatures.regional_assignment && typeof holderFeatures.regional_assignment === 'object'
      ? (holderFeatures.regional_assignment as Record<string, unknown>)
      : null;
  const customMou =
    holderFeatures.custom_mou && typeof holderFeatures.custom_mou === 'object'
      ? (holderFeatures.custom_mou as Record<string, unknown>)
      : null;
  const coordinatorRequirements = Array.isArray(customMou?.requirements)
    ? customMou.requirements.map((item) => String(item))
    : [];
  const coordinatorTrainingTopics = Array.isArray(holderFeatures.training_topics)
    ? holderFeatures.training_topics.map((item) => String(item))
    : [];
  const requiresMediaEvidence = holderFeatures.student_media_required === true;
  const requiresImageRelease =
    holderFeatures.require_image_release === true || requiresMediaEvidence;
  const selectedPayoutProvider = String(
    holderFeatures.payout_provider || data.payoutProfile?.payout_provider || '',
  ).toLowerCase();
  const studentCloseoutGaps = incompleteBackWork.map((row) => ({
    id: row.id,
    name: row.full_name || row.email || 'Student',
    missing: [
      Number(row.total_hours_completed || 0) < 48 ? '48 verified training hours' : null,
      !row.training_start_date ? 'training start date' : null,
      !row.training_end_date ? 'training end date' : null,
      !row.lms_completed ? 'coursework completion' : null,
      !row.practical_skills_verified ? 'practical-skills verification' : null,
    ].filter(Boolean) as string[],
  }));
  const complianceItems: Array<{
    label: string;
    complete: boolean;
    required: boolean;
    owner: 'Program Holder' | 'Elevate' | 'Shared';
  }> = [
    {
      label: 'Program-holder approval',
      complete: ['active', 'approved'].includes(data.holder?.status),
      required: true,
      owner: 'Elevate',
    },
    {
      label: 'Memorandum of Understanding',
      complete: Boolean(data.holder?.mou_signed),
      required: true,
      owner: 'Shared',
    },
    ...(isHvac
      ? [
          {
            label: 'HVAC program assignment',
            complete: true,
            required: true,
            owner: 'Elevate' as const,
          },
        ]
      : []),
    ...(isHvac
      ? [
          {
            label: 'HVAC license or instructor credential',
            complete:
              Boolean(data.holder?.hvac_license_url) || approvedDocumentTypes.has('epa_608'),
            required: true,
            owner: 'Program Holder' as const,
          },
        ]
      : []),
    {
      label: 'Program Holder handbook acknowledgement',
      complete: data.acknowledgements.some((item) => item.document_type === 'handbook'),
      required: true,
      owner: 'Program Holder',
    },
    {
      label: 'Non-disclosure and confidentiality agreement',
      complete: data.acknowledgements.some((item) =>
        ['nda', 'non_disclosure', 'confidentiality'].includes(item.document_type),
      ),
      required: true,
      owner: 'Program Holder',
    },
    {
      label: 'Non-compete agreement',
      complete: data.acknowledgements.some((item) => item.document_type === 'non_compete'),
      required: true,
      owner: 'Program Holder',
    },
    ...(data.requiresEnchantedHeartsTerms
      ? [
          {
            label: 'Enchanted Hearts referral and pricing agreement',
            complete: data.acknowledgements.some(
              (item) => item.document_type === 'enchanted_hearts_referral_terms',
            ),
            required: true,
            owner: 'Program Holder' as const,
          },
        ]
      : []),
    {
      label: 'Approved required onboarding documents',
      complete: requiredDocumentTypes.every((type) => approvedDocumentTypes.has(type)),
      required: true,
      owner: 'Shared',
    },
    {
      label: 'Profile picture',
      complete:
        Boolean(data.profile?.avatar_url) ||
        data.documents.some((row) => row.document_type === 'profile_photo'),
      required: true,
      owner: 'Program Holder',
    },
    ...(requiresImageRelease
      ? [
          {
            label: 'Signed image release',
            complete: Boolean(data.imageReleaseConsent?.signed_at),
            required: true,
            owner: 'Program Holder' as const,
          },
        ]
      : []),
    {
      label: 'Company logo upload',
      complete: data.documents.some((row) => row.document_type === 'company_logo'),
      required: true,
      owner: 'Program Holder',
    },
    ...(selectedPayoutProvider === 'quickbooks'
      ? [
          {
            label: 'QuickBooks payment-record connection',
            complete: ['active', 'connected', 'synced', 'complete'].includes(
              String(data.payoutProfile?.quickbooks_sync_status || '').toLowerCase(),
            ),
            required: true,
            owner: 'Elevate' as const,
          },
        ]
      : []),
    ...(selectedPayoutProvider === 'paypal'
      ? [
          {
            label: 'PayPal payout connection',
            complete:
              data.payoutProfile?.payout_provider === 'paypal' &&
              Boolean(data.payoutProfile?.payouts_enabled) &&
              Boolean(data.payoutProfile?.transfers_enabled),
            required: true,
            owner: 'Shared' as const,
          },
        ]
      : []),
    ...(requiresMediaEvidence
      ? [
          {
            label: 'Student photos and training videos',
            complete: data.documents.some((row) =>
              ['student_photo', 'student_video'].includes(row.document_type),
            ),
            required: true,
            owner: 'Program Holder' as const,
          },
        ]
      : []),
    ...(completed.length
      ? [
          {
            label: 'Graduated-student back work and 48-hour sign-offs',
            complete: incompleteBackWork.length === 0,
            required: true,
            owner: 'Shared' as const,
          },
        ]
      : []),
    {
      label: 'Course delivery assignment',
      complete: data.courseAssignments.length > 0,
      required: data.programs.length > 0,
      owner: 'Elevate',
    },
  ];
  const requiredComplianceItems = complianceItems.filter((item) => item.required);
  const complianceScore = Math.round(
    (requiredComplianceItems.filter((item) => item.complete).length /
      Math.max(1, requiredComplianceItems.length)) *
      100,
  );
  const completedRequirements = requiredComplianceItems.filter((item) => item.complete).length;
  const missingRequirements = requiredComplianceItems.length - completedRequirements;
  const primaryProgramLabel =
    data.programs.length === 1
      ? data.programs[0].title || data.programs[0].name || 'Assigned program'
      : `${data.programs.length} assigned programs`;
  const recruitingEnabled = hasRecruitingAssignment(data.holder?.features);
  const callQueue = (recruitingEnabled ? data.applicants : []).filter(
    (row) => !row.call_date || !row.call_outcome,
  );
  const payoutReady = Boolean(
    data.payoutProfile?.payouts_enabled &&
    data.payoutProfile?.transfers_enabled &&
    data.payoutProfile?.verification_status === 'active',
  );

  if (section === 'students')
    return (
      <>
        <Students
          title="Enrolled Students"
          rows={filterHolderStudents(data.enrollments, studentQuery, studentStatus)}
          programs={data.programs}
          query={studentQuery}
          status={studentStatus}
        />
        <SchoolApplicantRoster
          rows={(data.schoolApplicants || []).filter((row) =>
            ['accepted', 'enrolled'].includes(row.status),
          )}
        />
      </>
    );
  if (section === 'at-risk')
    return <Students title="At-Risk Students" rows={atRisk} programs={data.programs} />;
  if (section === 'recruiting')
    return recruitingEnabled ? (
      <Applicants
        rows={data.applicants}
        programs={data.programs}
        contactAccessGranted={data.contactAccessGranted}
        namesOnly={data.requiresEnchantedHeartsTerms}
      />
    ) : (
      <p>Recruiting assignment required.</p>
    );
  if (section === 'pending')
    return (
      <>
        <SchoolApplicantRoster
          pending
          rows={(data.schoolApplicants || []).filter(
            (row) => !['accepted', 'enrolled'].includes(row.status),
          )}
        />
        {recruitingEnabled ? (
          <ApplicantsByProgram rows={data.applicants} programs={data.programs} />
        ) : (
          <p className="rounded-xl border bg-white p-5">
            Applicant recruiting tools are available only to assigned recruiters. Use Students for
            your training roster.
          </p>
        )}
      </>
    );
  if (section === 'ready-to-test')
    return (
      <div className="space-y-6 p-4">
        <Hero
          eyebrow="Completion and testing"
          title="Ready to Test"
          description="Submit the exact exit report, track Admin review, and start your individual second-payment invoice."
        />
        <TestingReadinessForm students={data.enrollments} documents={data.documents} />
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-black">Submitted exit reports</h2>
          {(data.testingReports ?? data.reports)
            .filter((row) => row.metadata?.report_kind === 'testing_readiness')
            .map((row) => (
              <article key={row.id} className="mt-4 min-w-0 rounded-xl border p-4">
                <h3 className="font-bold">{row.title}</h3>
                <p className="text-sm">Review: {row.status}</p>
                <p className="text-sm">
                  Second-payment invoice:{' '}
                  {row.metadata?.completion_invoice?.status || 'Requires review'}
                  {Number.isInteger(row.metadata?.completion_invoice?.amount_cents)
                    ? ` — ${(row.metadata.completion_invoice.amount_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
                    : ''}
                </p>
                {row.metadata?.completion_invoice?.reason && (
                  <p className="text-sm">{row.metadata.completion_invoice.reason}</p>
                )}
                {row.reviewer_notes && (
                  <p className="mt-2 text-sm">Admin feedback: {row.reviewer_notes}</p>
                )}
                <details className="mt-3">
                  <summary className="min-h-11 cursor-pointer font-bold">
                    View exact submitted report
                  </summary>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm">
                    {row.content}
                  </pre>
                </details>
              </article>
            ))}
          {!(data.testingReports ?? data.reports).some((row) => row.metadata?.report_kind === 'testing_readiness') && (
            <p className="mt-3 text-sm">No exit reports submitted yet.</p>
          )}
        </section>
      </div>
    );
  if (section === 'programs') return <Programs data={data} />;
  if (section === 'hours')
    return <Hours rows={data.hours} programs={data.programs} enrollments={data.enrollments} />;
  if (section === 'compliance')
    return <Compliance score={complianceScore} items={complianceItems} atRisk={atRisk.length} />;
  if (section === 'documents')
    return (
      <Documents
        students={data.enrollments}
        rows={data.documents}
        courseAssignments={data.courseAssignments}
        isHvac={isHvac}
        requiresEnchantedHeartsTerms={data.requiresEnchantedHeartsTerms}
        insuranceRequired={holderFeatures.insurance_required !== false}
      />
    );
  if (section === 'reports')
    return (
      <div className="space-y-6">
        <Reports
          rows={data.reports}
          enrolled={data.enrollments.length}
          active={active.length}
          completed={completed.length}
          programLabel={primaryProgramLabel}
        />
        <StudentProgressReportForm
          students={data.enrollments.map((row) => ({ id: row.id, full_name: row.full_name }))}
        />
      </div>
    );
  if (section === 'payouts')
    return (
      <section className="space-y-4 p-4">
        <h1 className="text-2xl font-black">Financial records</h1>
        <p>
          Student funding, reimbursements, and payment records are managed by authorized Elevate
          administrators.
        </p>
        {payoutPanel}
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-black">Submitted invoices</h2>
          <p className="mt-1 text-sm text-slate-600">Track your invoice review here. Document approval does not confirm payment.</p>
          <div className="mt-4 space-y-3">
            {data.documents.filter((row) => row.document_type === 'provider_invoice').length ? (
              data.documents.filter((row) => row.document_type === 'provider_invoice').map((row) => (
                <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                  <div className="min-w-0">
                    <p className="break-all font-bold">{row.file_name}</p>
                    <p className="text-sm capitalize">Review: {row.status || 'pending'}</p>
                  </div>
                  <a href={`/api/program-holder/documents/${row.id}/download`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">View invoice</a>
                </article>
              ))
            ) : <p className="text-sm text-slate-600">You have not submitted any invoices yet.</p>}
          </div>
        </section>
      </section>
    );
  if (section === 'settings')
    return (
      <Settings
        holder={data.holder}
        profile={data.profile}
        notificationPreferences={data.notificationPreferences}
        phone={data.profile?.phone || data.holder?.contact_phone || ''}
      />
    );

  // Home is an action queue. Rosters, guides and office tools live in their own tabs.
  const todos = [
    ...(callQueue.length
      ? [
          {
            title: `Contact ${callQueue.length} new applicant${callQueue.length === 1 ? '' : 's'}`,
            detail: 'Record the outcome and next follow-up.',
            href: '/program-holder/recruiting',
          },
        ]
      : []),
    ...(pendingHours.length
      ? [
          {
            title: `Review ${pendingHours.length} training-hour submission${pendingHours.length === 1 ? '' : 's'}`,
            detail: 'Check the dates and evidence before verifying.',
            href: '/program-holder/hours',
          },
        ]
      : []),
    ...(atRisk.length
      ? [
          {
            title: `Follow up with ${atRisk.length} student${atRisk.length === 1 ? '' : 's'} needing support`,
            detail: 'Document the barrier and next action.',
            href: '/program-holder/students/at-risk',
          },
        ]
      : []),
    ...(missingRequirements
      ? [
          {
            title: `Resolve ${missingRequirements} compliance requirement${missingRequirements === 1 ? '' : 's'}`,
            detail: 'Read the missing-item or correction notes.',
            href: '/program-holder/compliance',
          },
        ]
      : []),
    ...(!data.holder?.mou_signed
      ? [
          {
            title: 'Review and sign your agreement',
            detail: 'Read your assigned terms before signing.',
            href: '/program-holder/sign-mou',
          },
        ]
      : []),
  ];
  return (
    <div
      className={`mx-auto max-w-5xl space-y-6 p-4 pb-24 sm:p-6 ${holderFeatures.reading_support === true ? 'text-lg' : ''}`}
    >
      <section
        aria-labelledby="holder-todos"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
      >
        <h1 id="holder-todos" className="text-3xl font-black text-slate-950">
          To-dos
        </h1>
        <p className="mt-2 text-slate-600">
          Choose one task. Your tools and PARIS guide open in that tab.
        </p>
        {todos.length ? (
          <ul className="mt-5 divide-y divide-slate-200">
            {todos.map((task, i) => (
              <li key={task.href}>
                <Link
                  href={task.href}
                  className="flex min-h-20 items-center gap-4 rounded-xl py-4 pr-3 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-black text-blue-800">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-lg text-slate-950">{task.title}</strong>
                    <span className="mt-1 block text-sm text-slate-600">{task.detail}</span>
                  </span>
                  <span aria-hidden="true" className="text-xl text-blue-800">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900">
            No outstanding items in this queue. Use the navigation for your routine work.
          </p>
        )}
      </section>
      <section
        aria-labelledby="holder-alerts"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-7"
      >
        <h2 id="holder-alerts" className="text-2xl font-black text-slate-950">
          Alerts
        </h2>
        <ProgramHolderPaymentAddendum alertOnly />
        <CommunicationTodos embedded inboxPath="/program-holder/email" />
        <ul className="mt-4 space-y-4 text-slate-800">
          {active.length > 0 && (
            <li>
              <Link
                className="inline-flex min-h-11 items-center font-bold text-blue-900 underline"
                href="/program-holder/reports"
              >
                Weekly progress reports are due each Friday
              </Link>
              <p className="text-sm">
                Review and submit a report for each active student in Reports.
              </p>
            </li>
          )}
          {(coordinatorRequirements.length > 0 || coordinatorTrainingTopics.length > 0) && (
            <li>
              <Link
                className="inline-flex min-h-11 items-center font-bold text-blue-900 underline"
                href="/program-holder/rights-responsibilities"
              >
                Review your assigned role and training requirements
              </Link>
            </li>
          )}
          {isGaryRegionalCoordinator && (
            <li>
              <Link
                className="inline-flex min-h-11 items-center font-bold text-blue-900 underline"
                href="/program-holder/gary-launch"
              >
                Review your Gary coordinator launch assignment
              </Link>
            </li>
          )}
          {isTexasStateCoordinator && (
            <li>
              <Link
                className="inline-flex min-h-11 items-center font-bold text-blue-900 underline"
                href="/program-holder/how-to-use"
              >
                Review your Texas coordinator launch assignment
              </Link>
            </li>
          )}
          {!active.length &&
            !coordinatorRequirements.length &&
            !coordinatorTrainingTopics.length &&
            !isGaryRegionalCoordinator &&
            !isTexasStateCoordinator && <li>No additional alerts from your current records.</li>}
        </ul>
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
    <section className="min-w-0 overflow-hidden rounded-2xl border border-blue-200 bg-white p-5 text-slate-950 shadow-sm sm:rounded-3xl sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
      <h1 className="mt-2 break-words text-2xl font-black sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700 sm:text-base">
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

function completionStatus(row: any) {
  const state = String(row.enrollment_state || row.status || '').toLowerCase();
  if (
    Boolean(row.completed_at || row.completion_date) ||
    ['completed', 'graduated'].includes(state) ||
    String(row.work_progress || '').toLowerCase() === 'completed'
  ) {
    return 'Complete';
  }

  if (
    Number(row.progress_percent || 0) > 0 ||
    Number(row.total_hours_completed || 0) > 0 ||
    (row.training_start_date && row.training_start_date <= new Date().toISOString().slice(0, 10))
  ) {
    return 'In progress';
  }

  return 'Not started';
}

function applicantPipelineStatus(row: any) {
  const status = String(row.application_status || row.status || 'pending').toLowerCase();
  return status === 'approved' ? 'Voucher pending' : status.replaceAll('_', ' ');
}

function isCompletionOverdue(row: any): boolean {
  const status = String(row.status || row.enrollment_state || '').toLowerCase();
  if (
    ['completed', 'graduated', 'withdrawn', 'cancelled'].includes(status) ||
    row.completed_at ||
    row.completion_date
  )
    return false;
  const end = String(row.expected_end_date || row.training_end_date || '').slice(0, 10);
  return Boolean(end && end < new Date().toISOString().slice(0, 10));
}

function EnrollmentTable({ rows, programs }: { rows: any[]; programs: any[] }) {
  return (
    <div className="mt-5 min-w-0">
      <div className="grid gap-3 md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <article
              key={row.id}
              data-testid="student-card"
              className={
                isCompletionOverdue(row)
                  ? 'min-w-0 rounded-xl border-2 border-red-600 bg-red-50 p-4'
                  : 'min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4'
              }
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-black text-slate-950">
                    {row.full_name || 'Student'}
                  </p>
                  <p className="break-all text-xs text-slate-500">{row.email || ''}</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-800">
                  {Number(row.progress_percent || 0)}%
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <Row
                  label="Program"
                  value={programTitle(programs, row.program_id, row.program_slug)}
                />
                <Row label="Completion" value={completionStatus(row)} />
                {isCompletionOverdue(row) && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-700 p-2 text-xs font-black text-white"
                  >
                    Completion overdue — review testing and closeout
                  </p>
                )}
                <Row
                  label="Actual completion"
                  value={
                    (row.completion_date || row.completed_at)?.slice(0, 10) || 'Not documented'
                  }
                />
                <Row
                  label="Certification evidence"
                  value={row.certification_status || 'Upload missing'}
                />
                {row.credential_earned_date && (
                  <Row label="Credential earned" value={row.credential_earned_date} />
                )}
                {row.certificate_verified_at && (
                  <Row
                    label="Credential verified"
                    value={row.certificate_verified_at.slice(0, 10)}
                  />
                )}
                <Row
                  label="Scheduled training"
                  value={`${row.training_start_date || 'Start missing'} — ${row.expected_end_date || row.training_end_date || 'End missing'}`}
                />
                <Row
                  label="Next action"
                  value={completionAlert(row) || row.next_required_action || 'Continue training'}
                />
                <Row
                  label="WorkOne hours"
                  value={`${Math.min(48, Number(row.total_hours_completed || 0))} of 48 complete`}
                />
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/program-holder/hours"
                  className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white"
                >
                  Record progress
                </Link>
                {row.phone && (
                  <a
                    className="block break-words font-bold text-blue-900 underline"
                    href={`tel:${row.phone}`}
                  >
                    Phone: {row.phone}
                  </a>
                )}
                {row.email && (
                  <a
                    className="block break-all font-bold text-blue-900 underline"
                    href={`mailto:${row.email}`}
                  >
                    Email: {row.email}
                  </a>
                )}
                <StudentCommunicationActions
                  enrollmentId={row.id}
                  studentName={row.full_name || 'Student'}
                  hasEmail={Boolean(row.email)}
                  hasPhone={Boolean(row.phone)}
                />
                {isEpaTestingProgram(
                  row.program_slug ||
                    programs.find((program) => program.id === row.program_id)?.slug,
                ) ? (
                  <StudentReadyForTestingButton
                    studentId={row.id}
                    studentName={row.full_name || 'Student'}
                    source={
                      row.roster_source === 'holder_student' ? 'holder_student' : 'enrollment'
                    }
                  />
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            No confirmed student enrollments are linked.
          </div>
        )}
      </div>
      <div className="hidden max-w-full overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Student</th>
              <th className="px-3 py-3">Program</th>
              <th className="px-3 py-3">Completion</th>
              <th className="px-3 py-3">Progress</th>
              <th className="px-3 py-3">WorkOne hours</th>
              <th className="px-3 py-3">Training dates</th>
              <th className="px-3 py-3">Next action</th>
              <th className="px-3 py-3">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-testid="student-row"
                  className={isCompletionOverdue(row) ? 'bg-red-50' : undefined}
                >
                  <td className="px-3 py-4">
                    <p className="font-bold">{row.full_name || 'Student'}</p>
                    <p className="text-xs text-slate-500">{row.email || ''}</p>
                  </td>
                  <td className="px-3 py-4">
                    {programTitle(programs, row.program_id, row.program_slug)}
                  </td>
                  <td className="px-3 py-4">
                    <p
                      className={isCompletionOverdue(row) ? 'font-black text-red-800' : 'font-bold'}
                    >
                      {completionStatus(row)}
                    </p>
                    {isCompletionOverdue(row) && (
                      <p role="alert" className="text-xs font-black text-red-800">
                        Completion overdue
                      </p>
                    )}
                    <p className="text-xs">{row.certification_status || 'Upload missing'}</p>
                    {row.credential_earned_date && (
                      <p className="text-xs">Earned: {row.credential_earned_date}</p>
                    )}
                    {row.certificate_verified_at && (
                      <p className="text-xs">
                        Verified: {row.certificate_verified_at.slice(0, 10)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4 font-bold">{Number(row.progress_percent || 0)}%</td>
                  <td className="px-3 py-4 font-bold">
                    {Math.min(48, Number(row.total_hours_completed || 0))} / 48
                  </td>
                  <td className="px-3 py-4 text-xs">
                    <span className="block">Start: {row.training_start_date || 'Missing'}</span>
                    <span className="block">
                      Scheduled end: {row.expected_end_date || row.training_end_date || 'Missing'}
                    </span>
                    <span className="block">
                      Actual completion:{' '}
                      {(row.completion_date || row.completed_at)?.slice(0, 10) || 'Not documented'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    {completionAlert(row) || row.next_required_action || 'Continue training'}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-start gap-2">
                      {row.phone && (
                        <a
                          className="block break-words font-bold text-blue-900 underline"
                          href={`tel:${row.phone}`}
                        >
                          Phone: {row.phone}
                        </a>
                      )}
                      {row.email && (
                        <a
                          className="block break-all font-bold text-blue-900 underline"
                          href={`mailto:${row.email}`}
                        >
                          Email: {row.email}
                        </a>
                      )}
                      {row.phone && (
                        <a
                          className="block break-words font-bold text-blue-900 underline"
                          href={`tel:${row.phone}`}
                        >
                          Phone: {row.phone}
                        </a>
                      )}
                      {row.email && (
                        <a
                          className="block break-all font-bold text-blue-900 underline"
                          href={`mailto:${row.email}`}
                        >
                          Email: {row.email}
                        </a>
                      )}
                      <StudentCommunicationActions
                        enrollmentId={row.id}
                        studentName={row.full_name || 'Student'}
                        hasEmail={Boolean(row.email)}
                        hasPhone={Boolean(row.phone)}
                      />
                      {isEpaTestingProgram(
                        row.program_slug ||
                          programs.find((program) => program.id === row.program_id)?.slug,
                      ) ? (
                        <StudentReadyForTestingButton
                          studentId={row.id}
                          studentName={row.full_name || 'Student'}
                          source={
                            row.roster_source === 'holder_student' ? 'holder_student' : 'enrollment'
                          }
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
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

function Students({
  title,
  rows,
  programs,
  query = '',
  status = 'all',
}: {
  title: string;
  rows: any[];
  programs: any[];
  query?: string;
  status?: string;
}) {
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
      <form method="get" action="/program-holder/students" className="flex flex-wrap gap-3">
        <input
          name="q"
          aria-label="Search students"
          placeholder="Student name or email"
          defaultValue={query}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4"
        />
        <select
          name="status"
          aria-label="Filter student status"
          defaultValue={status}
          className="min-h-11 rounded-xl border bg-white px-3"
        >
          <option value="all">All students</option>
          <option value="active">Active students</option>
          <option value="completed">Completed students</option>
        </select>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-slate-950 px-4 font-bold text-white"
        >
          Apply filters
        </button>
        <Link
          href="/program-holder/students"
          className="inline-flex min-h-11 items-center px-3 font-bold underline"
        >
          Clear filters
        </Link>
        <Link
          href="/program-holder/students/pending"
          className="inline-flex min-h-11 items-center px-3 font-bold underline"
        >
          View Applicants
        </Link>
      </form>
      <AlumniCareerOutreachButton
        count={
          rows.filter((row) =>
            ['completed', 'graduated'].includes(row.enrollment_state || row.status),
          ).length
        }
      />
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
        <EnrollmentTable rows={rows} programs={programs} />
      </section>
      <ProgramHolderStudentCloseoutForm enrollments={rows} />
    </div>
  );
}
function ApplicantsByProgram({ rows, programs }: { rows: any[]; programs: any[] }) {
  const groups = new Map<string, any[]>();
  for (const row of rows) {
    const title = programTitle(programs, row.program_id, row.program_slug);
    groups.set(title, [...(groups.get(title) || []), row]);
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-slate-950">Applicants by program</h2>
        <p className="mt-2 text-sm text-slate-600">
          {rows.length} applicant records. Elevate coordinates student outreach. Email addresses,
          phone numbers, and other contact details remain private.
        </p>
      </div>
      {[...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([title, applicants]) => (
          <details key={title} open className="rounded-xl border border-slate-200 p-4">
            <summary className="cursor-pointer font-black text-slate-950">
              {title} ({applicants.length})
            </summary>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[...applicants]
                .sort((a, b) =>
                  String(a.applicant_name || '').localeCompare(String(b.applicant_name || '')),
                )
                .map((row) => (
                  <li key={row.id} className="rounded-lg bg-slate-50 p-3 text-sm font-bold">
                    {row.applicant_name || 'Applicant'}
                  </li>
                ))}
            </ul>
          </details>
        ))}
      {!rows.length && <p className="text-sm text-slate-600">No applicants are assigned yet.</p>}
    </section>
  );
}

function Applicants({
  rows,
  programs,
  contactAccessGranted,
  namesOnly = false,
}: {
  rows: any[];
  programs: any[];
  contactAccessGranted: boolean;
  namesOnly?: boolean;
}) {
  if (namesOnly) return <ApplicantsByProgram rows={rows} programs={programs} />;
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
      {!contactAccessGranted ? (
        <section role="alert" className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-black text-blue-950">Student contact details are protected</p>
          <p className="mt-1 text-sm leading-6 text-blue-900">
            Names and program matches are available for planning. Phone numbers and email addresses
            are released only after the required non-solicitation and partner pricing
            acknowledgements are signed.
          </p>
          <Link
            href="/program-holder/documents"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-4 py-2 text-sm font-black text-white"
          >
            Review and sign agreements
          </Link>
        </section>
      ) : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {contactAccessGranted ? (
          <>
            <WorkOneOutreachButton
              count={rows.filter((row) => !row.call_date || !row.call_outcome).length}
            />
            <CallListPanel applicants={rows} />
          </>
        ) : null}
      </section>
      {!contactAccessGranted && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Applicant</th>
                  <th className="p-3">Program</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Contact</th>
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
                    <td className="p-3 capitalize">{applicantPipelineStatus(row)}</td>
                    <td className="p-3">
                      <p className="font-medium">
                        {row.applicant_phone || 'Contact details protected'}
                      </p>
                      <div className="mt-1 flex gap-2">
                        {row.applicant_phone && (
                          <a
                            className="font-bold text-blue-700"
                            href={`tel:${row.applicant_phone}`}
                          >
                            Call
                          </a>
                        )}
                        {row.applicant_email && (
                          <a
                            className="font-bold text-blue-700"
                            href={`mailto:${row.applicant_email}`}
                          >
                            Email
                          </a>
                        )}
                      </div>
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
      )}
    </div>
  );
}
function Programs({ data }: { data: any }) {
  const label = data.programs[0]?.title || data.programs[0]?.name || 'Program Delivery';
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Program Delivery"
        title={label}
        description="Review approved program ownership, delivery readiness, credentials, and course assignments."
      />
      <CourseSyllabus
        syllabus={
          data.programs.some(
            (program: any) => program.id === data.holder?.features?.course_syllabus?.program_id,
          )
            ? data.holder?.features?.course_syllabus
            : null
        }
      />
      <SyllabusUploadStatus documents={data.documents} courseAssignments={data.courseAssignments} />
      <ProgramCards programs={data.programs} courseAssignments={data.courseAssignments} />
    </div>
  );
}

function formatProgramAmount(program: any) {
  if (['nha-ekg-technician', 'nha-ehr', 'nha-billing-coding'].includes(program.slug)) {
    return 'Contact admissions — à-la-carte items';
  }
  const raw = program.tuition ?? program.total_cost ?? program.price;
  const amount = Number(raw);
  if (Number.isFinite(amount) && amount >= 0) {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  if (program.is_free === true) return '$0.00';
  return 'Amount not configured';
}

function formatProgramFunding(program: any) {
  const tags = Array.isArray(program.funding_tags) ? program.funding_tags.filter(Boolean) : [];
  const fundingTags = tags.filter(
    (tag: string) => !['self-pay', 'a-la-carte'].includes(tag.toLowerCase()),
  );
  const listedAmount = Number(program.tuition ?? program.total_cost ?? program.price);
  if (program.is_free === true && (!Number.isFinite(listedAmount) || listedAmount <= 0)) {
    return fundingTags.length
      ? `No student tuition; ${fundingTags.join(', ')} eligibility rules may apply`
      : 'No student tuition charged';
  }
  if (fundingTags.length)
    return `${fundingTags.join(', ')} may be available; verify written approval`;
  if (program.wioa_approved || program.etpl_listed || program.funding_eligible) {
    return 'Funding may be available; verify written approval';
  }
  if (tags.some((tag: string) => tag.toLowerCase() === 'a-la-carte')) {
    return 'Self-pay, à-la-carte; confirm selected items with Admissions';
  }
  return 'Self-pay at the published amount';
}

function formatCareerPay(program: any) {
  const usd = (value: unknown) =>
    Number(value) > 0
      ? Number(value).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        })
      : null;
  const low = usd(program.salary_min);
  const high = usd(program.salary_max);
  return low || high
    ? `${low || 'Varies'}–${high || 'Varies'} annual estimate; confirm local wages`
    : 'No verified local pay range on file';
}

function ProgramCards({
  programs,
  courseAssignments,
  compact = false,
}: {
  programs: any[];
  courseAssignments: any[];
  compact?: boolean;
}) {
  if (!programs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        No approved programs are connected yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {programs.map((program: any) => {
        const courses = courseAssignments.filter((item: any) => item.program_id === program.id);
        return (
          <article
            key={program.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className={`relative ${compact ? 'h-36' : 'h-48'} bg-slate-200`}>
              <Image
                src={getProgramCardImage(program.slug || program.id)}
                alt={`${program.title || program.name || 'Training program'} hands-on training`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className={compact ? 'p-5' : 'p-6'}>
              <BookOpen className="h-7 w-7 text-blue-700" />
              <h3 className="mt-3 text-2xl font-black">{program.title || program.name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {program.slug} · {program.is_active ? 'Active' : program.status || 'Inactive'}
              </p>
              {!compact && (
                <>
                  <dl className="mt-5 space-y-3 text-sm">
                    <Row
                      label="Credential"
                      value={program.credential_name || 'Credential pathway'}
                    />
                    <Row
                      label="Program hours"
                      value={
                        program.total_hours ? String(program.total_hours) : 'Review program record'
                      }
                    />
                    <Row label="Published amount" value={formatProgramAmount(program)} />
                    <Row label="Funding path" value={formatProgramFunding(program)} />
                    <Row label="Career pay" value={formatCareerPay(program)} />
                    <Row label="Connected course records" value={String(courses.length)} />
                    <Row
                      label="Delivery"
                      value={program.delivery_method || 'Confirm with the program team'}
                    />
                    <Row
                      label="Duration"
                      value={
                        program.estimated_weeks
                          ? `${program.estimated_weeks} estimated weeks`
                          : 'Confirm schedule with the program team'
                      }
                    />
                  </dl>
                  <p className="mt-5 text-sm leading-6 text-slate-700">
                    {program.full_description ||
                      program.description ||
                      program.short_description ||
                      'Ask the program team for the approved course outline before recruiting.'}
                  </p>
                  {Array.isArray(program.what_you_learn) && program.what_you_learn.length > 0 && (
                    <div className="mt-3 text-sm text-slate-700">
                      <p className="font-bold">What students learn</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {program.what_you_learn.map((topic: string, index: number) => (
                          <li key={`${program.id}-${index}`}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-xs font-bold text-slate-600">
                    Indiana WIOA status:{' '}
                    {program.etpl_listed || program.wioa_approved
                      ? 'Internal record has a funding flag; confirm this exact program and location on Indiana INTraining before offering a funded seat.'
                      : 'Indiana ETPL approval has not been verified in this workspace. Treat as self-pay until WorkOne confirms eligibility in writing.'}
                  </p>
                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                    <strong>Student payment conversation:</strong> confirm whether Elevate has
                    documented funding approval before describing a program as funded. Otherwise
                    explain the published self-pay amount. Students may use the payment options
                    shown at checkout; eligible applicants can request a buy-now-pay-later decision,
                    including Affirm when offered. Approval is made by the payment provider, not by
                    the Program Holder.
                  </div>
                  {courses.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm">
                      {courses.map((course: any) => (
                        <li
                          key={`${program.id}-${course.course_id}`}
                          className="rounded-lg border p-3"
                        >
                          <strong>{course.title || 'Assigned course'}</strong>
                          <span className="block">
                            {course.source === 'canonical_program'
                              ? 'Canonical program course'
                              : 'Holder delivery assignment'}{' '}
                            · {course.status || 'Status requires review'}
                          </span>
                          <p>Build: {course.build?.status || 'Build record unavailable'}{typeof course.build?.percent === 'number' ? ` — ${course.build.percent}%` : ''}</p>
                          <p>Review: {course.build?.review || 'Not recorded'} · Publication: {course.build?.published ? 'Published' : 'Not published'}</p>
                          {course.source === 'canonical_program' && !course.published && (
                            <span className="block font-bold text-amber-800">
                              Publication has not been verified. This mapping does not unlock
                              learner access.
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!courses.length && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                      This program is assigned, but no delivery course is connected yet.
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        );
      })}
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
      <HolderHourSubmissionForm enrollments={enrollments} />
      <ProgramHolderTrainingLogForm
        enrollments={enrollments}
        programs={programs}
        verifiedHours={rows}
      />
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
function programHolderRequirementLink(label: string): string | null {
  if (label === 'Memorandum of Understanding') return '/program-holder/sign-mou';
  if (label === 'Program Holder handbook acknowledgement') return '/program-holder/handbook';
  if (label === 'Non-disclosure and confidentiality agreement')
    return '/program-holder/non-compete';
  if (label === 'Non-compete agreement') return '/program-holder/non-compete';
  if (label === 'Approved required onboarding documents') return '/program-holder/documents';
  if (label === 'Profile picture' || label === 'Company logo upload')
    return '/program-holder/documents';
  if (label === 'Signed image release') return '/program-holder/documents';
  if (label === 'Program-holder approval') return '/program-holder/onboarding';
  if (label.includes('payout') || label.includes('PayPal')) return '/program-holder/payouts';
  if (label.includes('license') || label.includes('credential')) return '/program-holder/documents';
  if (label === 'QuickBooks payment-record connection') return '/program-holder/payouts';
  if (label === 'Graduated-student back work and 48-hour sign-offs')
    return '/program-holder/students';
  if (label === 'Course delivery assignment' || label === 'HVAC program assignment')
    return '/program-holder/programs';
  return null;
}

function Compliance({
  score,
  items,
  atRisk,
}: {
  score: number;
  items: {
    label: string;
    complete: boolean;
    required: boolean;
    owner: 'Program Holder' | 'Elevate' | 'Shared';
  }[];
  atRisk: number;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Program Oversight"
        title="Compliance"
        description="Track the operational requirements that keep the assigned program ready for delivery, payment, and reporting."
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
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
              >
                <span className="font-semibold">
                  {item.label}
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    {item.required ? 'Required' : 'Recommended'} · Owner: {item.owner}
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  {programHolderRequirementLink(item.label) ? (
                    <Link
                      href={programHolderRequirementLink(item.label)!}
                      className="inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800"
                    >
                      {item.complete ? 'View form' : 'Open form'}
                    </Link>
                  ) : null}
                  {item.complete ? (
                    <CheckCircle2 aria-label="Completed" className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle
                      aria-label="Action required"
                      className="h-5 w-5 text-amber-600"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
function SyllabusUploadStatus({
  documents,
  courseAssignments,
}: {
  documents: any[];
  courseAssignments: any[];
}) {
  const syllabi = documents.filter((row) =>
    ['training_plan', 'hvac_training_plan', 'syllabus'].includes(row.document_type),
  );
  if (!syllabi.length) return null;
  return (
    <section
      className="rounded-2xl border border-blue-200 bg-white p-5 sm:p-6"
      aria-label="Uploaded syllabus status"
    >
      <h2 className="text-xl font-black">Your syllabus and course status</h2>
      <p className="mt-2 text-sm text-slate-700">
        A syllabus upload is submitted for review. A course must be created, checked, and published
        separately before students can use it.
      </p>
      <div className="mt-4 space-y-3">
        {syllabi.map((row) => {
          const linked = courseAssignments.filter(
            (course) => course.custom_syllabus_path === row.file_url && course.course_id,
          );
          return (
            <article key={row.id} className="min-w-0 rounded-xl border p-4 text-sm">
              <h3 className="break-words font-bold">{row.file_name || 'Uploaded syllabus'}</h3>
              <p className="mt-2">
                Review:{' '}
                {row.status === 'approved' || row.approved === true
                  ? 'Approved'
                  : row.status === 'rejected'
                    ? 'Changes requested'
                    : 'Pending review'}
              </p>
              <p>
                Course from this upload:{' '}
                {linked.length ? 'Connected' : 'No course is linked to this syllabus yet'}
              </p>
              {linked.map((course) => (
                <div key={course.id} className="mt-2 rounded-lg bg-slate-50 p-3">
                  <p className="font-bold">{course.title || 'Assigned course'}</p>
                  <p>
                    Build: {course.build?.status || 'Build record unavailable'}
                    {typeof course.build?.percent === 'number' ? ` — ${course.build.percent}%` : ''}
                  </p>
                  {typeof course.build?.percent === 'number' && (
                    <progress
                      className="w-full"
                      aria-label="Curriculum build progress"
                      max={100}
                      value={course.build.percent}
                    />
                  )}
                  <p>Review: {course.build?.review || 'Not recorded'}</p>
                  <p>
                    Publication: {course.build?.published ? 'Published' : 'Not published'}. Student
                    access is verified separately.
                  </p>
                </div>
              ))}
              {row.rejection_reason && (
                <p className="mt-2 text-amber-900">Reviewer feedback: {row.rejection_reason}</p>
              )}
              <a
                className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-800 underline"
                href={`/api/program-holder/documents/${row.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View your syllabus
              </a>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-700">
        An existing program course does not mean your uploaded syllabus was converted. Contact
        Office Mail for the review or course creation update.
      </p>
    </section>
  );
}

function Documents({
  students,
  rows,
  courseAssignments,
  isHvac,
  requiresEnchantedHeartsTerms,
  insuranceRequired,
}: {
  students: any[];
  rows: any[];
  courseAssignments: any[];
  isHvac: boolean;
  requiresEnchantedHeartsTerms: boolean;
  insuranceRequired: boolean;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Compliance Records"
        title="Documents"
        description="Upload and track protected Program Holder onboarding records for program delivery and payment readiness."
      />
      <ProgramHolderDocumentUpload isHvac={isHvac} insuranceRequired={insuranceRequired} />
      <SyllabusUploadStatus documents={rows} courseAssignments={courseAssignments} />
      <ProgramHolderDocumentUpload materialsOnly students={students} />
      <ProgramHolderAcknowledgements requiresEnchantedHeartsTerms={requiresEnchantedHeartsTerms} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Document register</h2>
        <div className="mt-4 space-y-3">
          {rows.length ? (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-4"
              >
                <FileText className="h-5 w-5 text-blue-700" />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-bold">
                    {row.document_type || row.file_name || 'Program document'}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{row.status || 'submitted'}</p>
                  {row.file_name && row.document_type && (
                    <p className="break-all text-xs text-slate-600">{row.file_name}</p>
                  )}
                </div>
                {typeof row.file_url === 'string' && row.file_url.length > 0 ? (
                  <a
                    href={`/api/program-holder/documents/${row.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800"
                  >
                    View uploaded file
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-amber-800">
                    File preview unavailable — contact Office Mail
                  </span>
                )}
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
  programLabel,
}: {
  rows: any[];
  enrolled: number;
  active: number;
  completed: number;
  programLabel: string;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Outcomes & Reporting"
        title="Reports"
        description={`Enrollment and completion figures are generated from canonical ${programLabel} enrollment records.`}
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
function Settings({
  holder,
  profile,
  notificationPreferences,
  phone,
}: {
  holder: any;
  profile: any;
  notificationPreferences: any;
  phone: string;
}) {
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
          <h2 className="text-xl font-black">QuickBooks accounting</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Elevate manages QuickBooks centrally for authorized payout, expense, and revenue
            reconciliation. Program Holders do not need to connect a separate accounting account.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">
            Managed by Elevate
          </span>
        </div>
      </section>
      <UniversalProfilePhotoEditor
        currentUrl={profile?.avatar_url}
        name={profile?.full_name || holder?.organization_name || holder?.name || 'Program Holder'}
      />
      <ProgramHolderNotificationPreferences initial={notificationPreferences} phone={phone} />
      <details className="rounded-2xl border bg-white p-5">
        <summary className="min-h-11 cursor-pointer text-lg font-bold">
          First-time office setup checklist
        </summary>
        <PortalStartChecklist role="program-holder" />
      </details>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] items-start gap-3 border-b border-slate-100 pb-3">
      <dt className="min-w-0 break-words text-slate-600">{label}</dt>
      <dd className="min-w-0 break-words text-right font-bold">{value}</dd>
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

function SchoolApplicantRoster({ rows, pending = false }: { rows: any[]; pending?: boolean }) {
  if (!rows.length) return null;
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">
        {pending ? 'New school applications' : 'Accepted school applicants'}
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        {pending
          ? 'Applications waiting for review. Call or email the applicant below.'
          : 'Accepted applications. Enrollment and course access are tracked separately.'}
      </p>
      <ul className="mt-5 divide-y">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
            <div>
              <p className="font-bold">{row.full_name}</p>
              <p className="text-sm text-slate-600">
                {String(row.program_interest).replace(/-/g, ' ')}
              </p>
              {row.email ? (
                <a
                  className="block break-all font-bold text-blue-900 underline"
                  href={`mailto:${row.email}`}
                >
                  Email: {row.email}
                </a>
              ) : null}
              {row.phone ? (
                <a
                  className="block break-words font-bold text-blue-900 underline"
                  href={`tel:${row.phone}`}
                >
                  Phone: {row.phone}
                </a>
              ) : null}
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold capitalize">
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
