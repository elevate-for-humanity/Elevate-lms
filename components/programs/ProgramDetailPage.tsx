'use client';

/**
 * ProgramDetailPage — Institutional Program Detail Template v1
 *
 * Renders all 10 required sections in fixed order.
 * Validates the program schema at render time in development.
 * HVAC Technician is the canonical reference implementation.
 */

import Image from 'next/image';
import Link from 'next/link';
import PageVideoHero from '@/components/ui/PageVideoHero';
import {
  Award, BookOpen, Briefcase, CheckCircle, Clock, DollarSign,
  GraduationCap, MapPin, Shield, TrendingUp, Users, ChevronRight,
  Phone, FileText, Wrench, Building2,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { validateProgram, getTotalHoursRange, getTotalHoursFromBreakdown } from '@/lib/programs/program-schema';

interface Props {
  program: ProgramSchema;
  /** Replaces the default video/image hero entirely. */
  heroOverride?: React.ReactNode;
  children?: React.ReactNode;
}

export default function ProgramDetailPage({ program: p, heroOverride, children }: Props) {
  // Dev-time validation
  if (process.env.NODE_ENV === 'development') {
    const errors = validateProgram(p);
    if (errors.length > 0) {
      console.warn(`[ProgramDetailPage] Validation errors for "${p.slug}":`);
      errors.forEach((e) => console.warn(`  ${e.field}: ${e.message}`));
    }
  }

  const totalHours = getTotalHoursFromBreakdown(p);
  const hoursRange = getTotalHoursRange(p);

  // Module accent colors — cycles through brand palette
  const MODULE_COLORS = [
    { light: 'bg-brand-red-50',    border: 'border-brand-red-200',    text: 'text-brand-red-700',    num: 'bg-brand-red-500 text-white' },
    { light: 'bg-brand-blue-50',   border: 'border-brand-blue-200',   text: 'text-brand-blue-700',   num: 'bg-brand-blue-600 text-white' },
    { light: 'bg-brand-orange-50', border: 'border-brand-orange-200', text: 'text-brand-orange-700', num: 'bg-brand-orange-500 text-white' },
    { light: 'bg-brand-green-50',  border: 'border-brand-green-200',  text: 'text-brand-green-700',  num: 'bg-brand-green-600 text-white' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ A. HERO ════════════════════════════════════════════════ */}
      <section>
        {heroOverride ?? (p.videoSrc ? (
          <PageVideoHero
            videoSrc={p.videoSrc}
            posterSrc={p.heroImage}
            posterAlt={p.heroImageAlt}
            size="program"
          />
        ) : (
          <div className="relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden">
            <Image
              src={p.heroImage}
              alt={p.heroImageAlt}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          </div>
        ))}

        {/* Hero content panel — below image, no overlay */}
        <div className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
              {p.breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-white/80 transition-colors">{b.label}</Link>
                  ) : (
                    <span className="text-slate-600 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1">
                {/* Badge */}
                {p.badge && (
                  <span className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full mb-3 ${
                    p.badgeColor === 'orange' ? 'bg-brand-orange-500' :
                    p.badgeColor === 'green'  ? 'bg-brand-green-500' :
                    p.badgeColor === 'red'    ? 'bg-brand-red-500' :
                    'bg-brand-blue-500'
                  }`}>
                    {p.badge}
                  </span>
                )}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                  {p.title}
                </h1>
                <p className="text-white/75 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
                  {p.subtitle}
                </p>

                {/* Quick fact chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: <Clock className="w-3.5 h-3.5" />, val: `${p.durationWeeks} ${p.durationWeeks === 1 ? 'week' : 'weeks'}` },
                    { icon: <BookOpen className="w-3.5 h-3.5" />, val: `${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/week` },
                    { icon: <Award className="w-3.5 h-3.5" />, val: `${p.credentials.length} credential${p.credentials.length !== 1 ? 's' : ''}` },
                    { icon: <MapPin className="w-3.5 h-3.5" />, val: p.deliveryMode === 'hybrid' ? 'Hybrid' : p.deliveryMode === 'online' ? 'Online' : 'In-Person' },
                  ].map(({ icon, val }) => (
                    <span key={val} className="inline-flex items-center gap-1.5 bg-white/10 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                      {icon}{val}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA card */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-xl p-5">
                  <p className="text-xs font-bold text-brand-green-600 uppercase tracking-wider mb-1">Grant Funding Available</p>
                  <p className="text-2xl font-extrabold text-slate-900 mb-0.5">{p.selfPayCost}</p>
                  <p className="text-xs text-slate-500 mb-4">self-pay · funding may cover 100%</p>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Applicant</p>
                  <Link
                    href={p.cta.applyHref}
                    className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm mb-3"
                  >
                    Apply Now
                  </Link>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Already Enrolled?</p>
                  <Link
                    href={p.cta.enrollHref || '/lms/dashboard'}
                    className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm mb-3"
                  >
                    Go to My Courses
                  </Link>

                  <Link
                    href={p.cta.advisorHref || '/contact'}
                    className="block w-full text-center border-2 border-slate-200 hover:border-brand-blue-400 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Talk to an Advisor
                  </Link>
                  {p.cta.courseHref && (
                    <Link
                      href={p.cta.courseHref}
                      className="block w-full text-center text-brand-blue-600 hover:text-brand-blue-800 font-semibold py-2 text-xs mt-1"
                    >
                      View Course Details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CURRICULUM ══════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">What You&apos;ll Learn</h2>
          <p className="text-slate-500 text-sm mb-8">Full curriculum broken down by module. Every topic is covered in class and assessed before you advance.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.curriculum.map((mod, i) => {
              const color = MODULE_COLORS[i % MODULE_COLORS.length];
              return (
                <div key={i} className={`rounded-xl border ${color.border} ${color.light} p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 ${color.num}`}>{i + 1}</span>
                    <h3 className={`font-bold text-sm ${color.text}`}>{mod.title}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {mod.topics.map((t, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-0.5 text-slate-400 flex-shrink-0">·</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ENROLLMENT TRACKS ══════════════════════════════════════ */}
      {p.enrollmentTracks && (
        <section className="py-14 bg-slate-50 border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">How to Enroll</h2>
              <p className="text-slate-500 text-base max-w-2xl mx-auto">
                Workforce funding is available for Indiana residents. Students from other states can enroll through the self-pay option.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">

              {/* Track 1: Indiana funded */}
              <div className="bg-white rounded-2xl border-2 border-brand-green-500 shadow-sm p-7 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-brand-green-100 text-brand-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Workforce Funded
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{p.enrollmentTracks.funded.label}</h3>
                <p className="text-xs font-semibold text-brand-green-700 mb-3">
                  ✓ {p.enrollmentTracks.funded.requirement}
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  {p.enrollmentTracks.funded.description}
                </p>
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Eligible programs include</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['WorkOne', 'WIOA', 'Trade Act', 'SNAP E&T', 'JRI'].map(prog => (
                      <span key={prog} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg">{prog}</span>
                    ))}
                  </div>
                  <Link
                    href={p.enrollmentTracks.funded.applyHref}
                    className="block w-full text-center bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Apply — Check My Eligibility
                  </Link>
                  <p className="text-center text-xs text-slate-400 mt-1">Free to apply · eligibility verified before enrollment</p>
                </div>
              </div>

              {/* Track 2: Self-pay national */}
              <div className={`bg-white rounded-2xl border-2 shadow-sm p-7 flex flex-col ${p.enrollmentTracks.selfPay.available ? 'border-brand-blue-400' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${p.enrollmentTracks.selfPay.available ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.enrollmentTracks.selfPay.available ? 'Self-Pay' : 'Enrollment Pending'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{p.enrollmentTracks.selfPay.label}</h3>
                <p className="text-2xl font-extrabold text-slate-900 mb-3">
                  {p.enrollmentTracks.selfPay.cost}
                  <span className="text-sm font-normal text-slate-400 ml-1">tuition</span>
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                  {p.enrollmentTracks.selfPay.description}
                </p>
                <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">What you get</p>
                  <p>✓ Full online HVAC training curriculum</p>
                  <p>✓ Prepares for EPA Section 608 Universal certification</p>
                  <p>✓ OSHA 10-Hour included</p>
                  <p>✓ Exam proctored on-site at Elevate (Indianapolis)</p>
                </div>
                {p.enrollmentTracks.selfPay.available ? (
                  <Link
                    href={p.enrollmentTracks.selfPay.applyHref}
                    className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Enroll — Self-Pay
                  </Link>
                ) : (
                  <div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3 text-sm text-amber-800">
                      {p.enrollmentTracks.selfPay.comingSoonMessage}
                    </div>
                    <Link
                      href="/contact?subject=hvac-self-pay-waitlist"
                      className="block w-full text-center border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 hover:text-brand-blue-700 font-bold py-3.5 rounded-xl transition-colors text-sm"
                    >
                      Join the Waitlist
                    </Link>
                  </div>
                )}
              </div>

            </div>

            {/* Expansion note */}
            <p className="text-center text-slate-400 text-sm mt-8">
              Workforce-funded training currently available for Indiana residents.
              Additional states will be added as partnerships develop.
            </p>
          </div>
        </section>
      )}

      {/* ═══ CTA ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #dc2626 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Start Your {p.title} Career?
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto mb-8">{p.fundingStatement}</p>

          {/* Two distinct paths — applicant vs enrolled */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-4">
            {/* New applicant */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">New Applicant</span>
              <Link
                href={p.cta.applyHref}
                className="bg-white text-brand-red-600 px-10 py-4 rounded-2xl font-extrabold text-base hover:bg-brand-red-50 transition-colors shadow-xl whitespace-nowrap"
              >
                Apply to This Program
              </Link>
              <span className="text-white/60 text-xs">Free to apply · takes 5 min</span>
            </div>

            {/* Already enrolled */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Already Enrolled</span>
              <Link
                href={p.cta.enrollHref || '/lms/dashboard'}
                className="bg-brand-blue-500 hover:bg-brand-blue-400 text-white px-10 py-4 rounded-2xl font-extrabold text-base transition-colors shadow-xl whitespace-nowrap border-2 border-white/30"
              >
                Go to My Courses
              </Link>
              <span className="text-white/60 text-xs">Log in to access your training</span>
            </div>
          </div>

          <Link
            href={p.cta.advisorHref || '/contact'}
            className="inline-block border-2 border-white/40 text-white/80 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors mt-2"
          >
            Questions? Talk to an Advisor
          </Link>
        </div>
      </section>

      {children && <div>{children}</div>}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="w-5 h-5 text-brand-blue-600 mx-auto mb-1" />
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="font-semibold text-slate-900 text-sm">{value}</div>
    </div>
  );
}

function HoursBar({ label, hours, total }: { label: string; hours: number; total: number }) {
  const pct = total > 0 ? Math.round((hours / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{hours} hrs</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
