import Link from 'next/link';
import { ArrowRight, Shield, Scissors } from 'lucide-react';
import { ENROLLMENT_STEPS, ELIGIBILITY } from '../barber-program-data';

export function BarberEnrollment() {
  return (
    <>
      {/* Section 10 — How Payment Works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 text-center">How Payment Works</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Apply first. We determine your payment situation — you don&apos;t need to figure it out upfront.
          </p>

          {/* Apply-first flow */}
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-10 h-10 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">1</div>
              <h3 className="font-bold text-slate-900 mb-2">Apply</h3>
              <p className="text-slate-600 text-sm">Submit your application. Takes 3–5 minutes.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-10 h-10 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">2</div>
              <h3 className="font-bold text-slate-900 mb-2">We Check Eligibility</h3>
              <p className="text-slate-600 text-sm">We review your application and check available funding sources on your behalf.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-10 h-10 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">3</div>
              <h3 className="font-bold text-slate-900 mb-2">You Get Options</h3>
              <p className="text-slate-600 text-sm">If funding is approved, tuition may be covered. If not, flexible payment plans are available.</p>
            </div>
          </div>

          <p className="text-center mb-10">
            <Link href="/programs/barber-apprenticeship/apply" className="inline-block bg-brand-red-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-brand-red-700 transition-colors">
              See Payment Options &amp; Apply
            </Link>
          </p>

          {/* Payment details — buried below the fold of the section */}
          <details className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer font-semibold text-slate-700 text-sm hover:bg-slate-100 transition-colors">
              See payment plan details
            </summary>
            <div className="px-6 pb-6 pt-2 space-y-3 text-sm text-slate-700">
              <p><strong>Payment Plan:</strong> Start with a $600 minimum down payment, then pay the remaining balance over 29 weekly installments. No interest.</p>
              <p><strong>Pay in Full:</strong> Pay $4,731 upfront (5% discount — save $249).</p>
              <p className="text-xs text-slate-500 pt-2">Total program cost: $4,980. Payment method is selected after your application is reviewed.</p>
            </div>
          </details>
        </div>
      </section>

      {/* Partner Shop Application CTA */}
      <section className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Scissors className="w-7 h-7 text-slate-700" />
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Own a Barbershop?</h2>
              </div>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                Become a partner training site and host apprentices in your shop. We handle the paperwork — you train the next generation.
              </p>
              <ul className="text-slate-600 text-sm space-y-1.5 mb-6">
                {[
                  'Get pre-screened, motivated apprentices',
                  'Zero administrative burden — we handle compliance',
                  'First pick to hire graduates',
                  'Recognition as an approved training site',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/partners/barber-host-shop/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
                  Apply as Partner Shop <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/programs/barber-apprenticeship/host-shops" className="inline-flex items-center gap-2 border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors text-sm">See Details</Link>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="text-slate-900 font-bold text-base mb-4">Quick Application Checklist</h3>
              <div className="space-y-3">
                {[
                  'Active Indiana barbershop license',
                  'Licensed supervising barber on staff',
                  'Workers\' compensation insurance',
                  'Physical shop location in Indiana',
                  'Willingness to sign MOU',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-6 h-6 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11 — Eligibility & Enrollment */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-4">Eligibility &amp; Enrollment</h2>

          {/* Eligibility */}
          <div className="max-w-2xl mx-auto mb-10 bg-white p-6 rounded-xl border border-slate-200">
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

          {/* Steps */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-bold text-xl text-slate-900 text-center mb-6">How to Enroll</h3>
            <div className="space-y-3">
              {ENROLLMENT_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-lg p-4 border border-slate-200">
                  <div className="w-8 h-8 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
      <section className="py-12">
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

    </>
  );
}
