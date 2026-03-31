import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Building2, Circle, 
  ArrowRight, Users, Briefcase, CreditCard, Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Pay for Training | Elevate for Humanity',
  description: 'Elevate for Humanity places students into one of three funding pathways—workforce-funded, employer-sponsored, or structured tuition.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tuition',
  },
};

export default function TuitionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Tuition & Payment' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-12 sm:py-16 min-h-[300px] sm:min-h-[400px]">
        <Image
          src="/images/pages/tuition-hero.jpg"
          alt="Tuition and Payment Options"
          fill
          className="object-cover"
         sizes="100vw" />
      </section>

      {/* Intro */}
      <section className="py-8 sm:py-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600">
            Our admissions team works with every applicant to determine the best pathway before enrollment.
          </p>
        </div>
      </section>

      {/* Funding Pathways */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12">
            
            {/* Pathway 1: Workforce-Funded */}
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-brand-green-600">Funding Pathway 1</p>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Workforce-Funded Training</h2>
                </div>
              </div>
              
              <p className="text-slate-700 mb-4">
                Many students qualify for public workforce funding that covers all or most program costs.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="font-medium text-slate-900 mb-2">This may include:</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                    Workforce Innovation and Opportunity Act (WIOA) funding
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                    State and local workforce grants
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                    Vocational Rehabilitation (VR)
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                    Justice-involved and re-entry programs
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                    Other approved workforce agencies
                  </li>
                </ul>
              </div>
              
              <p className="text-sm text-brand-green-800 font-medium">
                If you qualify, tuition, books, and required materials may be fully covered.
              </p>
            </div>

            {/* Pathway 2: Employer-Sponsored */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-brand-blue-600">Funding Pathway 2</p>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Employer-Sponsored Training</h2>
                </div>
              </div>
              
              <p className="text-slate-700 mb-4">
                Some students enroll through employer partnerships.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="font-medium text-slate-900 mb-2">This may include:</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                    Employer-paid cohort training
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                    Tuition reimbursement after hire
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                    Payroll-based reimbursement agreements
                  </li>
                </ul>
              </div>
              
              <p className="text-sm text-brand-blue-800 font-medium">
                Employer sponsorship is coordinated directly with admissions and hiring partners.
              </p>
            </div>

            {/* Pathway 3: Structured Student Tuition */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">Funding Pathway 3</p>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Structured Student Tuition</h2>
                </div>
              </div>
              
              <p className="text-slate-700 mb-4">
                For students who do not qualify for workforce funding or employer sponsorship, Elevate for Humanity offers a limited, structured tuition option designed to keep training accessible while maintaining program quality.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="font-semibold text-slate-900 mb-3">Internal Bridge Plan</p>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">$500</p>
                    <p className="text-xs text-slate-500">Initial payment</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">$200</p>
                    <p className="text-xs text-slate-500">Per month</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">3 mo</p>
                    <p className="text-xs text-slate-500">Maximum term</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  This short-term plan allows students to begin training while transitioning into employment, employer reimbursement, or an external tuition solution.
                </p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>After the bridge period,</strong> remaining tuition must be resolved through employer reimbursement, approved external tuition financing, or full balance payment.
                </p>
                <p className="text-sm text-amber-800 mt-2 font-medium">
                  Elevate for Humanity does not offer long-term internal payment plans and does not extend credit.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-8">
            Important Notes
          </h2>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>Funding pathways are determined prior to enrollment</span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>Payment terms are standardized and non-negotiable</span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>Enrollment and completion credentials require active good-standing status</span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>Our team will guide you through eligibility screening and documentation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Tuition FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Is training really free?', a: 'Yes, for eligible participants. WIOA, WRG, and JRI funding covers 100% of tuition for qualifying students. Self-pay options are available for those who don\'t qualify.' },
              { q: 'What if I don\'t qualify for free training?', a: `We offer payment plans and Buy Now, Pay Later options (${BNPL_PROVIDER_NAMES}) for self-pay students. Some programs have employer-sponsored spots. Our team will discuss all options with you.` },
              { q: 'Are there any hidden fees?', a: 'No hidden fees. We clearly disclose all costs upfront. Funded students have no out-of-pocket costs. Self-pay students know exact costs before enrolling.' },
              { q: 'Do I need to pay anything upfront?', a: 'For funded programs, no. For self-pay programs like Barber Apprenticeship, a deposit is required with the balance paid over time.' },
              { q: 'What does tuition include?', a: 'Tuition covers instruction, materials, certification exam fees (for most programs), and career services. Specific inclusions vary by program.' },
              { q: 'Can I get a refund if I withdraw?', a: 'Refund policies vary by program and funding source. Contact us for specific refund terms before enrolling.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
            Our Commitment
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-8">
            Our mission is access with structure. We are committed to helping students enter high-demand careers without confusion, false promises, or financial instability. Every funding pathway is designed to support completion, employment, and long-term success.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/start"
              className="inline-flex items-center justify-center gap-2 bg-brand-orange-600 text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-brand-orange-700 transition"
            >
              Apply Now
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold border-2 border-slate-200 hover:border-slate-300 transition"
            >
              <Phone className="w-5 h-5" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
