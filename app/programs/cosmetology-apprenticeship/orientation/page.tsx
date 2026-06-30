import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  CheckCircle,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Star,
  Award,
  Users,
  Scissors,
} from 'lucide-react';
import { COSMETOLOGY_PROGRAM_ID, COSMETOLOGY_COURSE_ID, TOTAL_HOURS_REQUIRED } from '@/lib/cosmetology/pricing';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Welcome to Your Cosmetology Apprenticeship | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Your orientation guide for the Elevate cosmetology apprenticeship program. Everything you need to start your first week.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const ORIENTATION_STEPS = [
  {
    number: 1,
    title: 'Complete Your Enrollment Documents',
    description:
      'Your enrollment packet has been sent to your email. Sign and return all documents within 48 hours to secure your placement.',
    action: { label: 'View Documents', href: '/portal/documents' },
    icon: BookOpen,
  },
  {
    number: 2,
    title: 'Meet Your Host Salon',
    description:
      'Your assigned host salon coordinator will contact you within 2 business days to schedule your first day and discuss your schedule.',
    action: null,
    icon: MapPin,
  },
  {
    number: 3,
    title: 'Set Up Your Student Portal',
    description:
      'Access your learning materials, track your hours, and submit weekly progress reports through your student dashboard.',
    action: { label: 'Go to Dashboard', href: '/learner/dashboard' },
    icon: Star,
  },
  {
    number: 4,
    title: 'Attend Your First Training Session',
    description:
      'Your first in-salon training session is scheduled based on your host salon\'s availability. Arrive 15 minutes early in professional attire.',
    action: null,
    icon: Calendar,
  },
];

const WHAT_TO_EXPECT = [
  {
    icon: Clock,
    title: `${TOTAL_HOURS_REQUIRED.toLocaleString()} Training Hours`,
    description: 'Spread across your apprenticeship period at your host salon.',
  },
  {
    icon: Scissors,
    title: 'Real Salon Experience',
    description: 'Haircuts, color, chemical services, and client management from day one.',
  },
  {
    icon: Award,
    title: 'Indiana State License',
    description: 'Upon completion, you sit for the Indiana cosmetology theory and practical exams.',
  },
  {
    icon: Users,
    title: 'Dedicated Coordinator',
    description: 'Your program coordinator is available throughout your apprenticeship for support.',
  },
];

const CHECKLIST = [
  'Government-issued photo ID',
  'Social Security card or proof of eligibility',
  'Completed enrollment agreement (sent via email)',
  'Emergency contact information',
  'Professional attire for your first day',
  'Cosmetology kit (provided by host salon — confirm with your coordinator)',
];

export default async function CosmetologyOrientationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/cosmetology-apprenticeship/orientation');
  }

  const db = await getAdminClient();

  // Load enrollment and subscription status
  let enrollmentStatus: string | null = null;
  let subscriptionStatus: string | null = null;
  let firstName = '';

  if (db) {
    const [enrollmentRes, profileRes, subRes] = await Promise.all([
      db
        .from('program_enrollments')
        .select('status, created_at')
        .eq('user_id', user.id)
        .eq('program_id', COSMETOLOGY_PROGRAM_ID)
        .maybeSingle(),
      db
        .from('profiles')
        .select('first_name, role')
        .eq('id', user.id)
        .maybeSingle(),
      db
        .from('cosmetology_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    enrollmentStatus = enrollmentRes.data?.status ?? null;
    firstName = profileRes.data?.first_name ?? '';
    subscriptionStatus = subRes.data?.status ?? null;

    // If not enrolled at all, redirect to program page
    if (!enrollmentStatus) {
      redirect('/programs/cosmetology-apprenticeship');
    }

    // Record orientation visit
    await db
      .from('orientation_completions')
      .upsert(
        {
          user_id: user.id,
          program_id: COSMETOLOGY_PROGRAM_ID,
          visited_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,program_id', ignoreDuplicates: false }
      )
      .select();
  }

  const greeting = firstName ? `Welcome, ${firstName}` : 'Welcome';

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 'clamp(340px, 42vw, 520px)' }}>
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/cosmetology-apprenticeship-hero.webp"
          alt="Cosmetology apprenticeship salon training"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw" placeholder="empty"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/85 via-brand-blue-800/60 to-transparent" />

        <div className="relative z-10 h-full flex items-center px-6 py-16 max-w-6xl mx-auto">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              <CheckCircle className="w-3.5 h-3.5" />
              Enrollment Confirmed
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {greeting}.<br />
              <span className="text-brand-red-400">Your journey starts here.</span>
            </h1>

            <p className="text-slate-200 text-lg leading-relaxed mb-8">
              You're officially enrolled in the Elevate Cosmetology Apprenticeship. This page walks you through everything you need to do before your first day.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/learner/dashboard"
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Go to My Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/portal/documents"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-900 font-semibold px-6 py-3 rounded-lg border border-white/20 transition-colors"
              >
                View My Documents
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ─────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: `${TOTAL_HOURS_REQUIRED.toLocaleString()}`, label: 'Training Hours' },
            { value: '29', label: 'Week Program' },
            { value: 'In-Person', label: 'Delivery' },
            { value: '1', label: 'State License' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Orientation Steps ────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Your Next Steps</p>
            <h2 className="text-3xl font-black text-slate-900">Complete These Before Day One</h2>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto">
              Work through each step in order. Your coordinator will confirm when everything is in place.
            </p>
          </div>

          <div className="space-y-4">
            {ORIENTATION_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-white rounded-xl border border-slate-200 p-6 flex gap-5 items-start shadow-sm"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-red-50 border-2 border-brand-red-200 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-brand-red-600 uppercase tracking-wider">Step {step.number}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                    {step.action && (
                      <Link
                        href={step.action.href}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
                      >
                        {step.action.label}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What to Expect ───────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Program Overview</p>
            <h2 className="text-3xl font-black text-slate-900">What to Expect</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHAT_TO_EXPECT.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-brand-red-100 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-brand-red-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── First Day Checklist ──────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">Preparation</p>
            <h2 className="text-3xl font-black text-white">First Day Checklist</h2>
            <p className="text-slate-400 mt-3">Bring these items to your first training session.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHECKLIST.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
                <CheckCircle className="w-5 h-5 text-brand-red-400 shrink-0 mt-0.5" />
                <span className="text-slate-200 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment Status ───────────────────────────────────────────── */}
      {subscriptionStatus && (
        <section className="py-10 px-6 bg-brand-green-50 border-y border-brand-green-200">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-brand-green-600 shrink-0" />
            <div>
              <p className="font-bold text-brand-green-900">Payment Plan Active</p>
              <p className="text-brand-green-700 text-sm">
                Your weekly payment plan is set up and active. You can view your payment schedule in your{' '}
                <Link href="/account/billing" className="underline font-semibold">billing settings</Link>.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Contact & Support ────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Support</p>
            <h2 className="text-3xl font-black text-slate-900">Questions? We're Here.</h2>
            <p className="text-slate-600 mt-3">Your program coordinator is available Monday–Friday, 9am–5pm EST.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <a
              href={`tel:+1${PLATFORM_DEFAULTS.supportPhone}`}
              className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-red-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-brand-red-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Call Us</p>
                <p className="text-slate-600 text-sm">{PLATFORM_DEFAULTS.supportPhone}</p>
              </div>
            </a>
            <a
              href={`mailto:programs@${PLATFORM_DEFAULTS.canonicalDomain}`}
              className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-red-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-red-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Email Us</p>
                <p className="text-slate-600 text-sm">{`programs@${PLATFORM_DEFAULTS.canonicalDomain}`}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-brand-red-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">Ready to Start?</h2>
          <p className="text-red-100 text-lg mb-8">
            Your host salon coordinator will reach out within 2 business days. In the meantime, explore your student dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/learner/dashboard"
              className="inline-flex items-center gap-2 bg-white text-brand-red-600 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Go to My Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/lms/courses/${COSMETOLOGY_COURSE_ID}`}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-900 font-semibold px-8 py-3.5 rounded-lg border border-white/30 transition-colors"
            >
              View My Course
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
