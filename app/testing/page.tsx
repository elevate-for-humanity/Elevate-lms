export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { TESTING_CENTER, CALENDLY_CONFIG } from '@/lib/testing/testing-config';
import Image from 'next/image';
import {
  CalendarDays,
  DollarSign,
  AlertTriangle,
  Info,
  CreditCard,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ACTIVE_PROVIDERS, type ExamDefinition } from '@/lib/testing/proctoring-capabilities';
import { getProvidersForAmount } from '@/lib/bnpl-config';

export const metadata: Metadata = {
  title: 'Testing & Credential Exams',
  description:
    'Workforce credential exams and proctor-supervised certification testing. Certiport, EPA 608, ACT WorkKeys/NCRC, NHA, and NRF Rise Up exams available through authorized testing partnerships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/testing',
  },
};

const PROVIDER_IMAGES: Record<string, string> = {
  // EPA Section 608 - HVAC/Refrigeration
  esco: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-unit.webp',
  // NRF Rise Up - Retail/Customer Service
  nrf: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/certifications-page-1.webp',
  // Certiport - IT/Microsoft Office
  certiport: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/testing-page-1.webp',
  // NHA - Healthcare Certifications
  nha: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/medical-assistant.webp',
  // ACT WorkKeys - Workforce Assessments
  workkeys: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-services-page-1.webp',
  // CareerSafe - Safety Certifications
  careersafe: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-emergency-health-safety-hero.webp',
  // Midland - Drug & Alcohol Testing
  midland: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/competency-test-hero.webp',
  // ASE - Automotive Service Excellence
  ase: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/automotive-training.webp',
};

const CAPABILITY_LABELS: Record<string, string> = {
  IN_PERSON_ONLY: 'In-person only',
  IN_PERSON_OR_PROVIDER_REMOTE: 'In-person or remote',
  CENTER_REMOTE_ALLOWED: 'In-person or live online',
};

const TESTING_APPLY_LINKS: Record<string, string> = {
  esco: '/apply/student?program=hvac-technician',
  nrf: '/apply/student?program=nrf-riseup',
  certiport: '/apply/student?program=it-help-desk',
  nha: '/apply/student?program=medical-assistant',
  workkeys: '/apply/student?program=workforce-ready-grant',
  careersafe: '/apply/student?program=emergency-health-safety',
  midland: '/apply/student?program=drug-collector',
};

export default function TestingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Testing & Credential Exams' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[clamp(190px,32vw,360px)] overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-services-page-1.webp"
          alt="Workforce credential testing"
          fill
          sizes="100vw"
          className="object-cover"
          priority 
        />
      </section>

      {/* Hero text — below image, never overlaid */}
      <section className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Authorized Testing Center Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
              <span className="text-lg">🏆</span> Authorized Testing Center
            </span>
            <span className="text-xs text-slate-500">DOL Registered · ETPL Listed · ADA Compliant</span>
          </div>

          {/* Pathway context — testing is step 3, not a standalone service */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
            <Link href="/programs" className="hover:text-brand-red-600 transition-colors">
              Get Trained
            </Link>
            <span className="text-slate-500">→</span>
            <span className="text-brand-red-600 font-bold">Get Tested</span>
            <span className="text-slate-500">→</span>
            <Link href="/employer/dashboard" className="hover:text-brand-red-600 transition-colors">
              Get Hired
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
            Testing &amp; Credential Exams
          </h1>
          <p className="text-slate-700 text-lg mb-1">
            Elevate for Humanity Authorized Testing Center
          </p>
          <p className="text-slate-500 text-sm max-w-2xl">
            Elevate provides training and proctored testing access. Certifications are issued by
            official credentialing bodies — NHA, ACT, Certiport, ESCO, and NRF — upon passing their
            exam.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/testing/book"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              <CalendarDays className="w-5 h-5" />
              Schedule Exam
            </Link>
            <Link
              href="/testing#available-exams"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              View All Exams
            </Link>
            <Link
              href="/testing#policies"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Testing Policies
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-green-600">✓</span> Video Monitored
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-green-600">✓</span> Professional Proctors
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-green-600">✓</span> ADA Accommodations
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-green-600">✓</span> Climate Controlled
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-green-600">✓</span> Secure Lockers
            </div>
          </div>
        </div>
      </section>

      {/* DISCLAIMER BANNER */}
      <section className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed flex flex-wrap gap-x-6 gap-y-1">
              <span>Credentials issued by NHA, ACT, Certiport, ESCO, NRF — not Elevate.</span>
              <span>Fees non-refundable unless exam canceled by Elevate.</span>
              <span>{TESTING_CENTER.policy.workforceFunding}</span>
              <span>Funding support is currently prioritized for Indiana participants; regional expansion is in progress.</span>
              <span>Self-pay remains available at checkout for all eligible exam paths.</span>
              <Link href="/federal-compliance" className="underline font-medium hover:text-amber-700">Full disclosure →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROVIDER CARDS — driven from CERT_PROVIDERS config */}
      <section className="py-14" id="available-exams">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Available Credential Exams</h2>
          <div className="flex flex-wrap gap-2 mb-10">
            {['All exams proctored', 'Appointment required — no walk-ins', 'Photo ID required', `Arrive ${TESTING_CENTER.policy.arriveMinutesBefore} min early`].map((item) => (
              <span key={item} className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
                {item}
              </span>
            ))}
          </div>

          <div className="space-y-10">
            {ACTIVE_PROVIDERS.map((provider) => (
              <div
                key={provider.key}
                id={provider.key}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid lg:grid-cols-3">
                  {/* Image — clicking goes to provider detail page */}
                  <Link
                    href={`/testing/${provider.key}`}
                    className="relative h-64 sm:h-80 lg:h-full min-h-[280px] overflow-hidden block group"
                  >
                    <Image
                      src={
                        PROVIDER_IMAGES[provider.key] || 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/career-services-page-1.webp'
                      }
                      alt={provider.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 100vw, 33vw" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </Link>
                  <div className="lg:col-span-2 p-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <Link
                        href={`/testing/${provider.key}`}
                        className="hover:text-brand-blue-600 transition-colors"
                      >
                        <h3 className="text-xl font-bold text-slate-900">{provider.name}</h3>
                      </Link>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                        {CAPABILITY_LABELS[provider.capability]}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm mb-5 leading-relaxed">
                      {provider.description}
                    </p>

                    {/* Exams — each links to provider detail page */}
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Exams Available
                      </p>
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
                        {provider.exams.slice(0, 6).map((exam) => {
                          const isObj = typeof exam === 'object' && exam !== null;
                          const label = isObj ? (exam as ExamDefinition).name : (exam as string);
                          const examDef = isObj ? (exam as ExamDefinition) : null;
                          return (
                            <div
                              key={label}
                              className="flex items-start justify-between gap-3 text-sm text-slate-700"
                            >
                              <Link
                                href={`/testing/${provider.key}`}
                                className="flex items-start gap-2 hover:text-brand-red-600 group/exam min-w-0"
                              >
                                <span className="text-brand-red-400 flex-shrink-0 mt-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                </span>
                                <span>
                                  <span className="font-medium group-hover/exam:underline">{label}</span>
                                  {examDef?.durationMinutes && (
                                    <span className="block text-xs text-slate-400 mt-0.5">
                                      {examDef.durationMinutes} min
                                    </span>
                                  )}
                                </span>
                              </Link>
                              {provider.status === 'active' && (
                                <Link
                                  href={`/testing/book?exam=${provider.key}&exam_name=${encodeURIComponent(label)}`}
                                  className="inline-flex items-center gap-1 bg-brand-red-100 hover:bg-brand-red-200 text-brand-red-700 text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap transition-colors"
                                >
                                  Pay
                                </Link>
                              )}
                            </div>
                          );
                        })}
                        {provider.exams.length > 6 && (
                          <Link href={`/testing/${provider.key}`} className="col-span-2 text-xs text-brand-blue-600 hover:text-brand-blue-700 font-medium mt-1">
                            + {provider.exams.length - 6} more exams →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Fees with BNPL breakdown */}
                    {provider.fees && provider.fees.length > 0 ? (
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Exam Fees
                        </p>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                          {provider.fees.slice(0, 3).map((fee, idx) => (
                            <div
                              key={fee.label}
                              className="flex items-center justify-between gap-4 px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{fee.label}</p>
                                {fee.note && (
                                  <p className="text-xs text-slate-500 mt-0.5">{fee.note}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-brand-red-600 font-black text-xl">
                                  ${fee.amount}
                                </span>
                              </div>
                            </div>
                          ))}
                          {provider.fees.length > 3 && (
                            <Link href={`/testing/${provider.key}`} className="block text-center text-xs text-brand-blue-600 hover:text-brand-blue-700 py-2 border-t border-slate-200">
                              View all {provider.fees.length} pricing options →
                            </Link>
                          )}
                        </div>
                        
                        {/* BNPL Breakdown */}
                        {(() => {
                          const minFee = Math.min(...provider.fees.map((f: any) => f.amount));
                          const bnpl = getProvidersForAmount(minFee);
                          if (!bnpl.length) return null;
                          return (
                            <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-semibold text-green-800 mb-2">
                                💳 Pay in Installments Available:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {bnpl.slice(0, 4).map((p) => (
                                  <span
                                    key={p.id}
                                    className={`inline-flex items-center text-[11px] font-bold px-2 py-1 rounded-full ${p.badgeBg} ${p.badgeText}`}
                                  >
                                    {p.name}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-green-700 mt-2">
                                As low as ${Math.ceil(minFee / 4)}/mo with qualifying plans
                              </p>
                            </div>
                          );
                        })()}

                        {provider.groupDiscount && (
                          <div className="flex items-start gap-2 mt-2 bg-brand-blue-50 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-brand-blue-700">{provider.groupDiscount}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic mb-4">Contact us for pricing.</p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {provider.status === 'active' && (
                        <Link
                          href={`/testing/book?exam=${provider.key}`}
                          className="inline-flex items-center gap-1.5 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          {provider.fees && provider.fees.length > 0
                            ? `Pay & Book — $${provider.fees[0].amount}`
                            : 'Book a Seat'}
                        </Link>
                      )}
                      <Link
                        href={TESTING_APPLY_LINKS[provider.key] || '/apply/student'}
                        className="inline-flex items-center gap-1.5 border border-brand-blue-300 text-brand-blue-700 hover:border-brand-blue-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Apply for Training →
                      </Link>
                      {provider.key === 'certiport' && provider.status === 'active' && (
                        <Link
                          href="/certiport-exam"
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          Request Voucher →
                        </Link>
                      )}
                      <Link
                        href={`/testing/${provider.key}`}
                        className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:border-slate-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEE SUMMARY — card list on mobile, table on md+ */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-7 h-7 text-brand-red-600" />
            <h2 className="text-3xl font-black text-slate-900">Fee Summary</h2>
          </div>
          <p className="text-slate-500 mb-8 text-sm max-w-2xl">
            All fees include the exam and proctoring. {TESTING_CENTER.policy.workforceFunding}
          </p>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {ACTIVE_PROVIDERS.filter((p) => p.fees && p.fees.length > 0).flatMap((p) =>
              p.fees!.map((fee, i) => (
                <div key={`${p.key}-${i}`} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {i === 0 && <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{p.name}</p>}
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{fee.label}</p>
                    {fee.note && <p className="text-xs text-slate-500 mt-0.5">{fee.note}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-black text-brand-red-600 text-lg">${fee.amount}</span>
                    <Link href={`/testing/book?exam=${p.key}`} className="bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Book →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Provider</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Exam</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-700">Fee</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACTIVE_PROVIDERS.filter((p) => p.fees && p.fees.length > 0).flatMap((p) =>
                  p.fees!.map((fee, i) => (
                    <tr key={`${p.key}-${i}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-600 text-xs align-middle">
                        {i === 0 ? p.name : ''}
                      </td>
                      <td className="px-5 py-3 text-slate-800 font-medium align-middle">
                        {fee.label}
                        {fee.note && (
                          <span className="block text-xs text-slate-600 font-normal">{fee.note}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-brand-red-600 text-base align-middle whitespace-nowrap">
                        ${fee.amount}
                      </td>
                      <td className="px-5 py-3 text-right align-middle">
                        <Link href={`/testing/book?exam=${p.key}`} className="inline-flex items-center gap-1 bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          Book →
                        </Link>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">How Testing Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '1',
                title: 'Book Your Seat',
                img: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/academic-calendar-hero.webp',
                desc: `Select your exam and preferred date. Pay the exam fee at booking to reserve your seat. ${TESTING_CENTER.policy.noWalkIns}`,
              },
              {
                step: '2',
                title: 'Arrive Prepared',
                img: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/apply-page-1.jpg',
                desc: `Arrive at least ${TESTING_CENTER.policy.arriveMinutesBefore} minutes early. ${TESTING_CENTER.policy.idRequired} No ID, no exam — no exceptions.`,
              },
              {
                step: '3',
                title: 'Take the Exam',
                img: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/testing-page-1.webp',
                desc: 'All exams are proctored. No phones or outside materials unless explicitly permitted by the provider.',
              },
              {
                step: '4',
                title: 'Receive Your Credential',
                img: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/certificates-page-1.webp',
                desc: 'Results and credentials are issued directly by the certifying body. Elevate records your outcome for your training record.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={s.img}
                    alt={s.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" 
                  />
                  <div className="absolute inset-0 bg-brand-blue-900/50" />
                  <div className="absolute top-3 left-3 w-8 h-8 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                    {s.step}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTING POLICIES */}
      <section className="py-14 border-t border-slate-100" id="policies">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Testing Policies</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">📅 Appointments</h3>
              <p className="text-sm text-slate-600">All exams require an appointment. Walk-ins are not accepted. Schedule at least 24 hours in advance.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">📝 ID Requirements</h3>
              <p className="text-sm text-slate-600">Valid government-issued photo ID required. No ID = no exam. No exceptions.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">🔒 Security</h3>
              <p className="text-sm text-slate-600">All testing rooms are video monitored. Personal items must be stored in secure lockers.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">⏰ Arrival</h3>
              <p className="text-sm text-slate-600">Arrive 15 minutes early. Late arrivals may not be admitted and fees are non-refundable.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">🔄 Rescheduling</h3>
              <p className="text-sm text-slate-600">Reschedule with at least 24 hours notice. Fees are non-refundable once reserved.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">♿ Accommodations</h3>
              <p className="text-sm text-slate-600">ADA accommodations available. Contact us at least 72 hours before your exam.</p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <h3 className="font-bold text-amber-900 mb-3">⚠️ Important Notice</h3>
            <ul className="text-sm text-amber-800 space-y-2">
              <li>• Exam fees are non-refundable once a session is reserved</li>
              <li>• Workforce-funded candidates (WIOA, WorkOne) may have fees covered — contact us first</li>
              <li>• Retake eligibility and waiting periods are set by each credentialing provider</li>
              <li>• Credentials are issued directly by the certifying body, not Elevate</li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <Link href="/testing/accommodations" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              View Accommodations Information →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTING SITE INFO */}
      <section className="py-14 border-t border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Testing Site Information</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Location</h3>
              <p className="text-slate-600 text-sm">{TESTING_CENTER.address}</p>
              <p className="text-slate-600 text-sm mt-1">{TESTING_CENTER.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">What to Bring</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Valid government-issued photo ID</li>
                <li>• Arrive at least 15 minutes early</li>
                <li>• No phones or outside materials unless permitted</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Appointments &amp; Cancellations
              </h3>
              <p className="text-slate-600 text-sm">
                All exams are by appointment only — walk-ins are not accepted. Appointments may be
                rescheduled with at least 24 hours&apos; notice. Exam fees are non-refundable once a
                session is reserved.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Retakes</h3>
              <p className="text-slate-600 text-sm">
                Retake eligibility and waiting periods are set by each credentialing provider.
                Contact us for provider-specific retake policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to Get Certified?</h2>
          <p className="text-slate-600 mb-8">
            Book your exam seat online or call us to schedule. Appointments required — walk-ins not
            accepted.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/testing/book"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
            >
              <CalendarDays className="w-5 h-5" />
              Book a Testing Session
            </Link>
            <a
              href={`tel:${TESTING_CENTER.phone.replace(/\D/g, '')}`}
              className="inline-flex items-center gap-2 border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-4 rounded-full font-bold text-lg transition-colors"
            >
              {TESTING_CENTER.phone}
            </a>
            <Link
              href="/apply/student"
              className="inline-flex items-center gap-2 border-2 border-brand-blue-300 hover:border-brand-blue-400 text-brand-blue-700 px-8 py-4 rounded-full font-bold text-lg transition-colors"
            >
              Apply for a Program
            </Link>
          </div>
          <p className="text-slate-500 text-sm">
            Not enrolled in training yet?{' '}
            <Link
              href="/programs"
              className="text-brand-red-600 hover:text-brand-red-700 font-semibold"
            >
              Browse programs →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
