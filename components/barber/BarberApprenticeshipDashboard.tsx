import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Crown,
  FileText,
  GraduationCap,
  Lock,
  MapPin,
  Scissors,
  Star,
  TrendingUp,
  Trophy,
  User,
  XCircle,
} from 'lucide-react';
import type { BarberDashboardData } from '@/lib/barber/load-barber-dashboard';
import { PRESTIGE_BARBER_BRAND } from '@/lib/barber/branding';

const REQUIRED_OJL = 1500;
const REQUIRED_RTI = 500;

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', href: '/portal/barber' },
  { id: 'hours', label: 'Hours', href: '/apprentice/hours' },
  { id: 'timeclock', label: 'Timeclock', href: '/apprentice/timeclock' },
  { id: 'competencies', label: 'Competencies', href: '/apprentice/competencies' },
  { id: 'documents', label: 'Documents', href: '/apprentice/documents' },
  { id: 'billing', label: 'Billing', href: '/apprentice/billing' },
  { id: 'handbook', label: 'Handbook', href: '/apprentice/handbook' },
] as const;

type Props = BarberDashboardData;

export function BarberApprenticeshipDashboard({
  firstName,
  shopName,
  enrollment,
  hours,
  docs,
  nextAction,
  stats,
  lms,
}: Props) {
  const ojlPercent = Math.min((hours.ojl / REQUIRED_OJL) * 100, 100);
  const rtiPercent = Math.min((hours.rti / REQUIRED_RTI) * 100, 100);

  const hasSubscription = !!enrollment?.stripe_subscription_id;
  const subStatus = enrollment?.stripe_subscription_status ?? null;
  const needsPaymentMethod =
    hasSubscription &&
    ['pending_payment_method', 'past_due', 'incomplete', 'incomplete_expired'].includes(
      subStatus ?? '',
    );

  const hasPhotoId = docs.some((d) => d.document_type === 'photo_id');
  const hasResidency = docs.some(
    (d) => d.document_type === 'proof_of_residency' || d.document_type === 'other',
  );
  const docsApproved =
    docs.length > 0 &&
    docs.every((d) => d.status === 'approved' || d.verification_status === 'verified');

  const onboardingItems = [
    {
      label: 'Orientation completed',
      done: !!enrollment?.orientation_completed_at,
      href: '/programs/barber-apprenticeship/orientation',
    },
    { label: 'Photo ID uploaded', done: hasPhotoId, href: '/apprentice/documents' },
    { label: 'Proof of residency uploaded', done: hasResidency, href: '/apprentice/documents' },
    { label: 'Documents approved', done: docsApproved, href: '/apprentice/documents' },
    {
      label: 'Payment method on file',
      done: hasSubscription && !needsPaymentMethod,
      href: '/apprentice/billing',
    },
  ];
  const onboardingComplete = onboardingItems.every((i) => i.done);

  const quickNav = [
    { title: 'My Courses', sub: 'Prestige Elevation™ RTI', href: lms.coursePath, icon: BookOpen },
    { title: 'Practice Lab', sub: 'Competency sign-offs', href: '/apprentice/competencies', icon: Scissors },
    { title: 'Assignments', sub: 'Documents & tasks', href: '/apprentice/documents', icon: ClipboardList },
    { title: 'Achievements', sub: 'Badges & progress', href: '/lms/achievements', icon: Trophy },
    { title: 'My Profile', sub: 'Account settings', href: '/lms/settings/profile', icon: User },
  ];

  const heroStats = [
    { icon: GraduationCap, value: String(stats.rtiLessonsCompleted), label: 'RTI lessons done', sub: `of ${stats.rtiLessonsTotal}` },
    { icon: CheckCircle2, value: `${stats.overallProgressPercent}%`, label: 'Program progress', sub: 'OJT + RTI hours' },
    { icon: Star, value: String(stats.certificationsEarned), label: 'Credentials', sub: 'earned' },
    { icon: TrendingUp, value: String(stats.weeksRemaining), label: 'Weeks remaining', sub: 'at current pace' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-amber-950/30" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10">
                  <Crown className="h-5 w-5 text-amber-400" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase">
                    {PRESTIGE_BARBER_BRAND.instituteName}
                  </p>
                  <p className="text-[9px] tracking-widest text-zinc-500 uppercase">DOL Registered Apprenticeship</p>
                </div>
              </div>
              <p className="text-xs font-semibold tracking-[0.25em] text-amber-400 uppercase mb-1">
                Welcome back, {firstName}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold">
                <span className="text-white">ELEVATE </span>
                <span className="text-amber-400">YOUR FUTURE</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-300 max-w-lg">
                {PRESTIGE_BARBER_BRAND.motto} Track OJT at your host shop and RTI in Elevate LMS.
                {shopName ? (
                  <span className="block mt-1 text-amber-300/90">
                    Host shop: <span className="font-medium">{shopName}</span>
                  </span>
                ) : null}
              </p>
            </div>
            <div className="relative w-full lg:w-72 h-44 lg:h-auto min-h-[11rem] rounded-xl overflow-hidden border border-amber-500/20">
// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)
              <Image
                src="/images/pages/barber-professional.webp"
                alt=""
                fill
                className="object-cover"
                sizes="288px"
                priority
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-amber-500/20 bg-black/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {heroStats.map(({ icon: Icon, value, label, sub }) => (
              <div key={label} className="flex items-center gap-2 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/25">
                  <Icon className="h-4 w-4 text-amber-400" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-400/90 truncate">
                    {label}
                  </p>
                  <p className="text-[9px] text-zinc-500 truncate hidden sm:block">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick nav */}
      <div className="bg-zinc-950 border-b border-amber-500/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {quickNav.map(({ title, sub, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 hover:border-amber-500/40 transition"
            >
              <Icon className="h-5 w-5 text-amber-400 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-400/90">
                  {title}
                </span>
                <span className="block text-xs text-zinc-400 truncate">{sub}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" aria-hidden />
            </Link>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                tab.id === 'dashboard'
                  ? 'border-amber-600 text-amber-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Next action */}
        <div className="rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100/80 mb-1">Next step</p>
            <h2 className="text-xl font-bold">{nextAction.label}</h2>
            <p className="text-sm text-amber-50/90 mt-1">{nextAction.description}</p>
          </div>
          <Link
            href={nextAction.href}
            className="inline-flex items-center justify-center gap-2 bg-white text-amber-900 font-bold px-5 py-2.5 rounded-lg hover:bg-amber-50 transition shrink-0"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {(!hasSubscription || needsPaymentMethod) && enrollment && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Payment action required</p>
                <p className="text-red-700 text-xs mt-0.5">
                  Keep your card on file so weekly tuition and program access stay active.
                </p>
              </div>
            </div>
            <Link
              href="/apprentice/billing"
              className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 shrink-0 text-center"
            >
              {needsPaymentMethod ? 'Update card' : 'Set up payment'}
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* RTI / LMS card */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid sm:grid-cols-[140px_1fr] gap-0">
              <div className="relative aspect-[3/4] sm:aspect-auto sm:min-h-[220px] bg-zinc-900">
                <Image
                  src={lms.coverUrl}
                  alt={`${lms.title} curriculum cover`}
                  fill
                  className="object-cover object-top"
                  sizes="140px"
                />
              </div>
              <div className="p-5 flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                  Related technical instruction
                </p>
                <h2 className="text-lg font-bold text-slate-900">{lms.title}</h2>
                <p className="text-sm text-slate-600 mt-2 flex-1">
                  {stats.rtiLessonsTotal} lessons · video, reading, practice quizzes, and module
                  checkpoints. Completes your 500 RTI hours toward the 2,000-hour apprenticeship.
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Course progress</span>
                    <span className="font-semibold text-slate-800">{stats.courseProgressPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${stats.courseProgressPercent}%` }}
                    />
                  </div>
                </div>
                {lms.accessGranted ? (
                  <Link
                    href={lms.coursePath}
                    className="mt-4 inline-flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                  >
                    <BookOpen className="w-4 h-4" />
                    {stats.courseProgressPercent > 0 ? 'Continue RTI' : 'Start RTI course'}
                  </Link>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Complete onboarding documents to unlock LMS access.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Onboarding{' '}
              {onboardingComplete && (
                <span className="text-emerald-600 font-normal">· complete</span>
              )}
            </h2>
            <ul className="space-y-2.5">
              {onboardingItems.map((item) =>
                item.done ? (
                  <li key={item.label} className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="line-through">{item.label}</span>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 text-sm text-slate-800 hover:text-amber-800"
                    >
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="underline-offset-2 hover:underline">{item.label}</span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Hour progress (2,000 required)</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">On-the-job (OJT)</span>
                <span className="font-bold">
                  {hours.ojl.toLocaleString()} / {REQUIRED_OJL.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${ojlPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Related instruction (RTI)</span>
                <span className="font-bold">
                  {hours.rti.toLocaleString()} / {REQUIRED_RTI.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${rtiPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: '/apprentice/timeclock', label: 'Clock in / out', sub: 'GPS timeclock', icon: Clock, primary: true },
            { href: '/apprentice/hours/log', label: 'Log hours', sub: 'Manual OJT / RTI', icon: CalendarDays },
            { href: '/apprentice/competencies/log', label: 'Log service', sub: 'WPS competency', icon: Award },
            { href: '/apprentice/documents', label: 'Documents', sub: 'Upload & status', icon: FileText },
            { href: '/apprentice/state-board', label: 'State board prep', sub: 'Exam resources', icon: GraduationCap },
            { href: '/apprentice/transfer-hours', label: 'Transfer hours', sub: 'Prior experience', icon: MapPin },
          ].map(({ href, label, sub, icon: Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                primary
                  ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${primary ? 'text-white' : 'text-amber-600'}`} />
              <div>
                <p className={`font-semibold text-sm ${primary ? 'text-white' : 'text-slate-900'}`}>{label}</p>
                <p className={`text-xs ${primary ? 'text-amber-100' : 'text-slate-500'}`}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
