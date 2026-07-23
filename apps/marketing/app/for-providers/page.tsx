import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Training Providers & Program Holders',
  description: 'Partner with Elevate to deliver workforce training. Become a host shop, training provider, or apprenticeship sponsor.',
};

const PROGRAM_HOLDER_STEPS = [
  { step: '1', label: 'Apply', desc: 'Submit the program holder application.' },
  { step: '2', label: 'Verify', desc: 'Identity and org verification. 3-5 business days.' },
  { step: '3', label: 'Sign MOU', desc: 'Review and sign the Memorandum of Understanding.' },
  { step: '4', label: 'Onboard', desc: 'Complete orientation and set up your portal.' },
  { step: '5', label: 'Launch', desc: 'Enroll learners and track attendance.' },
];

const WHAT_YOU_GET = [
  'Access to Elevate curriculum library and LMS',
  'DOL-registered apprenticeship framework',
  'Credential authority under Elevate NHA and EPA agreements',
  'Compliance reporting tools (WIOA, FSSA, JRI)',
  'Dedicated program holder portal',
  'Instructor support and professional development',
  'Marketing and enrollment support',
];

const WHO_APPLIES = [
  { label: 'Barbershops & Salons', desc: 'Host DOL-registered barber or cosmetology apprentices.' },
  { label: 'Employers', desc: 'Run on-the-job training or apprenticeship programs.' },
  { label: 'Community Organizations', desc: 'Deliver workforce training to your community.' },
  { label: 'Healthcare Facilities', desc: 'Train CNAs, QMAs, or peer recovery specialists on-site.' },
  { label: 'Workforce Agencies', desc: 'Refer and co-enroll WIOA, FSSA, or JRI participants.' },
  { label: 'Training Organizations', desc: 'Co-deliver curriculum under Elevate credential authority.' },
];

export default function ForProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-4">Partner With Us</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">For Training Providers & Program Holders</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Deliver workforce training under Elevate credential authority.
            Host apprentices, co-deliver curriculum, or refer participants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/program-holder"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Apply as Program Holder <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact?subject=Training+Provider"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Who Should Apply */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">Who Should Apply</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHO_APPLIES.map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="font-bold text-slate-900 mb-2">{item.label}</p>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-12">How to Become a Partner</h2>
          <div className="grid sm:grid-cols-5 gap-4">
            {PROGRAM_HOLDER_STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-14 h-14 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {step.step}
                </div>
                <p className="font-bold text-slate-900 mb-1">{step.label}</p>
                <p className="text-xs text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-10">What You Get</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {WHAT_YOU_GET.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-red-400 shrink-0 mt-0.5" />
                <span className="text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-brand-red-700">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-2xl font-extrabold mb-4">Ready to Get Started?</h2>
          <p className="text-red-100 mb-8">
            Apply to become a program holder or contact us to learn more.
          </p>
          <Link
            href="/apply/program-holder"
            className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-colors"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
