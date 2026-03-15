import Link from 'next/link';
import { ArrowRight, Phone, Shield, CreditCard, DollarSign, Building2, Scissors } from 'lucide-react';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';
import { ENROLLMENT_STEPS, ELIGIBILITY } from '../barber-program-data';
import { ACTIVE_BNPL_PROVIDERS, BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';

export function BarberEnrollment() {
  return (
    <>
      {/* Section 10 — Tuition, Funding & Payment */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 text-center">Tuition, Funding &amp; Payment Options</h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            This program is a workforce training and apprenticeship-aligned program. Funding eligibility may vary based on individual workforce programs, partner sponsorships, or external approvals.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <DollarSign className="w-8 h-8 text-brand-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Pay in Full</h3>
              <p className="text-slate-600 text-sm mb-3">Visa, Mastercard, Amex, Discover via Stripe</p>
              <Link href="/programs/barber-apprenticeship/apply?type=apprentice" className="inline-block text-sm font-semibold text-brand-red-600 hover:text-brand-red-700">
                Apply Now &rarr;
              </Link>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <CreditCard className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Payment Plans</h3>
              <p className="text-slate-600 text-sm mb-3">Weekly or monthly installments with down payment</p>
              <Link href="/pay" className="inline-block text-sm font-semibold text-brand-red-600 hover:text-brand-red-700">
                View Plans &rarr;
              </Link>
            </div>
            <div className="bg-white rounded-xl p-5 border-2 border-brand-blue-400 text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
              <CreditCard className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Buy Now, Pay Later</h3>
              <p className="text-slate-600 text-sm mb-2">Split into interest-free payments</p>
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                {ACTIVE_BNPL_PROVIDERS.slice(0, 3).map((p) => (
                  <span key={p.id} className={`px-2 py-0.5 ${p.badgeBg} ${p.badgeText} rounded-full text-xs font-medium`}>{p.name}</span>
                ))}
              </div>
              <Link href="/pay" className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                Apply for BNPL
              </Link>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <Building2 className="w-8 h-8 text-brand-orange-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Employer Sponsorship</h3>
              <p className="text-slate-600 text-sm mb-3">Invoice or sponsorship agreement available</p>
              <Link href="/programs/barber-apprenticeship/apply?type=partner_shop" className="inline-block text-sm font-semibold text-brand-red-600 hover:text-brand-red-700">
                Partner Info &rarr;
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 text-center max-w-2xl mx-auto">
            Payment plans and financing availability are subject to provider approval and individual eligibility. Workforce partner referrals accepted when applicable.
          </p>
        </div>
      </section>

      {/* Partner Shop Application CTA */}
      <section className="py-12 bg-brand-orange-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <Scissors className="w-8 h-8" />
                <h2 className="text-2xl md:text-3xl font-black">Own a Barbershop?</h2>
              </div>
              <p className="text-white/90 text-lg mb-2">
                Become a partner training site and host apprentices in your shop. We handle the paperwork — you train the next generation.
              </p>
              <ul className="text-white/80 text-sm space-y-1 mb-6">
                <li>&#x2022; Get pre-screened, motivated apprentices</li>
                <li>&#x2022; Zero administrative burden — we handle compliance</li>
                <li>&#x2022; First pick to hire graduates</li>
                <li>&#x2022; Recognition as an approved training site</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/programs/barber-apprenticeship/apply?type=partner_shop" className="inline-flex items-center gap-2 bg-white text-brand-orange-700 font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors">
                  Apply as Partner Shop <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/programs/barber-apprenticeship/host-shops" className="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/30 transition-colors border border-white/40">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-bold text-lg mb-4">Quick Application Checklist</h3>
              <div className="space-y-3">
                {[
                  'Active Indiana barbershop license',
                  'Licensed supervising barber on staff',
                  'Workers\' compensation insurance',
                  'Physical shop location in Indiana',
                  'Willingness to sign MOU',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-white/90 text-sm">
                    <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11 — Eligibility & Enrollment */}
      <section className="py-16 bg-white">
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

          {/* Funding info */}
          <div className="max-w-2xl mx-auto mb-10 bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Funding Sources</h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                <strong>JRI (Job Ready Indy):</strong> If you are justice-involved (currently on probation, parole, or recently released), JRI funding may cover your entire apprenticeship at no cost. JRI also provides supportive services like transportation assistance and work supplies.
              </p>
              <p className="text-sm text-slate-700">
                <strong>WIOA:</strong> Adults and dislocated workers who meet income guidelines or are receiving public assistance may qualify for WIOA funding, which covers tuition, books, supplies, and in some cases transportation and childcare.
              </p>
              <p className="text-sm text-slate-700">
                <strong>Self-Pay:</strong> Payment plans and BNPL financing ({BNPL_PROVIDER_NAMES}) available. Contact us or submit the intake form to find out which options you qualify for.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-bold text-xl text-slate-900 text-center mb-6">How to Enroll</h3>
            <div className="space-y-3">
              {ENROLLMENT_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-lg p-4 border border-slate-200">
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
      <section className="py-12 bg-white">
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
      <section className="py-20 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500 text-amber-950 text-sm font-bold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-amber-900 rounded-full animate-pulse" />
            Classes Starting Late May – Early June 2025
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Join the Waitlist
          </h2>
          <p className="text-xl text-slate-300 mb-4">
            We are finalizing barbershop placement sites now. Submit your application to secure your spot — we will contact you as soon as placements are confirmed.
          </p>
          <p className="text-slate-400 mb-8">
            Pay in full, use a payment plan, or apply for Buy Now Pay Later with {BNPL_PROVIDER_NAMES}.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/programs/barber-apprenticeship/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Join Waitlist <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/programs/barber-apprenticeship/apply?type=partner_shop" className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              <Building2 className="w-5 h-5" /> Apply as Partner Shop
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Link href="/pay" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all border border-white/30">
              <CreditCard className="w-4 h-4" /> BNPL Options
            </Link>
            <Link href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all border border-white/30">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </Link>
          </div>
          <div className="mt-4 flex justify-center">
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
