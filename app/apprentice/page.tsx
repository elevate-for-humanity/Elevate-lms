import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Clock, FileText, Award, BookOpen, ArrowRight, Scissors, AlertTriangle, CreditCard, XCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getNextRequiredAction } from '@/lib/enrollment/gate';
import { getApprenticeshipRequiredHours } from '@/lib/compliance/apprenticeship';
import { listUnifiedEnrollments, resolveLatestEnrollment } from '@/lib/enrollment/resolver';

export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship progress, hours, and certifications.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apprentice',
  },
};

export const dynamic = 'force-dynamic';

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  const { data: barberEnrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('program_slug', 'barber-apprenticeship')
    .limit(1)
    .maybeSingle();

  if (!barberEnrollment) {
    const { data: barberSub } = await supabase
      .from('barber_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (barberSub) {
      redirect('/portal/barber');
    }
  } else {
    redirect('/portal/barber');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const enrollment = await resolveLatestEnrollment({
    client: supabase,
    userId: user.id,
    prefer: 'program_enrollments',
  });

  // Get next required action based on real enrollment state
  const nextAction = enrollment ? getNextRequiredAction({
    status: enrollment.status,
    orientation_completed_at: enrollment.orientationCompletedAt,
    documents_submitted_at: enrollment.documentsSubmittedAt,
    program_slug: enrollment.programSlug ?? undefined,
  }) : { label: 'Apply to a Program', href: '/programs', description: 'Start your journey' };

  const enrollments = await listUnifiedEnrollments(supabase, user.id, 5);

  // Hours source — barber/cosmetology students use hour_entries (approved).
  // Legacy students use attendance_hours linked to their training_enrollments row.
  const { data: attendanceHoursData } = await supabase
    .from('attendance_hours')
    .select('hours_logged')
    .eq('enrollment_id', enrollment?.id ?? '');

  const attendanceHours = attendanceHoursData?.reduce((sum, h) => sum + (h.hours_logged || 0), 0) || 0;

  let totalHours = attendanceHours;

  // Fallback: if no attendance hours (e.g. barber students who log via hour_entries),
  // sum approved hour_entries for this user instead.
  if (totalHours === 0) {
    const { data: hourEntries } = await supabase
      .from('hour_entries')
      .select('hours_claimed, accepted_hours')
      .eq('user_id', user.id)
      .eq('status', 'approved');

    const entryHours = (hourEntries || []).reduce(
      (sum, h) => sum + (Number(h.accepted_hours) || Number(h.hours_claimed) || 0),
      0,
    );
    if (entryHours > 0) totalHours = entryHours;
  }

  const programSlugForHours = enrollment?.programSlug ?? null;
  const requiredHours = getApprenticeshipRequiredHours(programSlugForHours);
  const hoursProgressPercent = requiredHours
    ? Math.min((totalHours / requiredHours) * 100, 100)
    : 0;

  // --- Payment alerts ---
  // Check for open Stripe invoices / missing payment method
  const hasSubscription = !!enrollment?.stripeSubscriptionId || !!(enrollment as any)?.stripe_subscription_id;
  const paymentStatus = (enrollment as any)?.payment_status ?? null;
  const amountPaidCents = (enrollment as any)?.amount_paid_cents ?? 0;

  // --- Onboarding checklist ---
  const orientationDone = !!(enrollment?.orientationCompletedAt);
  const documentsDone = !!(enrollment?.documentsSubmittedAt);
  const { data: rawDocs } = await supabase
    .from('documents')
    .select('id, document_type, status, verification_status')
    .eq('user_id', user.id);
  const docs = rawDocs ?? [];
  const hasPhotoId = docs.some(d => d.document_type === 'photo_id');
  const hasResidency = docs.some(d => d.document_type === 'other' || d.document_type === 'proof_of_residency');
  const docsApproved = docs.length > 0 && docs.every(d => d.status === 'approved' || d.verification_status === 'verified');
  const onboardingItems = [
    { label: 'Orientation completed', done: orientationDone, href: enrollment?.programSlug ? `/programs/${enrollment.programSlug}/orientation` : '/apprentice' },
    { label: 'Photo ID uploaded', done: hasPhotoId, href: '/apprentice/documents' },
    { label: 'Proof of residency uploaded', done: hasResidency, href: '/apprentice/documents' },
    { label: 'Documents approved', done: docsApproved, href: '/apprentice/documents' },
    { label: 'Payment method on file', done: hasSubscription, href: 'https://billing.stripe.com/p/session/live_YWNjdF8xT0tTVnlINGEyeXJWT3Q1LF9VWHRLRWVrSng2VjdNSEpCaFF1TFUwRnd4azJWa0d20100dmjZ1uiI' },
  ];
  const onboardingComplete = onboardingItems.every(i => i.done);
  const onboardingPending = onboardingItems.filter(i => !i.done);

  const quickLinks = [
    { name: 'Timeclock', href: '/apprentice/timeclock', icon: Clock, description: 'Clock in / out at your work site' },
    { name: 'Manage Payments', href: '/apprentice/billing', icon: CreditCard, description: 'Update payment method, view invoices' },
    { name: 'Shift History', href: '/apprentice/timeclock/history', icon: Clock, description: 'View all recorded shifts' },
    { name: 'Log Hours', href: '/apprentice/hours/log', icon: Clock, description: 'Manually record OJL & RTI hours' },
    { name: 'Hours History', href: '/apprentice/hours', icon: Clock, description: 'Review submitted hour entries' },
    { name: 'Competency Log', href: '/apprentice/competencies/log', icon: Scissors, description: 'Log a service for WPS credit' },
    { name: 'Competency Progress', href: '/apprentice/competencies', icon: Scissors, description: 'Track cuts, shaves & WPS skills' },
    { name: 'Documents', href: '/apprentice/documents', icon: FileText, description: 'View required documents' },
    { name: 'Skills Checklist', href: '/apprentice/skills', icon: Award, description: 'Track skill competencies' },
    { name: 'Handbook', href: '/apprentice/handbook', icon: BookOpen, description: 'Apprenticeship guidelines' },
    { name: 'Transfer Hours', href: '/apprentice/transfer-hours', icon: ArrowRight, description: 'Request hour transfers' },
    { name: 'State Board', href: '/apprentice/state-board', icon: GraduationCap, description: 'Exam preparation' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apprentice Portal' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── PAYMENT ALERT ── */}
        {!hasSubscription && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Payment Method Required</p>
              <p className="text-red-700 text-sm mt-1">
                You don&apos;t have automatic weekly payments set up. Your down payment credit will cover your weekly payments, but you need a card on file before it runs out.
              </p>
              <a
                href="https://billing.stripe.com/p/session/live_YWNjdF8xT0tTVnlINGEyeXJWT3Q1LF9VWHRLRWVrSng2VjdNSEpCaFF1TFUwRnd4azJWa0d20100dmjZ1uiI"
                className="inline-flex items-center gap-2 mt-3 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <CreditCard className="w-4 h-4" /> Add Payment Method
              </a>
            </div>
          </div>
        )}

        {/* ── ONBOARDING CHECKLIST ── */}
        {!onboardingComplete && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="font-semibold text-amber-800 text-sm">
                {onboardingPending.length} onboarding {onboardingPending.length === 1 ? 'item' : 'items'} still needed
              </p>
            </div>
            <ul className="space-y-2">
              {onboardingItems.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  {item.done ? (
                    <span className="w-4 h-4 rounded-full bg-brand-green-500 inline-block flex-shrink-0 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  {item.done ? (
                    <span className="text-slate-500 line-through">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="text-amber-800 font-medium hover:underline">
                      {item.label} →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* NEXT REQUIRED ACTION - Always visible at top */}
        <div className="bg-brand-blue-700 text-white rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium uppercase tracking-wide mb-1">Next Required Action</p>
              <h2 className="text-2xl font-bold">{nextAction.label}</h2>
              <p className="text-white mt-1">{nextAction.description}</p>
            </div>
            <Link
              href={nextAction.href}
              className="bg-white text-brand-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-50 transition flex items-center gap-2"
            >
              Start Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {profile?.full_name || 'Apprentice'}
          </h1>
          <p className="text-slate-600 mt-2">
            Track your apprenticeship journey and progress
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Hours Progress</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${hoursProgressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-medium text-slate-900">
              {requiredHours
                ? `${totalHours.toLocaleString()} / ${requiredHours.toLocaleString()} hours`
                : `${totalHours.toLocaleString()} hours logged`}
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <link.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">{link.name}</h3>
              <p className="text-sm text-slate-600">{link.description}</p>
            </Link>
          ))}
        </div>

        {/* Active Enrollments */}
        {enrollments && enrollments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Programs</h2>
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {enrollment.programTitle || (enrollment.courseId ? `Course ${enrollment.courseId}` : 'Program')}
                    </p>
                    <p className="text-sm text-slate-600">Status: {enrollment.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-brand-blue-600">{enrollment.progress || 0}%</p>
                    <p className="text-sm text-slate-600">Complete</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
