import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BookOpen,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import EnrollmentVoucherPanel from '@/components/admin/EnrollmentVoucherPanel';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Student Profile | Admin',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtUsd(cents: number) {
  if (!cents) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  enrolled: 'bg-teal-100 text-teal-800',
  completed: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  submitted: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  at_risk: 'bg-red-100 text-red-800',
  inactive: 'bg-slate-100 text-slate-500',
};

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-400 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 flex-1">{value || '—'}</span>
    </div>
  );
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const db = await requireAdminClient();
  // Load student profile
  const { data: student } = await db
    .from('profiles')
    .select(
      'id, full_name, first_name, last_name, email, phone, address, city, state, zip, created_at, updated_at, enrollment_status, is_active, onboarding_completed, funding_source, student_number, date_of_birth, emergency_contact_name, emergency_contact_phone, last_login_at',
    )
    .eq('id', id)
    .eq('role', 'student')
    .maybeSingle();

  if (!student) notFound();

  // Load enrollments, applications, lesson progress, barber subscription in parallel
  const [enrollmentsRes, applicationsRes, progressRes, barberSubRes] = await Promise.all([
    db
      .from('program_enrollments')
      .select(
        'id, status, enrolled_at, payment_status, amount_paid_cents, program_id, updated_at, program_slug, student_start_date, voucher_issued_date, voucher_paid_date, payout_due_date, payout_status, payout_paid_date, payout_sent_date, payout_amount, payout_notes',
      )
      .eq('user_id', id)
      .order('enrolled_at', { ascending: false }),

    db
      .from('applications')
      .select(
        'id, status, program_interest, program_slug, created_at, submitted_at, reviewed_at, review_notes, funding_type',
      )
      .eq('user_id', id)
      .order('created_at', { ascending: false }),

    db
      .from('lesson_progress')
      .select('id, completed', { count: 'exact' })
      .eq('user_id', id)
      .eq('completed', true),

    db
      .from('barber_subscriptions')
      .select(
        'id, status, payment_status, weekly_payment_cents, weeks_remaining, remaining_balance, full_tuition_amount, amount_paid_at_checkout, stripe_customer_id, stripe_subscription_id, customer_email, failed_payment_at, suspension_deadline, suspended_at, welcome_email_sent_at, dashboard_invite_sent_at, created_at',
      )
      .eq('user_id', id)
      .maybeSingle(),
  ]);

  if (enrollmentsRes.error) {
    logger.error('enrollments query failed', enrollmentsRes.error);
  }
  if (applicationsRes.error) {
    logger.error('applications query failed', applicationsRes.error);
  }

  const barberSub = barberSubRes.data ?? null;
  const enrollments = enrollmentsRes.data ?? [];
  const applications = applicationsRes.data ?? [];
  const completedLessons = progressRes.count ?? 0;

  // Fetch program names for enrollments
  const programIds = [...new Set(enrollments.map((e) => e.program_id).filter(Boolean))];
  const programNames: Record<string, string> = {};
  if (programIds.length > 0) {
    const { data: programs } = await db.from('programs').select('id, title').in('id', programIds);
    programs?.forEach((p: any) => {
      programNames[p.id] = p.title;
    });
  }

  const name =
    student.full_name ||
    [student.first_name, student.last_name].filter(Boolean).join(' ') ||
    'Unknown';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/dashboard" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/students" className="hover:text-slate-700">
          Students
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link
          href="/admin/students"
          className="mt-1 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge status={student.enrollment_status || 'inactive'} />
            {student.student_number && (
              <span className="text-xs text-slate-400 font-mono">#{student.student_number}</span>
            )}
            <span className="text-xs text-slate-400">Joined {fmtDate(student.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {student.email && (
            <a
              href={`mailto:${student.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          )}
          <Link
            href={`/admin/applications?search=${encodeURIComponent(student.email || '')}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> View Applications
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Profile info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Profile
            </h2>
            <InfoRow
              label="Email"
              value={
                student.email ? (
                  <a
                    href={`mailto:${student.email}`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {student.email} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null
              }
            />
            <InfoRow label="Phone" value={student.phone} />
            <InfoRow
              label="Location"
              value={[student.city, student.state].filter(Boolean).join(', ')}
            />
            <InfoRow label="Date of Birth" value={fmtDate(student.date_of_birth)} />
            <InfoRow label="Funding Source" value={student.funding_source} />
            <InfoRow
              label="Onboarding"
              value={
                student.onboarding_completed ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Clock className="w-3.5 h-3.5" /> Incomplete
                  </span>
                )
              }
            />
            <InfoRow label="Last Login" value={fmtDate(student.last_login_at)} />
          </div>

          {/* Emergency contact */}
          {(student.emergency_contact_name || student.emergency_contact_phone) && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Emergency Contact
              </h2>
              <InfoRow label="Name" value={student.emergency_contact_name} />
              <InfoRow label="Phone" value={student.emergency_contact_phone} />
            </div>
          )}
        </div>

        {/* Right: Enrollments, Applications, Progress */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Enrollments', value: enrollments.length, icon: BookOpen },
              { label: 'Applications', value: applications.length, icon: FileText },
              { label: 'Lessons Done', value: completedLessons, icon: CheckCircle },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center"
              >
                <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Enrollments */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" /> Enrollments
              </h2>
            </div>
            {enrollments.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-slate-400">No enrollments</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {enrollments.map((e) => (
                  <div key={e.id ?? 'enrollment'} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {programNames[e.program_id] || e.program_id?.slice(0, 8) || '—'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enrolled {fmtDate(e.enrolled_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {e.amount_paid_cents > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> {fmtUsd(e.amount_paid_cents)}
                        </span>
                      )}
                      <Badge status={e.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher & Payout Tracking — one panel per enrollment that has voucher activity */}
          {await Promise.all(
            enrollments
              .filter((e) => e.voucher_paid_date || e.voucher_issued_date || e.student_start_date)
              .map(async (e) => {
                const enrollmentId = e.id;
                const { data: auditRows } = enrollmentId
                  ? await supabase
                      .from('enrollment_voucher_audit')
                      .select(
                        'id, enrollment_id, changed_by, field_changed, old_value, new_value, changed_at, notes',
                      )
                      .eq('enrollment_id', enrollmentId)
                      .order('changed_at', { ascending: false })
                  : { data: [] };
                return (
                  <EnrollmentVoucherPanel
                    key={enrollmentId ?? 'voucher'}
                    data={{
                      enrollment_id: enrollmentId ?? '',
                      student_name: student.full_name ?? name,
                      program_name:
                        programNames[e.program_id] || e.program_slug || (enrollmentId ? enrollmentId.slice(0, 8) : '—'),
                      partner_name: null,
                      student_start_date: e.student_start_date,
                      voucher_issued_date: e.voucher_issued_date,
                      voucher_paid_date: e.voucher_paid_date,
                      payout_due_date: e.payout_due_date,
                      payout_status: e.payout_status ?? 'not_triggered',
                      payout_paid_date: e.payout_paid_date,
                      payout_paid_by_name: null,
                      payout_notes: e.payout_notes,
                      audit_log: auditRows ?? [],
                    }}
                  />
                );
              }),
          )}

          {/* Barber Billing Panel */}
          {barberSub && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Barber Apprenticeship Billing
                </h2>
                <Badge status={barberSub.payment_status ?? barberSub.status ?? 'unknown'} />
              </div>
              <div className="px-5 py-4 space-y-1">
                <InfoRow label="Weekly Payment" value={barberSub.weekly_payment_cents ? `$${(barberSub.weekly_payment_cents / 100).toFixed(2)} / week` : '—'} />
                <InfoRow label="Weeks Remaining" value={barberSub.weeks_remaining != null ? `${barberSub.weeks_remaining} weeks` : '—'} />
                <InfoRow label="Remaining Balance" value={barberSub.remaining_balance != null ? fmtUsd(barberSub.remaining_balance * 100) : barberSub.full_tuition_amount && barberSub.amount_paid_at_checkout ? fmtUsd((barberSub.full_tuition_amount - barberSub.amount_paid_at_checkout / 100) * 100) : '—'} />
                <InfoRow label="Paid at Checkout" value={barberSub.amount_paid_at_checkout ? fmtUsd(barberSub.amount_paid_at_checkout) : '—'} />
                <InfoRow label="Stripe Customer" value={barberSub.stripe_customer_id ? <a href={`https://dashboard.stripe.com/customers/${barberSub.stripe_customer_id}`} target="_blank" rel="noreferrer" className="text-brand-blue-600 hover:underline font-mono text-xs">{barberSub.stripe_customer_id}</a> : '—'} />
                <InfoRow label="Stripe Subscription" value={barberSub.stripe_subscription_id ? <a href={`https://dashboard.stripe.com/subscriptions/${barberSub.stripe_subscription_id}`} target="_blank" rel="noreferrer" className="text-brand-blue-600 hover:underline font-mono text-xs">{barberSub.stripe_subscription_id}</a> : <span className="text-amber-600 font-semibold">Not created</span>} />
                {barberSub.failed_payment_at && <InfoRow label="Last Failed Payment" value={fmtDate(barberSub.failed_payment_at)} />}
                {barberSub.suspension_deadline && <InfoRow label="Suspension Deadline" value={<span className="text-red-600 font-semibold">{fmtDate(barberSub.suspension_deadline)}</span>} />}
                {barberSub.suspended_at && <InfoRow label="Suspended At" value={fmtDate(barberSub.suspended_at)} />}
                <InfoRow label="Welcome Email" value={barberSub.welcome_email_sent_at ? <span className="text-emerald-600">Sent {fmtDate(barberSub.welcome_email_sent_at)}</span> : <span className="text-amber-600">Not sent</span>} />
                <InfoRow label="Dashboard Invite" value={barberSub.dashboard_invite_sent_at ? <span className="text-emerald-600">Sent {fmtDate(barberSub.dashboard_invite_sent_at)}</span> : <span className="text-amber-600">Not sent</span>} />
                <InfoRow label="Enrolled" value={fmtDate(barberSub.created_at)} />
              </div>
            </div>
          )}

          {/* Applications */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Applications
              </h2>
            </div>
            {applications.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-slate-400">No applications</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {applications.map((a) => {
                  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id);
                  const reviewHref = isUUID
                    ? `/admin/applications/review/${a.id}`
                    : `/admin/applications?search=${encodeURIComponent(a.email || a.id)}`;
                  return (
                  <Link
                    key={a.id}
                    href={reviewHref}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {a.program_interest || a.program_slug || 'Unknown program'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted {fmtDate(a.submitted_at || a.created_at)}
                        {a.funding_type && ` · ${a.funding_type}`}
                      </p>
                    </div>
                    <Badge status={a.status} />
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
