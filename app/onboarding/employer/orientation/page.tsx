import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  CheckCircle,
  ArrowRight,
  Briefcase,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Orientation',
};

const ORIENTATION_SECTIONS = [
  {
    icon: BookOpen,
    title: 'How our training programs work',
    color: 'text-brand-blue-600',
    bg: 'bg-brand-blue-50',
    points: [
      'Students complete 4–16 week career training programs in healthcare, trades, and technology',
      'All programs are ETPL-listed and aligned with Indiana workforce standards',
      'Students receive hands-on training, industry certifications, and job-placement support',
      'Programs are funded through WIOA, Workforce Ready Grant, FSSA, and self-pay',
    ],
  },
  {
    icon: Building2,
    title: 'Your role as an employer partner',
    color: 'text-brand-green-600',
    bg: 'bg-brand-green-50',
    points: [
      'Post job openings directly to our graduating cohorts — no recruiter fees',
      'Participate in hiring events and employer panels (optional)',
      'Offer apprenticeship or OJT slots that qualify for RAPIDS tracking',
      'Provide feedback on graduate readiness to help us improve curriculum',
    ],
  },
  {
    icon: Users,
    title: 'Accessing candidate profiles',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    points: [
      'Your employer dashboard shows all graduates who opted into job matching',
      'Filter candidates by program, certification, location, and availability',
      'Contact candidates directly through the platform — no middleman',
      'Candidates are pre-screened and have completed background-check consent',
    ],
  },
  {
    icon: BarChart3,
    title: 'Tracking and reporting',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    points: [
      'Track your hires, retention rates, and training outcomes in your dashboard',
      'Download placement reports for your HR or compliance team',
      'Apprenticeship hours are tracked via RAPIDS — we handle the paperwork',
      'Annual partnership impact report sent to all employer partners',
    ],
  },
];

export default async function EmployerOrientationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/employer/orientation');

  // Best-effort: mark orientation as viewed — ignore if table doesn't exist yet
  await supabase
    .from('employer_onboarding_progress')
    .upsert(
      {
        user_id: user.id,
        orientation_viewed: true,
        orientation_viewed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .then(() => null)
    .catch(() => null);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-brand-blue-600 text-sm font-semibold tracking-widest uppercase mb-2">
            Employer Onboarding
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
            Welcome to the Partner Program
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            This orientation covers everything you need to know about partnering with Elevate for
            Humanity — how our programs work, what we expect from partners, and how to get the most
            out of your dashboard.
          </p>
        </div>

        {/* Orientation sections */}
        <div className="space-y-6 mb-10">
          {ORIENTATION_SECTIONS.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Partnership expectations */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-base font-bold mb-4">Partnership expectations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                label: 'Sign the partnership agreement',
                sub: 'Sent to your email after approval',
              },
              {
                icon: Briefcase,
                label: 'Post at least 1 job opening per quarter',
                sub: 'Keeps your account active',
              },
              {
                icon: Phone,
                label: 'Respond to candidate inquiries within 5 days',
                sub: 'Helps us maintain placement rates',
              },
              {
                icon: Mail,
                label: 'Complete your company profile',
                sub: 'Required before candidates can see your listings',
              },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-3">Your partnership team</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <a
                  href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                  className="text-sm font-semibold text-brand-blue-600 hover:underline"
                >
                  {PLATFORM_DEFAULTS.supportPhone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <a
                  href="mailto:partners@elevateforhumanity.org"
                  className="text-sm font-semibold text-brand-blue-600 hover:underline"
                >
                  partners@elevateforhumanity.org
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/onboarding/employer/hiring-needs"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Continue — Hiring Needs <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/onboarding/employer"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
