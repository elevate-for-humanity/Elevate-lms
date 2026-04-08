'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, CreditCard, BookOpen, Award, ArrowLeft, Phone } from 'lucide-react';
import {
  NHA_PROGRAMS,
  getBundleRetailPrice,
  getRetailPrice,
  showPaymentPlan,
} from '@/lib/testing/nha-pricing';
import {
  NHA_PROGRAM_AGREEMENTS,
  formatResponsibility,
} from '@/lib/testing/nha-programs';
import { TESTING_CENTER } from '@/lib/testing/testing-config';

// Maps URL slugs → nha-pricing.ts program keys
const SLUG_TO_PROGRAM_KEY: Record<string, keyof typeof NHA_PROGRAMS> = {
  'nha-medical-assistant':     'medicalAssistant',
  'nha-pharmacy-technician':   'pharmacyTechnician',
  'nha-phlebotomy':            'phlebotomy',
  'nha-billing-coding':        'billingAndCoding',
  'nha-patient-care-technician': 'patientCareTechnician',
  'nha-medical-admin-assistant': 'medicalAdminAssistant',
  'nha-ehr':                   'electronicHealthRecords',
  'nha-ekg-technician':        'ekgTechnician',
};

// Maps nha-pricing.ts keys → agreement keys
const PROGRAM_TO_AGREEMENT_KEY: Record<string, string> = {
  medicalAssistant:       'medical_assistant',
  pharmacyTechnician:     'pharmacy',
  phlebotomy:             'phlebotomy',
  billingAndCoding:       'billing_coding',
  patientCareTechnician:  'patient_care',
  medicalAdminAssistant:  'medical_admin',
  electronicHealthRecords:'ehr',
  ekgTechnician:          'ekg',
};

export default function NhaProgramPage() {
  const params   = useParams();
  const slug     = typeof params.program === 'string' ? params.program : '';
  const progKey  = SLUG_TO_PROGRAM_KEY[slug];

  if (!progKey) notFound();

  const program      = NHA_PROGRAMS[progKey];
  const bundlePrice  = getBundleRetailPrice(program);
  const hasPayPlan   = showPaymentPlan(program);
  const agreementKey = PROGRAM_TO_AGREEMENT_KEY[progKey];
  const agreement    = NHA_PROGRAM_AGREEMENTS.find(a => a.key === agreementKey);

  const [enrolling, setEnrolling] = useState(false);

  async function handleEnroll() {
    if (!bundlePrice) return; // a la carte — redirect to contact
    setEnrolling(true);
    try {
      // The canonical checkout endpoint requires auth + program_id (UUID from DB).
      // We redirect to the apply flow which handles auth + program lookup by slug.
      window.location.href = `/apply?program=${slug}&source=nha-program-page`;
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <div className="bg-emerald-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Link
            href="/programs/healthcare"
            className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Healthcare Programs
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2">
                NHA Certification Program
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                {program.label} Program
              </h1>
              {agreement && (
                <p className="text-emerald-200 text-sm mt-2">
                  Credential: {agreement.credential}
                </p>
              )}
            </div>
            {bundlePrice != null && (
              <div className="text-right flex-shrink-0">
                <p className="text-4xl font-extrabold">${bundlePrice}</p>
                <p className="text-emerald-300 text-sm">bundled program</p>
                {hasPayPlan && (
                  <p className="text-emerald-200 text-xs mt-1 flex items-center justify-end gap-1">
                    <CreditCard className="w-3 h-3" />
                    Payment plans available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">

        {/* Left — program details */}
        <div className="lg:col-span-2 space-y-10">

          {/* Tagline */}
          <p className="text-slate-600 text-lg leading-relaxed">
            {program.tagline}. Get trained, certified, and job-ready for a high-demand healthcare role.
            No experience required.
          </p>

          {/* What's included */}
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">What You Get</h2>
            <ul className="space-y-3">
              {[
                'Structured training program',
                'Certification exam preparation',
                'Practice assessments',
                'Progress tracking and readiness reports',
                'Support throughout your training',
                'First exam attempt included',
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* A la carte products */}
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">
              Program Components
            </h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {program.products.map(product => (
                <div key={product.key} className="flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{product.label}</span>
                  </div>
                  <span className="text-slate-800 font-semibold text-sm flex-shrink-0 ml-4">
                    ${getRetailPrice(product)}
                  </span>
                </div>
              ))}
            </div>
            {bundlePrice != null && (
              <p className="text-emerald-700 text-sm font-semibold mt-3">
                Bundle all components for ${bundlePrice} — save vs a la carte.
              </p>
            )}
          </section>

          {/* Payment structure — admin-style transparency for the learner */}
          {agreement && (
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">Payment Structure</h2>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-600 text-sm">Prep Materials</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {formatResponsibility(agreement.prepMaterialPayment)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-600 text-sm">First Exam Attempt</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {formatResponsibility(agreement.examAttemptPayment)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-600 text-sm">Retakes (if needed)</span>
                  <span className="text-sm font-semibold text-amber-700">
                    {formatResponsibility(agreement.retakePayment)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-600 text-sm">Exam Delivery</span>
                  <span className="text-sm font-semibold text-slate-800 capitalize">
                    {agreement.examDelivery}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Retakes are the candidate's responsibility and are not included in the bundle price.
              </p>
            </section>
          )}

        </div>

        {/* Right — enrollment CTA */}
        <aside className="space-y-5">

          {/* Enroll card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="bg-emerald-700 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <Award className="w-5 h-5" />
                <h3 className="font-bold text-lg">Enroll Now</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {bundlePrice != null ? (
                <>
                  <div>
                    <p className="text-3xl font-extrabold text-slate-900">${bundlePrice}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Full program bundle</p>
                  </div>
                  {hasPayPlan && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                      <p className="text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Payment plans available for qualifying applicants
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-4 py-3.5 rounded-xl transition-colors text-sm"
                  >
                    {enrolling ? 'Redirecting…' : 'Start Enrollment →'}
                  </button>
                  <p className="text-slate-400 text-xs text-center">
                    You'll complete your application before payment.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-slate-600 text-sm">
                    This program is available a la carte. Contact admissions for pricing and enrollment.
                  </p>
                  <Link
                    href={`/contact?program=${slug}`}
                    className="flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-3.5 rounded-xl transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Speak With Admissions
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Contact fallback */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <p className="text-slate-600 text-sm font-semibold mb-1">Questions?</p>
            <p className="text-slate-500 text-xs mb-3">
              Our admissions team can help you choose the right program and explore funding options.
            </p>
            <a
              href={`tel:${TESTING_CENTER.phoneTel}`}
              className="text-emerald-700 font-semibold text-sm hover:underline"
            >
              {TESTING_CENTER.phone}
            </a>
          </div>

        </aside>
      </div>

      {/* Bottom CTA */}
      <section className="bg-slate-900 py-14 px-6 text-center">
        <h2 className="text-2xl font-extrabold text-white mb-3">
          Start Your Healthcare Career Today
        </h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm">
          Choose your program, get certified, and take the next step toward a stable and in-demand career.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {bundlePrice != null ? (
            <button
              onClick={handleEnroll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
            >
              Get Started
            </button>
          ) : null}
          <Link
            href="/contact"
            className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-bold px-8 py-4 rounded-full transition-colors"
          >
            Speak With Admissions
          </Link>
        </div>
      </section>

    </main>
  );
}
