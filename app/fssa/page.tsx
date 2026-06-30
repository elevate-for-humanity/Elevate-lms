import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  CheckCircle,
  ArrowRight,
  Users,
  ClipboardList,
  Building2,
  GraduationCap,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'FSSA IMPACT Program | SNAP E&T Career Training',
  description:
    "Indiana SNAP and TANF recipients may qualify for free career training through FSSA's IMPACT program. {PLATFORM_DEFAULTS.orgName} is an ETPL-approved, FSSA-participating training provider.",
  alternates: { canonical: 'https://www.elevateforhumanity.org/fssa' },
};

const ELIGIBLE_PROGRAMS = [
  { title: 'HVAC Technician', slug: 'hvac-technician', credential: 'EPA 608', hours: '160 hrs' },
  { title: 'CNA / Healthcare', slug: 'cna', credential: 'State CNA License', hours: '120 hrs' },
  {
    title: 'Barber Apprenticeship',
    slug: 'barber-apprenticeship',
    credential: 'Indiana Barber License',
    hours: '2,000 hrs OJL',
  },
  { title: 'IT Help Desk', slug: 'it-help-desk', credential: 'CompTIA A+', hours: '160 hrs' },
  {
    title: 'Peer Recovery Specialist',
    slug: 'peer-recovery-specialist',
    credential: 'CPRS',
    hours: '80 hrs',
  },
  { title: 'CDL Training', slug: 'cdl-training', credential: 'Class A CDL', hours: '160 hrs' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Check Eligibility',
    desc: 'Current SNAP or TANF recipients in Indiana may qualify. Contact your FSSA/DFR case manager or a WorkOne office to confirm.',
  },
  {
    step: '2',
    title: 'Get a Referral',
    desc: 'Your case manager issues a referral through FSSA or WorkOne. Direct enrollment without a referral is not available for IMPACT funding.',
  },
  {
    step: '3',
    title: 'Enroll in Training',
    desc: 'We confirm your referral, match you to a program, and enroll you. Tuition, books, and certification fees are covered.',
  },
  {
    step: '4',
    title: 'Earn Your Credential',
    desc: 'Complete the program, pass your certification exam, and enter the workforce. We report progress back to your agency.',
  },
];

export default function FssaPage() {
  // PUBLIC ROUTE: FSSA/SNAP E&T program landing page — no auth required.
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'FSSA IMPACT' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
          <Image
            src="/images/pages/funding-impact-1.webp"
            alt="Career training participants"
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw" placeholder="empty"
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            Indiana FSSA · SNAP E&T · IMPACT Program
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Free Career Training for<br className="hidden md:block" /> SNAP &amp; TANF Recipients
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-8">
            {PLATFORM_DEFAULTS.orgName} is an ETPL-approved, FSSA-participating training provider. If you
            receive SNAP or TANF benefits in Indiana, you may qualify for fully funded career
            training through the IMPACT program.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-7 py-3.5 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/grants"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-slate-900 hover:bg-white/10 transition"
            >
              See All Funding Options
            </Link>
          </div>
        </div>
      </section>

      {/* Credential strip */}
      <section className="bg-brand-red-600 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-2">
          {[
            'ETPL Approved — Indiana DWD',
            'FSSA IMPACT Participating Provider',
            'WIOA / WRG / JRI Approved',
            'DOL Registered Apprenticeship Sponsor',
            'SAM.gov Registered — CAGE: 0Q856',
          ].map((c) => (
            <span key={c} className="flex items-center gap-2 text-sm font-medium text-white">
              <CheckCircle className="w-4 h-4 text-red-200 shrink-0" /> {c}
            </span>
          ))}
        </div>
      </section>

      {/* What is IMPACT */}
      <section className="py-16 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What Is the IMPACT Program?</h2>
            <p className="text-slate-600 mb-4">
              IMPACT (Indiana Manpower Placement and Comprehensive Training) is Indiana's SNAP
              Employment &amp; Training (SNAP E&T) program, administered by FSSA's Division of
              Family Resources (DFR). It connects SNAP and TANF recipients with job training,
              education, and employment services.
            </p>
            <p className="text-slate-600 mb-4">
              As an approved Third Party Provider (TPP), {PLATFORM_DEFAULTS.orgName} delivers
              FSSA-reimbursable training in high-demand trades and healthcare fields. Participants
              pay nothing out of pocket — tuition, books, and exam fees are covered.
            </p>
            <p className="text-slate-600">
              Participation is tracked at 80 hours minimum per federal SNAP E&T requirements.
              Attendance and milestone data are reported back to your case manager automatically.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-72">
            <Image
              src="/images/pages/funding-impact-2.jpg"
              alt="FSSA IMPACT training"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
          <p className="text-slate-600 mb-10">
            Funding flows through your FSSA case manager or WorkOne office — not directly through
            us. Here's the process from referral to credential.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="w-9 h-9 rounded-full bg-brand-red-600 text-white text-sm font-bold flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligible programs */}
      <section className="py-16 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">SNAP E&T Eligible Programs</h2>
          <p className="text-slate-600 mb-8">
            All programs below qualify for FSSA IMPACT funding. Hours shown are minimum
            participation requirements per federal SNAP E&T rules.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ELIGIBLE_PROGRAMS.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                    {p.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-red-600 transition-colors shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-500 mb-2">{p.credential}</p>
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {p.hours}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Two-audience CTA split */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Participant */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-brand-red-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">I'm a SNAP / TANF Recipient</h3>
            <p className="text-slate-600 text-sm mb-6">
              Talk to your FSSA case manager or visit a WorkOne office to get a referral. Once
              referred, apply directly through us.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-5 py-3 font-semibold text-white hover:bg-brand-red-700 transition text-sm"
              >
                <ClipboardList className="w-4 h-4" /> Start Application
              </Link>
              <Link
                href="/grants"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition text-sm"
              >
                <FileText className="w-4 h-4" /> See All Funding Options
              </Link>
            </div>
          </div>

          {/* Agency */}
          <div className="bg-slate-900 rounded-2xl p-8">
            <Building2 className="w-8 h-8 text-brand-red-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">I'm a Case Manager or Agency</h3>
            <p className="text-slate-300 text-sm mb-6">
              Refer SNAP/TANF participants to our ETPL-approved programs. We handle enrollment,
              80-hour tracking, and progress reporting back to your agency.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/snap-et-partner"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-5 py-3 font-semibold text-white hover:bg-brand-red-700 transition text-sm"
              >
                <Users className="w-4 h-4" /> Agency Partner Info
              </Link>
              <Link
                href="/fssa/tpp-survey"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 font-semibold text-slate-900 hover:bg-white/10 transition text-sm"
              >
                <ClipboardList className="w-4 h-4" /> TPP Questionnaire
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 px-4 bg-white border-t">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Questions About FSSA Funding?</h2>
          <p className="text-slate-600 mb-8">
            Our team can help you understand eligibility, connect with your case manager, or
            navigate the referral process.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:agencies@elevateforhumanity.org"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition"
            >
              <Mail className="w-4 h-4" /> agencies@elevateforhumanity.org
            </a>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Phone className="w-4 h-4" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
