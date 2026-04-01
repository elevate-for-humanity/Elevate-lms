import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Users,
  ClipboardList,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'FSSA / IMPACT Program — Funded Training Referral | Elevate for Humanity',
  description:
    'Learn how to qualify for funded workforce training through the Indiana FSSA IMPACT program. Check eligibility requirements and submit your referral.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/fssa-impact' },
};

export const revalidate = 3600;

const REFERRAL_LINK =
  'https://forms.office.com/Pages/DesignPageV2.aspx?subpage=design&id=ur-ZIQmkE0-wxBi0WTPYjV0A5ER10IVMh2fEaoRcJKtUN1RYWkFSTDRDNlZUNUVCUzZaMzkzNVhRUC4u';

export default function FSSAImpactPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            Funded Training
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            FSSA / IMPACT Program
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Indiana's IMPACT program connects eligible residents receiving public assistance
            to free career training and workforce development. If you qualify, Elevate for
            Humanity can refer you for fully funded training at no cost to you.
          </p>
        </div>
      </section>

      {/* What is IMPACT */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What Is the IMPACT Program?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            IMPACT (Indiana Manpower Placement and Comprehensive Training) is administered by
            the <strong>Indiana Family and Social Services Administration (FSSA)</strong>. It
            provides workforce training, job placement support, and career development services
            to eligible Indiana residents who receive public assistance benefits.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Elevate for Humanity Career &amp; Technical Institute is a participating training
            provider. When you are referred through IMPACT, your training costs are covered —
            you focus on completing the program and getting to work.
          </p>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Eligibility Requirements</h2>
          <p className="text-slate-600 mb-8">
            You must meet <strong>all three</strong> of the following to be referred for funded training.
          </p>

          <div className="space-y-5">

            {/* Requirement 1 — Benefits */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex gap-4 items-start">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">
                    1. You receive SNAP or TANF benefits
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    You must currently be receiving one of the following:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex gap-2 items-start p-3 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">SNAP</p>
                        <p className="text-slate-600 text-xs">Food stamp benefits (EBT card)</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start p-3 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">TANF</p>
                        <p className="text-slate-600 text-xs">Temporary Assistance for Needy Families (cash assistance)</p>
                      </div>
                    </div>
                  </div>

                  {/* Important callout */}
                  <div className="flex gap-3 items-start p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm mb-1">
                        Medicaid and HIP do NOT qualify
                      </p>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Having Medicaid or the Healthy Indiana Plan (HIP) alone does not make
                        you eligible. You must specifically receive <strong>SNAP (food stamps)
                        or TANF (cash assistance)</strong> to qualify for this referral.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirement 2 — Legal */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex gap-4 items-start">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">
                    2. No pending legal charges
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You must not have any <strong>pending legal charges</strong> at the time of
                    referral. Prior convictions do not automatically disqualify you — it is
                    specifically active pending charges that are a barrier. If you have
                    questions about your situation, contact us before submitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Requirement 3 — Education */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex gap-4 items-start">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">
                    3. High school diploma, GED, HSE, or transcripts
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    You must have one of the following as proof of education:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      'High school diploma',
                      'GED (General Educational Development)',
                      'HSE (High School Equivalency)',
                      'Official high school transcripts',
                    ].map((item, i) => (
                      <div key={i} className="flex gap-2 items-center p-2 bg-slate-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Does not qualify */}
      <section className="py-10 px-4 bg-red-50 border-y border-red-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-start">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">What Does NOT Qualify</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: 'Medicaid only', note: 'Health coverage alone is not a qualifying benefit' },
                  { label: 'HIP (Healthy Indiana Plan)', note: 'HIP is health insurance, not cash or food assistance' },
                  { label: 'Pending legal charges', note: 'Active charges must be resolved before referral' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 bg-white rounded-lg border border-red-100">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How the Referral Process Works</h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Check your eligibility above',
                desc: 'Make sure you meet all three requirements — SNAP or TANF benefits, no pending charges, and a diploma/GED/HSE.',
              },
              {
                step: '2',
                title: 'Submit the referral form',
                desc: 'Click the button below to complete the referral form. This is how we officially submit your information for review.',
              },
              {
                step: '3',
                title: 'We review your referral',
                desc: 'Elizabeth Greene personally reviews every referral submission.',
              },
              {
                step: '4',
                title: 'If you qualify — you get a call',
                desc: 'Elizabeth will call you directly to discuss the IMPACT program expectations, your training program, and next steps to get started.',
              },
              {
                step: '5',
                title: 'If you do not qualify — you get an email',
                desc: 'You will receive an email explaining specifically why you did not qualify and what other options may be available to you.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="w-9 h-9 rounded-full bg-brand-red-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — referral form */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <ClipboardList className="w-10 h-10 text-brand-red-400 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Submit Your Referral?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            If you meet all three eligibility requirements, submit the referral form now.
            Elizabeth will personally review your submission and follow up directly.
          </p>
          <a
            href={REFERRAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-full transition-colors shadow-lg"
          >
            Submit Referral Form
            <ExternalLink className="w-5 h-5" />
          </a>
          <p className="text-slate-500 text-sm mt-4">
            Opens the official FSSA/IMPACT referral form
          </p>
        </div>
      </section>

      {/* Questions */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Questions?</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            Not sure if you qualify? Have questions about the process? Contact us before
            submitting — we will help you figure out if this is the right path for you.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href="tel:3173143757"
              className="flex gap-3 items-center p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Call or Text</p>
                <p className="text-slate-600 text-sm">(317) 314-3757</p>
              </div>
            </a>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="flex gap-3 items-center p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Email Us</p>
                <p className="text-slate-600 text-sm">info@elevateforhumanity.org</p>
              </div>
            </a>
            <Link
              href="/apply/student"
              className="flex gap-3 items-center p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Users className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Apply First</p>
                <p className="text-slate-600 text-sm">Submit your program application</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
