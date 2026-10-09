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
import { getProgramCardImage, getProgramHeroImage } from '@/lib/images/programImages';
import { UniversalProfilePhotoEditor } from '@/components/profile/UniversalProfilePhotoEditor';
import { ENCHANTED_HEARTS, formatUsd } from '@/lib/partners/enchanted-hearts';
import { CallListPanel } from './CallListPanel';
import { StudentReadyForTestingButton } from './StudentReadyForTestingButton';
import { getActiveJobs } from '@/lib/data/jobs';
import JobCard from '@/components/jobs/JobCard';
import { TexasCoordinatorLaunchKit } from './TexasCoordinatorLaunchKit';
import { PortalStartChecklist } from '@/components/portal/PortalStartChecklist';
import { BusinessNetworkCard } from '@/components/portal/BusinessNetworkCard';

function resolveDashboardHero(
  avatarUrl: string | null | undefined,
  program: { hero_image_url?: string | null; image_url?: string | null; cover_image_url?: string | null; slug?: string } | undefined,
) {
  if (avatarUrl?.trim()) return { src: avatarUrl.trim(), isPortrait: true };
  const programPhoto = program?.hero_image_url || program?.image_url || program?.cover_image_url;
  // Some legacy database image paths point to files that were never published.
  // Use the maintained program image map for local paths; keep hosted program photos.
  if (programPhoto?.trim() && /^https:\/\//.test(programPhoto.trim())) {
    return { src: programPhoto.trim(), isPortrait: false };
  }
  if (program?.slug) return { src: getProgramHeroImage(program.slug), isPortrait: false };
  return {
    src: '/images/pages/community-page-2.webp',
    isPortrait: false,
  };
}

type Section =
  | 'dashboard'
  | 'students'
  | 'at-risk'
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
  const coordinatorRole = data.mode === 'holder' ? String(data.holder?.features?.approved_role || '') : '';
  const isTexasStateCoordinator = coordinatorRole === 'Texas State Site Coordinator';
  const isGaryRegionalCoordinator = coordinatorRole === 'Gary Regional Site Coordinator';
  if (data.mode === 'admin') return <AdminBoundary />;
  const texasLaunchKit =
    section === 'dashboard' && isTexasStateCoordinator ? (
      <TexasCoordinatorLaunchKit
        coordinatorName={data.profile?.full_name || undefined}
        coordinatorPhone={data.profile?.phone || data.holder?.contact_phone || undefined}
        coordinatorEmail={data.profile?.email || data.holder?.contact_email || undefined}
      />
    ) : null;
  const careerJobs = section === 'dashboard' ? await getActiveJobs({ limit: 2 }) : [];

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
  const requiredDocumentTypes = ['government_id', 'business_registration', 'insurance', 'w9'];
  const holderFeatures =
    data.holder?.features && typeof data.holder.features === 'object' ? data.holder.features : {};
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
    ...(isHvac ? [{ label: 'HVAC program assignment', complete: true,
          required: true,
          owner: 'Elevate' as const,
        }]
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
      label: 'Approved ID, business registration, insurance, and W-9',
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
    data.programs[0]?.title || data.programs[0]?.name || 'Assigned program';
  const callQueue = data.applicants.filter((row) => !row.call_date || !row.call_outcome);
  const payoutReady = Boolean(
    data.payoutProfile?.payouts_enabled &&
    data.payoutProfile?.transfers_enabled &&
    data.payoutProfile?.verification_status === 'active',
  );
  const dashboardHero = resolveDashboardHero(data.profile?.avatar_url, data.programs[0]);

  if (section === 'students')
    return (
      <Students
        title="Enrolled Students"
        rows={data.enrollments}
        programs={data.programs}
      />
    );
  if (section === 'at-risk')
    return <Students title="At-Risk Students" rows={atRisk} programs={data.programs} />;
  if (section === 'pending')
    return (
      <Applicants
        rows={data.applicants}
        programs={data.programs}
        contactAccessGranted={data.contactAccessGranted}
      />
    );
  if (section === 'programs') return <Programs data={data} />;
  if (section === 'hours')
    return <Hours rows={data.hours} programs={data.programs} enrollments={data.enrollments} />;
  if (section === 'compliance')
    return <Compliance score={complianceScore} items={complianceItems} atRisk={atRisk.length} />;
  if (section === 'documents')
    return (
      <Documents
        rows={data.documents}
        isHvac={isHvac}
        requiresEnchantedHeartsTerms={data.requiresEnchantedHeartsTerms}
      />
    );
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
  if (section === 'settings')
    return (
      <Settings
        holder={data.holder}
        profile={data.profile}
        notificationPreferences={data.notificationPreferences}
        phone={data.profile?.phone || data.holder?.contact_phone || ''}
      />
    );

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">This week</p><h2 className="mt-1 text-2xl font-black text-slate-950">Your weekly responsibilities</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">This list is calculated from your live applicants, students, hours, reports, compliance record, agreement, and payout setup. Open an item to finish the work; do not mark work complete unless the record supports it.</p></div>
          <span className="rounded-full bg-white px-3 py-2 text-sm font-black text-emerald-900">{[
            callQueue.length === 0,
            pendingHours.length === 0,
            atRisk.length === 0,
            missingRequirements === 0,
            Boolean(data.holder?.mou_signed),
          ].filter(Boolean).length}/5 core checks clear</span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {[
            { label: 'Contact every new applicant', detail: callQueue.length ? `${callQueue.length} applicant${callQueue.length === 1 ? '' : 's'} still need a documented call/outcome.` : 'Every routed applicant has a documented call/outcome.', done: callQueue.length === 0, href: '/program-holder/students/pending' },
            { label: 'Review and verify training hours', detail: pendingHours.length ? `${pendingHours.length} hour entr${pendingHours.length === 1 ? 'y' : 'ies'} need review.` : 'No submitted training-hour records are waiting for review.', done: pendingHours.length === 0, href: '/program-holder/hours' },
            { label: 'Follow up with students needing attention', detail: atRisk.length ? `${atRisk.length} student${atRisk.length === 1 ? '' : 's'} currently need intervention or follow-up.` : 'No active students are currently flagged at risk.', done: atRisk.length === 0, href: '/program-holder/students/at-risk' },
            { label: 'Clear documents and compliance', detail: missingRequirements ? `${missingRequirements} required compliance item${missingRequirements === 1 ? '' : 's'} remain incomplete.` : 'Required compliance checks are currently complete.', done: missingRequirements === 0, href: '/program-holder/compliance' },
            { label: 'Review your actual agreement and payment readiness', detail: data.holder?.mou_signed ? 'Your MOU is recorded as signed. Review payout milestones and payment history against that agreement.' : 'Your assigned MOU still requires signature before agreement-controlled payment milestones can be completed.', done: Boolean(data.holder?.mou_signed), href: data.holder?.mou_signed ? '/program-holder/payouts' : '/program-holder/sign-mou' },
          ].map((item) => <Link key={item.label} href={item.href} className="flex min-w-0 gap-3 rounded-2xl border border-emerald-100 bg-white p-4 hover:border-emerald-300"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${item.done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{item.done ? '✓' : '!'}</span><span className="min-w-0"><span className="block font-black text-slate-950">{item.label}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{item.detail}</span><span className="mt-2 block text-xs font-black text-blue-800">{item.done ? 'Review record' : 'Open required action'} →</span></span></Link>)}
        </div>
      </section>
      {texasLaunchKit}
      {regionalAssignment && customMou ? (
        <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm sm:p-6">
          <p class…10891 tokens truncated…">
            Manage enrollment, instruction, compliance, records, reporting, and payouts for{' '}
            {programLabel}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-emerald-100">
              Account {status.replaceAll('_', ' ')}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-white">{programLabel}</span>
            <span className="rounded-full bg-blue-400/20 px-3 py-1.5 text-blue-100">
              Compliance {complianceScore}%
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          {isPortrait ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/80 bg-white shadow-xl">
              <Image src={heroImage} alt={title} fill sizes="96px" className="object-cover object-top" />
            </div>
          ) : null}
          <Link
            href="/program-holder/hours"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm sm:w-auto"
          >
            Record training hours
          </Link>
        </div>
      </div>
    </section>
  );
}

function ActionLink({
  href,
  icon,
  title,
  detail,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: 'amber' | 'blue' | 'violet' | 'emerald';
}) {
  const colors = {
    amber: 'bg-amber-50 text-amber-800',
    blue: 'bg-blue-50 text-blue-800',
    violet: 'bg-violet-50 text-violet-800',
    emerald: 'bg-emerald-50 text-emerald-800',
  };
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-slate-950">{title}</span>
        <span className="block truncate text-sm text-slate-600">{detail}</span>
      </span>
      <span
        aria-hidden="true"
        className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
      >
        →
      </span>
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

function voucherStatus(row: any) {
  const paid =
    Boolean(row.voucher_paid_date) ||
    Number(row.amount_paid_cents || 0) > 0 ||
    ['paid', 'completed', 'succeeded'].includes(String(row.payment_status || '').toLowerCase());
  if (paid) return 'Paid';

  const verified = Boolean(row.voucher_issued_date) || row.funding_verified === true;
  return verified ? 'Voucher verified' : 'Voucher pending';
}

function expectedPaymentStatus(row: any) {
  const cents = Number(row.expected_payout_cents || 0);
  if (cents <= 0) return 'Not projected';

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
  const status =
    row.expected_payout_status === 'pending_voucher_payment'
      ? 'pending voucher/payment'
      : String(row.expected_payout_status || 'projected').replaceAll('_', ' ');
  return `${amount} — ${status}`;
}

function completionStatus(row: any) {
  const state = String(row.enrollment_state || row.status || '').toLowerCase();
  if (
    Boolean(row.completed_at) ||
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

function EnrollmentTable({ rows, programs }: { rows: any[]; programs: any[] }) {
  return (
    <div className="mt-5 min-w-0">
      <div className="grid gap-3 md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <article
              key={row.id}
              data-testid="student-card"
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"
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
                <Row label="Voucher" value={voucherStatus(row)} />
                <Row label="Expected payment" value={expectedPaymentStatus(row)} />
                <Row label="Completion" value={completionStatus(row)} />
                <Row
                  label="Training"
                  value={`${row.training_start_date || 'Start missing'} — ${row.training_end_date || 'End missing'}`}
                />
                <Row label="Next action" value={row.next_required_action || 'Continue training'} />
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
                <StudentCommunicationActions
                  enrollmentId={row.id}
                  studentName={row.full_name || 'Student'}
                  hasEmail={Boolean(row.email)}
                  hasPhone={Boolean(row.phone)}
                />
                <StudentReadyForTestingButton
                  studentId={row.id}
                  studentName={row.full_name || 'Student'}
                  source={row.roster_source === 'holder_student' ? 'holder_student' : 'enrollment'}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            No confirmed student enrollments are linked.
          </div>
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Student</th>
              <th className="px-3 py-3">Program</th>
              <th className="px-3 py-3">Voucher</th>
              <th className="px-3 py-3">Expected payment</th>
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
                <tr key={row.id} data-testid="student-row">
                  <td className="px-3 py-4">
                    <p className="font-bold">{row.full_name || 'Student'}</p>
                    <p className="text-xs text-slate-500">{row.email || ''}</p>
                  </td>
                  <td className="px-3 py-4">
                    {programTitle(programs, row.program_id, row.program_slug)}
                  </td>
                  <td className="px-3 py-4 font-bold">{voucherStatus(row)}</td>
                  <td className="px-3 py-4 font-bold">{expectedPaymentStatus(row)}</td>
                  <td className="px-3 py-4 font-bold">{completionStatus(row)}</td>
                  <td className="px-3 py-4 font-bold">{Number(row.progress_percent || 0)}%</td>
                  <td className="px-3 py-4 font-bold">
                    {Math.min(48, Number(row.total_hours_completed || 0))} / 48
                  </td>
                  <td className="px-3 py-4 text-xs">
                    <span className="block">Start: {row.training_start_date || 'Missing'}</span>
                    <span className="block">End: {row.training_end_date || 'Missing'}</span>
                  </td>
                  <td className="px-3 py-4">{row.next_required_action || 'Continue training'}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <StudentCommunicationActions
                        enrollmentId={row.id}
                        studentName={row.full_name || 'Student'}
                        hasEmail={Boolean(row.email)}
                        hasPhone={Boolean(row.phone)}
                      />
                      <StudentReadyForTestingButton
                        studentId={row.id}
                        studentName={row.full_name || 'Student'}
                        source={
                          row.roster_source === 'holder_student' ? 'holder_student' : 'enrollment'
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
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
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
        <EnrollmentTable rows={rows} programs={programs} />
      </section>
      <ProgramHolderStudentCloseoutForm enrollments={rows} />
    </div>
  );
}
function Applicants({
  rows,
  programs,
  contactAccessGranted,
}: {
  rows: any[];
  programs: any[];
  contactAccessGranted: boolean;
}) {
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
        {contactAccessGranted ? <CallListPanel applicants={rows} /> : null}
      </section>
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
                    <p className="font-medium">{row.applicant_phone || 'No phone on file'}</p>
                    <div className="mt-1 flex gap-2">
                      {row.applicant_phone && (
                        <a className="font-bold text-blue-700" href={`tel:${row.applicant_phone}`}>
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
  if (fundingTags.length) return `${fundingTags.join(', ')} may be available; verify written approval`;
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
    Number(value) > 0 ? Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : null;
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
                    <Row
                      label="Career pay"
                      value={formatCareerPay(program)}
                    />
                    <Row label="Course assignments" value={String(courses.length)} />
                    <Row label="Delivery" value={program.delivery_method || 'Confirm with the program team'} />
                    <Row label="Duration" value={program.estimated_weeks ? `${program.estimated_weeks} estimated weeks` : 'Confirm schedule with the program team'} />
                  </dl>
                  <p className="mt-5 text-sm leading-6 text-slate-700">
                    {program.full_description || program.description || program.short_description || 'Ask the program team for the approved course outline before recruiting.'}
                  </p>
                  {Array.isArray(program.what_you_learn) && program.what_you_learn.length > 0 && (
                    <div className="mt-3 text-sm text-slate-700">
                      <p className="font-bold">What students learn</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {program.what_you_learn.map((topic: string, index: number) => <li key={`${program.id}-${index}`}>{topic}</li>)}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-xs font-bold text-slate-600">
                    Indiana WIOA status: {program.etpl_listed || program.wioa_approved
                      ? 'Internal record has a funding flag; confirm this exact program and location on Indiana INTraining before offering a funded seat.'
                      : 'Indiana ETPL approval has not been verified in this workspace. Treat as self-pay until WorkOne confirms eligibility in writing.'}
                  </p>
                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                    <strong>Student payment conversation:</strong> confirm whether Elevate has documented
                    funding approval before describing a program as funded. Otherwise explain the published
                    self-pay amount. Students may use the payment options shown at checkout; eligible applicants
                    can request a buy-now-pay-later decision, including Affirm when offered. Approval is made by
                    the payment provider, not by the Program Holder.
                  </div>
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
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <span className="font-semibold">
                  {item.label}
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    {item.required ? 'Required' : 'Recommended'} · Owner: {item.owner}
                  </span>
                </span>
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
function Documents({
  rows,
  isHvac,
  requiresEnchantedHeartsTerms,
}: {
  rows: any[];
  isHvac: boolean;
  requiresEnchantedHeartsTerms: boolean;
}) {
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Compliance Records"
        title="Documents"
        description="Upload and track protected Program Holder onboarding records for program delivery and payment readiness."
      />
      <ProgramHolderDocumentUpload isHvac={isHvac} />
      <ProgramHolderAcknowledgements requiresEnchantedHeartsTerms={requiresEnchantedHeartsTerms} />
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
