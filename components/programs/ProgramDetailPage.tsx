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
import {
  Award, BookOpen, Briefcase, CheckCircle, Clock, DollarSign,
  GraduationCap, MapPin, Shield, TrendingUp, Users, ChevronRight,
  Phone, FileText, Wrench, Building2, CreditCard, AlertCircle,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { validateProgram, getTotalHoursRange, getTotalHoursFromBreakdown } from '@/lib/programs/program-schema';

interface Props {
  program: ProgramSchema;
  children?: React.ReactNode;
}

export default function ProgramDetailPage({ program: p, children }: Props) {
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
    { bg: 'bg-brand-red-500',    light: 'bg-brand-red-50',    border: 'border-brand-red-200',    text: 'text-brand-red-700',    num: 'bg-brand-red-500 text-white' },
    { bg: 'bg-brand-blue-600',   light: 'bg-brand-blue-50',   border: 'border-brand-blue-200',   text: 'text-brand-blue-700',   num: 'bg-brand-blue-600 text-white' },
    { bg: 'bg-brand-orange-500', light: 'bg-brand-orange-50', border: 'border-brand-orange-200', text: 'text-brand-orange-700', num: 'bg-brand-orange-500 text-white' },
    { bg: 'bg-brand-green-600',  light: 'bg-brand-green-50',  border: 'border-brand-green-200',  text: 'text-brand-green-700',  num: 'bg-brand-green-600 text-white' },
  ];

  // Module photo thumbnails — matched to program sector so every page looks different
  const SECTOR_PHOTOS: Record<string, string[]> = {
    healthcare: [
      '/images/pages/cna-patient-care.jpg',
      '/images/pages/cna-vitals.jpg',
      '/images/pages/cna-clinical.jpg',
      '/images/pages/medical-assistant-lab.jpg',
      '/images/pages/medical-assistant-desk.jpg',
      '/images/pages/phlebotomy-draw.jpg',
      '/images/pages/phlebotomy-lab.jpg',
      '/images/pages/pharmacy-tech.jpg',
      '/images/pages/healthcare-classroom.jpg',
      '/images/pages/healthcare-grad.jpg',
    ],
    hvac: [
      '/images/pages/hvac-unit.jpg',
      '/images/pages/hvac-ductwork.jpg',
      '/images/pages/hvac-tools.jpg',
      '/images/pages/trades-classroom.jpg',
      '/images/pages/electrical-wiring.jpg',
      '/images/pages/electrical-panel.jpg',
      '/images/pages/electrical-conduit.jpg',
      '/images/pages/plumbing-pipes.jpg',
      '/images/pages/plumbing-tools.jpg',
      '/images/pages/workforce-training.jpg',
    ],
    trades: [
      '/images/pages/welding-sparks.jpg',
      '/images/pages/welding-mask.jpg',
      '/images/pages/welding-torch.jpg',
      '/images/pages/electrical-wiring.jpg',
      '/images/pages/electrical-panel.jpg',
      '/images/pages/electrical-conduit.jpg',
      '/images/pages/plumbing-pipes.jpg',
      '/images/pages/plumbing-tools.jpg',
      '/images/pages/trades-classroom.jpg',
      '/images/pages/hvac-tools.jpg',
    ],
    cdl: [
      '/images/pages/cdl-truck-highway.jpg',
      '/images/pages/cdl-cab-interior.jpg',
      '/images/pages/cdl-pretrip.jpg',
      '/images/pages/cdl-loading-dock.jpg',
      '/images/pages/cdl-driver-seat.jpg',
      '/images/pages/cdl-truck-highway.jpg',
      '/images/pages/cdl-cab-interior.jpg',
      '/images/pages/cdl-pretrip.jpg',
      '/images/pages/cdl-loading-dock.jpg',
      '/images/pages/cdl-driver-seat.jpg',
    ],
    barber: [
      '/images/pages/barber-fade.jpg',
      '/images/pages/barber-shop-interior.jpg',
      '/images/pages/barber-clippers.jpg',
      '/images/pages/barber-lineup.jpg',
      '/images/pages/barber-student.jpg',
      '/images/pages/barber-fade.jpg',
      '/images/pages/barber-shop-interior.jpg',
      '/images/pages/barber-clippers.jpg',
      '/images/pages/barber-lineup.jpg',
      '/images/pages/barber-student.jpg',
    ],
    technology: [
      '/images/pages/it-helpdesk-desk.jpg',
      '/images/pages/it-hardware.jpg',
      '/images/pages/it-networking.jpg',
      '/images/pages/cybersecurity-screen.jpg',
      '/images/pages/cybersecurity-code.jpg',
      '/images/pages/tech-classroom.jpg',
      '/images/pages/it-helpdesk-desk.jpg',
      '/images/pages/it-hardware.jpg',
      '/images/pages/it-networking.jpg',
      '/images/pages/cybersecurity-screen.jpg',
    ],
    business: [
      '/images/pages/tax-prep-desk.jpg',
      '/images/pages/tax-forms.jpg',
      '/images/pages/bookkeeping-ledger.jpg',
      '/images/pages/office-admin-desk.jpg',
      '/images/pages/workforce-training.jpg',
      '/images/pages/career-counseling.jpg',
      '/images/pages/job-placement.jpg',
      '/images/pages/adult-learner.jpg',
      '/images/pages/training-cohort.jpg',
      '/images/pages/employer-handshake.jpg',
    ],
    default: [
      '/images/pages/workforce-training.jpg',
      '/images/pages/training-cohort.jpg',
      '/images/pages/career-counseling.jpg',
      '/images/pages/job-placement.jpg',
      '/images/pages/adult-learner.jpg',
      '/images/pages/graduation-ceremony.jpg',
      '/images/pages/employer-handshake.jpg',
      '/images/pages/wioa-meeting.jpg',
      '/images/pages/workforce-training.jpg',
      '/images/pages/training-cohort.jpg',
    ],
  };

  // Pick sector based on program slug or category
  const slug = p.slug || '';
  const sectorKey =
    slug.includes('cna') || slug.includes('medical') || slug.includes('phlebotomy') || slug.includes('cpr') || slug.includes('pharmacy') ? 'healthcare' :
    slug.includes('hvac') || slug.includes('building') ? 'hvac' :
    slug.includes('electrical') || slug.includes('welding') || slug.includes('plumbing') || slug.includes('carpentry') ? 'trades' :
    slug.includes('cdl') || slug.includes('truck') ? 'cdl' :
    slug.includes('barber') || slug.includes('cosmetology') || slug.includes('esthetician') ? 'barber' :
    slug.includes('it') || slug.includes('cyber') || slug.includes('network') || slug.includes('tech') ? 'technology' :
    slug.includes('tax') || slug.includes('book') || slug.includes('office') || slug.includes('admin') || slug.includes('account') ? 'business' :
    'default';

  const MODULE_PHOTOS = SECTOR_PHOTOS[sectorKey];

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ A. VIBRANT HERO ════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Full-bleed video or image hero — no text overlay */}
        <div className="relative h-[380px] sm:h-[480px] bg-slate-900">
          {p.videoSrc ? (
            <video
              autoPlay muted loop playsInline preload="auto"
              poster={p.heroImage}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            >
              <source src={p.videoSrc} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={p.heroImage}
              alt={p.heroImageAlt}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
        </div>

        {/* Hero content — below image, white background */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
              {p.breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-slate-700 transition-colors">{b.label}</Link>
                  ) : (
                    <span className="text-slate-700 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
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
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                  {p.title}
                </h1>
                <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">
                  {p.subtitle}
                </p>

                {/* Quick stat pills */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {[
                    { img: '/images/hp/complete-training.jpg', val: `${p.durationWeeks} weeks` },
                    { img: '/images/hp/train.jpg',             val: `${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/week` },
                    { img: '/images/hp/school.jpg',            val: `${p.credentials.length} credentials` },
                    { img: '/images/hp/candidates.jpg',        val: p.deliveryMode === 'hybrid' ? 'Hybrid' : p.deliveryMode === 'online' ? 'Online' : 'In-Person' },
                  ].map(({ img, val }) => (
                    <span key={val} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-semibold pl-1 pr-3 py-1 rounded-full border border-slate-200">
                      <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Image src={img} alt="" width={24} height={24} className="object-cover w-full h-full" />
                      </span>
                      {val}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA card */}
              <div className="sm:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-2xl p-5">
                  <Link
                    href={p.cta.applyHref}
                    className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm mb-2"
                  >
                    Enroll Now
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

      {/* ═══ 5-QUESTION SUMMARY ═════════════════════════════════════ */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-slate-700 rounded-xl overflow-hidden">
            {[
              {
                q: 'What will I learn?',
                a: Array.isArray(p.modules) && p.modules.length
                  ? p.modules.slice(0, 3).map((m: { title: string }) => m.title).join(', ') + (p.modules.length > 3 ? ` + ${p.modules.length - 3} more modules` : '')
                  : p.subtitle,
              },
              {
                q: 'How long does it take?',
                a: `${p.durationWeeks} weeks — ${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/week. ${p.deliveryMode === 'hybrid' ? 'Hybrid: online + in-person labs.' : 'In-person.'}`,
              },
              {
                q: 'What credential do I earn?',
                a: Array.isArray(p.credentials) && p.credentials.length
                  ? p.credentials.slice(0, 2).map((c: { name: string }) => c.name).join(' + ') + (p.credentials.length > 2 ? ` + ${p.credentials.length - 2} more` : '')
                  : 'Industry-recognized certification',
              },
              {
                q: 'What job does it lead to?',
                a: Array.isArray(p.outcomes?.jobTitles) && p.outcomes.jobTitles.length
                  ? p.outcomes.jobTitles.slice(0, 2).map((j: { title: string }) => j.title).join(', ')
                  : Array.isArray(p.outcomes) && p.outcomes.length
                  ? (p.outcomes as string[]).slice(0, 2).join(', ')
                  : 'See outcomes below',
              },
              {
                q: 'How do I enroll?',
                a: 'Apply online in minutes. An advisor will contact you within 1 business day to confirm your seat.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-slate-800 px-5 py-5">
                <p className="text-xs font-bold text-brand-red-400 uppercase tracking-wider mb-2">{q}</p>
                <p className="text-sm text-slate-200 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href={p.cta.applyHref}
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              Apply for a Founding Cohort Seat
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PROGRAM DESCRIPTION ════════════════════════════════════ */}
      {p.programDescription && p.programDescription.length > 0 && (
        <section className="bg-white border-b border-slate-100 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-5">About This Program</h2>
              <div className="space-y-4">
                {p.programDescription.map((para, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FACILITY, INSTRUCTORS & CLASS SIZE ═════════════════════ */}
      {p.facilityDetails && (
        <section className="bg-slate-50 border-t border-slate-100 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Training Facility &amp; Delivery</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Location */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">{p.facilityDetails.address}</p>
                <p className="text-xs text-slate-400 mt-1">Indianapolis, Indiana</p>
              </div>

              {/* Class size + modality */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Size &amp; Format</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">{p.facilityDetails.classSize}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {p.deliveryMode === 'hybrid'
                    ? 'Hybrid — online coursework via LMS + in-person labs and hands-on training'
                    : p.deliveryMode === 'online'
                    ? 'Fully online via LMS'
                    : 'In-person at Elevate training facility'}
                </p>
              </div>

              {/* Lab equipment */}
              {p.facilityDetails.labEquipment && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Equipment</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.facilityDetails.labEquipment}</p>
                </div>
              )}

              {/* Instructors */}
              {p.facilityDetails.instructors.map((inst, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{inst.name}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">{inst.credential}</p>
                  <p className="text-xs text-slate-500">{inst.experience}</p>
                </div>
              ))}

            </div>
          </div>
        </section>
      )}

      {/* ═══ MODULE PHOTO GRID ══════════════════════════════════════ */}
      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">What You&apos;ll Learn</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {p.curriculum.map((mod, i) => {
              const photo = MODULE_PHOTOS[i % MODULE_PHOTOS.length];
              const color = MODULE_COLORS[i % MODULE_COLORS.length];
              return (
                <div key={i} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group bg-white border border-slate-100">
                  {/* Photo — fixed height, no overlay */}
                  <div className="relative w-full h-32 overflow-hidden">
                    <Image
                      src={photo}
                      alt={mod.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${color.num}`}>
                      {i + 1}
                    </span>
                  </div>
                  {/* Label below image — no overlay */}
                  <div className="px-3 py-2.5">
                    <p className="text-xs font-bold text-slate-900 leading-snug">{mod.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ BNPL / PAYMENT OPTIONS ═════════════════════════════════ */}
      {p.bnplOptions && (
        <section className="bg-slate-50 border-t border-slate-100 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{p.bnplOptions.headline}</h2>

            {/* Not-funded notice */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 max-w-2xl">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{p.bnplOptions.note}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {p.bnplOptions.plans.map((plan, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{plan.label}</span>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{plan.amount}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{plan.detail}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-5">
              Payment plans are interest-free. Contact us at{' '}
              <a href="tel:+13173143757" className="text-brand-blue-600 hover:underline">(317) 314-3757</a>{' '}
              to discuss your options before enrolling.
            </p>
          </div>
        </section>
      )}

      {/* ═══ CTA ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Start Your {p.title} Career?
          </h2>
          <p className="text-white/80 text-base max-w-xl mx-auto mb-2">{p.fundingStatement}</p>
          <p className="text-white/50 text-xs max-w-lg mx-auto mb-8">
            Workforce funding is available for eligible Indiana residents only. Eligibility is not guaranteed — you must qualify through WorkOne. Payment options available for self-pay students.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={p.cta.applyHref}
              className="bg-white text-brand-red-600 px-10 py-4 rounded-2xl font-extrabold text-base hover:bg-brand-red-50 transition-colors shadow-xl"
            >
              Apply Now
            </Link>
            <Link
              href={p.cta.advisorHref || '/contact'}
              className="border-2 border-white/60 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 transition-colors"
            >
              Talk to an Advisor
            </Link>
          </div>
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
