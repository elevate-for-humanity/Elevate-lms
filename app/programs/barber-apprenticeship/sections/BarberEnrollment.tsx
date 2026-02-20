import Link from 'next/link';
import { ArrowRight, Phone, Shield } from 'lucide-react';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';
import { ENROLLMENT_STEPS, ELIGIBILITY } from '../barber-program-data';

export function BarberEnrollment() {
  return (
    <>
      {/* Section 10 — Tuition, Funding & Payment */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 text-center">Tuition, Funding &amp; Payment Options</h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            This program is a workforce training and apprenticeship-aligned program. Funding eligibility may vary based on individual workforce programs, partner sponsorships, or external approvals.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">Pay in Full</h3>
              <p className="text-slate-600 text-sm">Visa, Mastercard, Amex, Discover via Stripe</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">Payment Plans</h3>
              <p className="text-slate-600 text-sm">Weekly or monthly installments with down payment</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">BNPL Options</h3>
              <p className="text-slate-600 text-sm">Affirm, Sezzle, Klarna where eligible</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">Employer Sponsorship</h3>
              <p className="text-slate-600 text-sm">Invoice or sponsorship agreement available</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 text-center max-w-2xl mx-auto">
            Payment plans and financing availability are subject to provider approval and individual eligibility. Workforce partner referrals accepted when applicable.
          </p>
        </div>
      </section>

      {/* Section 11 — Eligibility & Enrollment */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-4">Eligibility &amp; Enrollment</h2>

          {/* Eligibility */}
          <div className="max-w-2xl mx-auto mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Eligibility Requirements</h3>
            <div className="space-y-2">
              {ELIGIBILITY.map((req, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0 mt-2" />
                  <span className="text-slate-700 text-sm">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Funding info */}
          <div className="max-w-2xl mx-auto mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Funding Sources</h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                <strong>JRI (Justice Reinvestment Initiative):</strong> If you are justice-involved (currently on probation, parole, or recently released), JRI funding may cover your entire apprenticeship at no cost. JRI also provides supportive services like transportation assistance and work supplies.
              </p>
              <p className="text-sm text-slate-700">
                <strong>WIOA:</strong> Adults and dislocated workers who meet income guidelines or are receiving public assistance may qualify for WIOA funding, which covers tuition, books, supplies, and in some cases transportation and childcare.
              </p>
              <p className="text-sm text-slate-700">
                <strong>Self-Pay:</strong> Payment plans and BNPL financing available. Contact us or submit the intake form to find out which options you qualify for.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-bold text-xl text-slate-900 text-center mb-6">How to Enroll</h3>
            <div className="space-y-3">
              {ENROLLMENT_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 12 — Compliance & Workforce Alignment */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-blue-800 leading-relaxed">
                This program is aligned with workforce training standards and apprenticeship-based learning models, incorporating structured RTI, employer-supervised OJT, mapped competencies, and documented progress reporting suitable for workforce partners and cohort training programs. Enrollment is contingent upon eligibility, funding availability, and employer participation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Start Your Barber Career
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            2,000-hour apprenticeship with licensed shop training. Apply today to check your eligibility.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=barber-apprenticeship" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </Link>
          </div>
          <div className="mt-6 flex justify-center">
            <ProgramTutorCTA
              programSlug="barber-apprenticeship"
              programName="Barber Apprenticeship"
              applyHref="/apply?program=barber-apprenticeship"
              suggestions={['How long is the apprenticeship?', 'What license will I earn?', 'Is funding available?', 'Can I work while enrolled?']}
            />
          </div>
        </div>
      </section>
    </>
  );
}
