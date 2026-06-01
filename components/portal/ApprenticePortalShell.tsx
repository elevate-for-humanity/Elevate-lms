import Link from 'next/link';
import Image from 'next/image';
import {
  Scissors,
  Clock,
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
  XCircle,
  CreditCard,
  GraduationCap,
  Wrench,
  ChefHat,
  Zap,
  CalendarDays,
  ClipboardCheck,
  MapPin,
  Hammer,
  Droplets,
} from 'lucide-react';

export interface ApprenticePortalConfig {
  programSlug: string;
  label: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
  heroImage: string;
  shopLabel: string;
  requiredOjl: number;
  requiredRti: number;
  portalPath: string; // e.g. /portal/barber
}

export const APPRENTICE_PORTAL_CONFIGS: Record<string, ApprenticePortalConfig> = {
  'barber-apprenticeship': {
    programSlug: 'barber-apprenticeship',
    label: 'Barber Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-600',
    heroImage: '/images/pages/barber-hero.webp',
    shopLabel: 'Barber Shop',
    requiredOjl: 1500,
    requiredRti: 500,
    portalPath: '/portal/barber',
  },
  'cosmetology-apprenticeship': {
    programSlug: 'cosmetology-apprenticeship',
    label: 'Cosmetology Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-pink-500',
    accentText: 'text-pink-600',
    heroImage: '/images/pages/cosmetology-hero.webp',
    shopLabel: 'Salon',
    requiredOjl: 1500,
    requiredRti: 500,
    portalPath: '/portal/cosmetology',
  },
  'esthetician-apprenticeship': {
    programSlug: 'esthetician-apprenticeship',
    label: 'Esthetician Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-rose-500',
    accentText: 'text-rose-600',
    heroImage: '/images/pages/esthetician.webp',
    shopLabel: 'Spa / Salon',
    requiredOjl: 525,
    requiredRti: 175,
    portalPath: '/portal/esthetician',
  },
  'nail-technician-apprenticeship': {
    programSlug: 'nail-technician-apprenticeship',
    label: 'Nail Technician Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-fuchsia-500',
    accentText: 'text-fuchsia-600',
    heroImage: '/images/pages/nail-technician.webp',
    shopLabel: 'Nail Salon',
    requiredOjl: 400,
    requiredRti: 100,
    portalPath: '/portal/nail-technician',
  },
  'culinary-apprenticeship': {
    programSlug: 'culinary-apprenticeship',
    label: 'Culinary Apprenticeship',
    icon: ChefHat,
    accentBg: 'bg-orange-500',
    accentText: 'text-orange-600',
    heroImage: '/images/pages/culinary.webp',
    shopLabel: 'Kitchen',
    requiredOjl: 3000,
    requiredRti: 500,
    portalPath: '/portal/culinary',
  },
  'electrical': {
    programSlug: 'electrical',
    label: 'Electrical Apprenticeship',
    icon: Zap,
    accentBg: 'bg-yellow-500',
    accentText: 'text-yellow-600',
    heroImage: '/images/pages/electrical.webp',
    shopLabel: 'Job Site',
    requiredOjl: 7000,
    requiredRti: 1000,
    portalPath: '/portal/electrical',
  },
  'plumbing': {
    programSlug: 'plumbing',
    label: 'Plumbing Apprenticeship',
    icon: Droplets,
    accentBg: 'bg-blue-500',
    accentText: 'text-blue-600',
    heroImage: '/images/pages/plumbing-pipes.webp',
    shopLabel: 'Job Site',
    requiredOjl: 7000,
    requiredRti: 1000,
    portalPath: '/portal/plumbing',
  },
};

export const SLUG_TO_PORTAL: Record<string, string> = Object.fromEntries(
  Object.values(APPRENTICE_PORTAL_CONFIGS).map((c) => [c.programSlug, c.portalPath]),
);

interface Props {
  config: ApprenticePortalConfig;
  firstName: string;
  fullName?: string;
  shopName?: string | null;
  enrollment: {
    id: string;
    enrollment_state: string;
    orientation_completed_at?: string | null;
    stripe_subscription_id?: string | null;
    stripe_subscription_status?: string | null;
  } | null;
  hours: { ojl: number; rti: number };
  docs: { document_type: string; status: string; verification_status: string }[];
  billing?: {
    weeklyPaymentCents: number | null;
    remainingBalance: number | null;
    setupFeePaid: boolean;
    fullyPaid: boolean;
    paymentStatus: string | null;
    bnplProvider: string | null;
  } | null;
  transferHoursClaimed?: number;
  transferHoursVerified?: number | null;
  hoursRemainingDisplay?: number;
  apprentice?: unknown;
}

export function ApprenticePortalShell({
  config,
  firstName,
  shopName,
  enrollment,
  hours,
  docs,
  billing = null,
  transferHoursClaimed = 0,
  transferHoursVerified = null,
  hoursRemainingDisplay,
}: Props) {
  const ProgramIcon = config.icon;

  const requiredOjl = config.requiredOjl;
  const requiredRti = config.requiredRti;
  const ojlPercent = requiredOjl > 0 ? Math.min((hours.ojl / requiredOjl) * 100, 100) : 0;
  const rtiPercent = requiredRti > 0 ? Math.min((hours.rti / requiredRti) * 100, 100) : 0;
  const totalHours = hours.ojl + hours.rti;
  const totalRequired = requiredOjl + requiredRti;
  const overallPercent = totalRequired > 0 ? Math.min((totalHours / totalRequired) * 100, 100) : 0;
  const weeksComplete = Math.floor(totalHours / 40);
  const weeksTotal = Math.ceil(totalRequired / 40);

  const hasPhotoId = docs.some((d) => d.document_type === 'photo_id');
  const hasResidency = docs.some(
    (d) => d.document_type === 'proof_of_residency' || d.document_type === 'other',
  );
  const docsApproved =
    docs.length > 0 && docs.every((d) => d.status === 'approved' || d.verification_status === 'verified');
  const hasPaidEnrollment =
    !!enrollment?.stripe_subscription_id || billing?.setupFeePaid || billing?.fullyPaid;
  const subStatus =
    enrollment?.stripe_subscription_status ?? billing?.paymentStatus ?? null;
  const weeklyPaymentLabel =
    billing?.weeklyPaymentCents != null && billing.weeklyPaymentCents > 0
      ? (billing.weeklyPaymentCents / 100).toFixed(2)
      : '151.03';
  const needsPaymentMethod =
    !!enrollment &&
    !billing?.fullyPaid &&
    (subStatus === 'pending_payment_method' ||
      subStatus === 'past_due' ||
      subStatus === 'incomplete' ||
      subStatus === 'incomplete_expired' ||
      (!enrollment.stripe_subscription_id && !billing?.setupFeePaid));
  const showPaymentSetupAlert =
    !!enrollment && !billing?.fullyPaid && !enrollment.stripe_subscription_id && !billing?.setupFeePaid;
  const transferCredit =
    transferHoursVerified != null && transferHoursVerified > 0
      ? transferHoursVerified
      : transferHoursClaimed;
  const showTransferCredit = transferCredit > 0;

  const onboardingItems = [
    { label: 'Orientation completed', done: !!enrollment?.orientation_completed_at, href: '/apprentice/handbook' },
    { label: 'Photo ID uploaded', done: hasPhotoId, href: '/apprentice/documents' },
    { label: 'Proof of residency uploaded', done: hasResidency, href: '/apprentice/documents' },
    { label: 'Documents approved', done: docsApproved, href: '/apprentice/documents' },
    {
      label: 'Payment method on file',
      done: hasPaidEnrollment && !needsPaymentMethod && !showPaymentSetupAlert,
      href: '/apprentice/billing',
    },
  ];
  const onboardingComplete = onboardingItems.every((i) => i.done);
  const completedCount = onboardingItems.filter((i) => i.done).length;

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', href: config.portalPath },
    { id: 'hours', label: 'Hours', href: '/apprentice/hours' },
    { id: 'timeclock', label: 'Timeclock', href: '/apprentice/timeclock' },
    { id: 'competencies', label: 'Competencies', href: '/apprentice/competencies' },
    { id: 'documents', label: 'Documents', href: '/apprentice/documents' },
    { id: 'billing', label: 'Billing', href: '/apprentice/billing' },
    { id: 'handbook', label: 'Handbook', href: '/apprentice/handbook' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-[180px] sm:h-[220px] overflow-hidden bg-slate-900">
        <Image
          src={config.heroImage}
          alt={config.label}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          placeholder="empty"
        />
        <div className="relative z-20 h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center">
          <div className="bg-black/40 rounded-xl px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-11 h-11 ${config.accentBg} rounded-xl flex items-center justify-center shadow-lg`}>
                <ProgramIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs uppercase tracking-widest font-medium">
                  Indiana Registered Apprenticeship
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{config.label}</h1>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-2">
              Welcome back, <strong>{firstName}</strong> · Week {weeksComplete + 1} of {weeksTotal}
              {shopName && (
                <span className="ml-2 text-white/60">· {config.shopLabel}: <span className="text-white/90 font-medium">{shopName}</span></span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
            {navTabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab.id === 'dashboard'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Payment alert — no subscription at all */}
        {showPaymentSetupAlert && (
          <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
            <div className="p-4 flex items-start gap-3 border-b border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">Action required — payment method needed</p>
                <p className="text-red-700 text-xs mt-0.5">
                  A card is required to stay enrolled. Your tuition is billed weekly — without a card on file your enrollment will be paused and your hours will stop counting.
                </p>
              </div>
              <Link
                href="/apprentice/billing"
                className={`${config.accentBg} text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition shrink-0`}
              >
                Set Up Payment
              </Link>
            </div>
            <ol className="p-4 space-y-2.5">
              {[
                { n: 1, text: 'Click "Set Up Payment" above — you\'ll be taken to a secure Stripe page.' },
                { n: 2, text: 'Enter your debit or credit card number, expiration date, and CVC.' },
                { n: 3, text: 'Click "Save" — Stripe will verify your card. No charge happens yet.' },
                {
                  n: 4,
                  text: `Return here. Your first weekly payment of $${weeklyPaymentLabel} will process on the next billing date.`,
                },
              ].map(({ n, text }) => (
                <li key={n} className="flex items-start gap-3 text-xs text-red-800">
                  <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 font-bold flex items-center justify-center shrink-0 text-[11px]">{n}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Payment alert — subscription exists but payment action needed */}
        {needsPaymentMethod && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="p-4 flex items-start gap-3 border-b border-amber-200">
              <CreditCard className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 text-sm">
                  {subStatus === 'past_due'
                    ? 'Action required — payment past due'
                    : 'Action required — add a card to activate your plan'}
                </p>
                <p className="text-amber-700 text-xs mt-0.5">
                  {subStatus === 'past_due'
                    ? 'Your weekly tuition payment failed — this usually happens when a card expires or has insufficient funds. Update your card now so your enrollment stays active and your hours keep counting toward your license.'
                    : 'A card is required to stay enrolled. Your tuition is billed weekly — without a card on file your enrollment will be paused and your hours will stop counting.'}
                </p>
              </div>
              <Link
                href="/apprentice/billing"
                className={`${config.accentBg} text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition shrink-0`}
              >
                {subStatus === 'past_due' ? 'Update Card' : 'Add Card'}
              </Link>
            </div>
            <ol className="p-4 space-y-2.5">
              {(subStatus === 'past_due'
                ? [
                    { n: 1, text: 'Click "Update Card" above — you\'ll be taken to a secure Stripe page.' },
                    { n: 2, text: 'Under "Payment methods," add a new debit or credit card.' },
                    { n: 3, text: 'Set it as your default payment method.' },
                    { n: 4, text: 'Stripe will automatically retry the failed payment within 24 hours.' },
                    { n: 5, text: 'Once the payment clears, your dashboard will update and this alert will disappear.' },
                  ]
                : [
                    { n: 1, text: 'Click "Add Card" above — you\'ll be taken to a secure Stripe page.' },
                    { n: 2, text: 'Enter your debit or credit card number, expiration date, and CVC.' },
                    { n: 3, text: 'Click "Save" — Stripe will verify your card. No charge happens yet.' },
                    { n: 4, text: 'Your first weekly payment will process automatically on the next billing date.' },
                    { n: 5, text: 'Return here — this alert will disappear once your card is on file.' },
                  ]
              ).map(({ n, text }) => (
                <li key={n} className="flex items-start gap-3 text-xs text-amber-800">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 font-bold flex items-center justify-center shrink-0 text-[11px]">{n}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {showTransferCredit && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Transfer hours on file</p>
            <p className="text-sm text-amber-800 mt-1">
              {transferHoursVerified != null && transferHoursVerified > 0 ? (
                <>
                  <strong>{transferHoursVerified.toLocaleString()} hours</strong> verified toward your
                  apprenticeship — about{' '}
                  <strong>
                    {(hoursRemainingDisplay ?? config.requiredOjl + config.requiredRti).toLocaleString()}
                  </strong>{' '}
                  hours remaining in the program.
                </>
              ) : (
                <>
                  You reported <strong>{transferHoursClaimed.toLocaleString()} hours</strong> at enrollment.
                  Staff will verify your documentation and apply credit. Until verified, progress is tracked
                  against the full {(config.requiredOjl + config.requiredRti).toLocaleString()} hour requirement.
                </>
              )}
            </p>
            <Link
              href="/apprentice/transfer-hours"
              className="inline-block mt-2 text-xs font-semibold text-amber-900 hover:underline"
            >
              View transfer hours →
            </Link>
          </div>
        )}

        {billing && !billing.fullyPaid && billing.remainingBalance != null && billing.remainingBalance > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Tuition balance</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {billing.bnplProvider
                  ? `Payment plan via ${billing.bnplProvider}`
                  : 'Weekly payment plan'}
                {billing.weeklyPaymentCents
                  ? ` · $${weeklyPaymentLabel}/week`
                  : ''}
              </p>
            </div>
            <p className="text-lg font-bold text-slate-900">
              $
              {Number(billing.remainingBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-sm font-normal text-slate-500"> remaining</span>
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: 'Total Hours', value: totalHours.toLocaleString(), sub: `of ${totalRequired.toLocaleString()} required` },
            { icon: CalendarDays, label: 'Weeks', value: weeksComplete.toString(), sub: `of ${weeksTotal} complete` },
            { icon: ClipboardCheck, label: 'Onboarding', value: `${completedCount}/${onboardingItems.length}`, sub: onboardingComplete ? 'Complete' : 'In progress' },
            { icon: TrendingUp, label: 'Progress', value: `${Math.round(overallPercent)}%`, sub: 'toward completion' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${config.accentText}`} />
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Hour Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">On-the-Job Learning (OJL)</span>
                <span className="text-sm font-bold text-slate-900">{hours.ojl.toLocaleString()} / {requiredOjl.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${config.accentBg} rounded-full transition-all duration-700`} style={{ width: `${ojlPercent}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{Math.max(0, requiredOjl - hours.ojl).toLocaleString()} hours remaining</p>
            </div>
            {requiredRti > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Related Technical Instruction (RTI)</span>
                  <span className="text-sm font-bold text-slate-900">{hours.rti.toLocaleString()} / {requiredRti.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${rtiPercent}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{Math.max(0, requiredRti - hours.rti).toLocaleString()} hours remaining</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions + onboarding */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <Link href="/apprentice/timeclock" className={`flex items-center gap-3 p-3 rounded-lg ${config.accentBg} text-white hover:opacity-90 transition`}>
                <Clock className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">Clock In / Out</p>
                  <p className="text-xs text-white/80">Start or end your shift</p>
                </div>
              </Link>
              <Link href="/apprentice/hours/log" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <TrendingUp className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Log Hours</p>
                  <p className="text-xs text-slate-500">Record OJL or RTI hours</p>
                </div>
              </Link>
              <Link href="/apprentice/competencies/log" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <Award aria-label="award" className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Log Service</p>
                  <p className="text-xs text-slate-500">Record a competency</p>
                </div>
              </Link>
              <Link href="/apprentice/documents" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <FileText className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Upload Document</p>
                  <p className="text-xs text-slate-500">Submit required files</p>
                </div>
              </Link>
              <Link href="/apprentice/state-board" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <GraduationCap aria-label="graduationcap" className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">State Board Prep</p>
                  <p className="text-xs text-slate-500">Exam preparation</p>
                </div>
              </Link>
              <Link href="/apprentice/billing" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <CreditCard className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Billing</p>
                  <p className="text-xs text-slate-500">Payments & invoices</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Onboarding checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Onboarding{' '}
              {onboardingComplete && <span className="text-brand-green-600 ml-1">✓ Complete</span>}
            </h2>
            <ul className="space-y-2.5">
              {onboardingItems.map((item) =>
                item.done ? (
                  <li key={item.label} className="flex items-center gap-2.5 text-sm text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-brand-green-500 inline-block flex-shrink-0" aria-hidden="true" />
                    <span className="line-through">{item.label}</span>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link href={item.href} className="flex items-center gap-2.5 text-sm text-slate-800 hover:text-slate-900 group">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="group-hover:underline">{item.label}</span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Resources */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/apprentice/skills" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition">
            <Award aria-label="award" className={`w-5 h-5 ${config.accentText} mb-2`} />
            <p className="font-semibold text-sm text-slate-900">Skills Checklist</p>
            <p className="text-xs text-slate-500 mt-0.5">Track competency mastery</p>
          </Link>
          <Link href="/apprentice/handbook" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition">
            <BookOpen className={`w-5 h-5 ${config.accentText} mb-2`} />
            <p className="font-semibold text-sm text-slate-900">Handbook</p>
            <p className="text-xs text-slate-500 mt-0.5">Rules & guidelines</p>
          </Link>
          <Link href="/apprentice/transfer-hours" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition">
            <MapPin className={`w-5 h-5 ${config.accentText} mb-2`} />
            <p className="font-semibold text-sm text-slate-900">Transfer Hours</p>
            <p className="text-xs text-slate-500 mt-0.5">Request hour transfers</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
