"use client";

import type { Program } from '@/app/data/programs';
import Link from 'next/link';
import { ApprenticeshipBadge } from '@/components/programs/ApprenticeshipBadge';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';
import { ProgramAppointmentBanner } from '@/components/programs/ProgramAppointmentBanner';
import ProgramHowItWorks from '@/components/program/ProgramHowItWorks';
import ProgramFAQ from '@/components/program/ProgramFAQ';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export function ProgramDetails({ program }: { program: Program }) {
  const { videoRef } = useHeroVideo();
  const isBarberProgram = program.slug === 'barber-apprenticeship';
  const programPrice = program.price || 0; // Use program price from data

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr]">
          <div>
            {/* Indiana RAPIDS Badge for Barber Program */}
            {isBarberProgram && <ApprenticeshipBadge />}

            {/* Appointment-Based Enrollment Banner */}
            <ProgramAppointmentBanner />

            <h2 className="text-xl font-bold text-black mt-8">
              What You&apos;ll Learn
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black">
              {program.whatYouLearn?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Program Highlights
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black">
              {program.highlights?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Is This Program For You?
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black">
              {program.requirements?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4 rounded-lg bg-white p-4 shadow-sm border border-slate-200">
            {/* Quick Facts */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-black">Duration</span>
                <span className="text-sm font-semibold text-black">
                  {program.duration}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-black">Cost</span>
                <span className="text-sm font-bold text-brand-green-600">$0*</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-black">Format</span>
                <span className="text-sm font-semibold text-black">
                  {program.delivery.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-black">Level</span>
                <span className="text-sm font-semibold text-black">
                  Entry
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              *No cost for most eligible students
            </p>

            {isBarberProgram && (
              <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-brand-green-900 mb-1">
                      Earn While You Learn
                    </p>
                    <p className="text-xs text-brand-green-800">
                      Work in a real barbershop and get paid while completing
                      your training. You can attend school while working at the
                      shop!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-xs font-bold text-black mb-3">
                Ready to Apply?
              </h4>
              <a
                href={`/apply?program=${program.slug}`}
                className="block text-center rounded-lg bg-brand-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-orange-600 transition-colors"
              >
                Apply Now
              </a>
            </div>

            {isBarberProgram && (
              <div className="border-t border-slate-200 pt-6 mt-6">
                <h4 className="text-sm font-bold text-black mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-brand-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path
                      fillRule="evenodd"
                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Flexible Payment Option
                </h4>

                <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-brand-blue-900 mb-1">
                        {`Can't Wait for Funding? Pay in 4 with ${BNPL_PROVIDER_NAMES}`}
                      </p>
                      <p className="text-xs text-brand-blue-800">
                        Start training immediately and split your payment into
                        easy monthly installments with 0% APR options available.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-brand-blue-800 mt-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Pay in 4</strong> interest-free payments
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        Or <strong>0% APR</strong> for 3-24 months
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        As low as <strong>$207/month</strong> for 24 months
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Instant approval • No hidden fees</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white border-2 border-brand-blue-600 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-brand-blue-600 mb-1">
                      ${programPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-black">
                      Total Program Cost
                    </div>
                  </div>
                  <Link
                    href="/pay"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-4 text-base font-bold text-white hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path
                        fillRule="evenodd"
                        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pay Now / See Payment Options
                  </Link>
                  <p className="text-xs text-center text-black">
                    {`Stripe • ${BNPL_PROVIDER_NAMES} • Pay in 4 available`}
                  </p>
                </div>

                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <p className="text-xs font-bold text-purple-900">
                      Premium Adaptive Checkout™
                    </p>
                  </div>
                  <p className="text-xs text-black mb-2">
                    <strong>Flexible Payment Options:</strong>
                  </p>
                  <ul className="text-xs text-black space-y-1 pl-4 list-disc">
                    <li>
                      <strong>Pay in 4:</strong> Split into 4 interest-free
                      payments
                    </li>
                    <li>
                      <strong>Monthly:</strong> 3-24 months at 0% APR (qualified
                      buyers)
                    </li>
                    <li>
                      <strong>Extended:</strong> Up to 36 months with low rates
                    </li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <p className="text-xs text-black">
                      <strong>How it works:</strong> Click &quot;Pay Now&quot; → Select your BNPL provider at checkout → Get instant approval → Start training today
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Pay-in-4 options subject to approval. Interest-free when you pay on time.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* How It Works Section */}
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <ProgramHowItWorks
            programName={program.name}
            isApprenticeship={program.slug === 'barber-apprenticeship'}
          />
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <ProgramFAQ />
        </div>
      </section>

      {/* Second Hero Video - Centered Lower on Page */}
      <section className="w-full bg-slate-900 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/videos/hero-home.mp4" type="video/mp4" />
            </video>          </div>
        </div>
      </section>
    </>
  );
}
