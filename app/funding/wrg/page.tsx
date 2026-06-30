import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, DollarSign, GraduationCap, FileCheck } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Workforce Ready Grant | Indiana State Funding',
  description:
    'The Indiana Workforce Ready Grant covers 100% of tuition for high-demand certification programs. No repayment required.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/wrg' },
};

export default function WorkforceReadyGrantPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Funding', href: '/funding' }, { label: 'Workforce Ready Grant' }]}
        />
      </div>

      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Indiana State Funding
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Workforce Ready Grant</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Indiana's Workforce Ready Grant covers 100% of tuition for high-demand certification
            programs — no loans, no repayment. Available to working adults 25 and older.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check My Eligibility
            </Link>
            <Link
              href="/apply"
              className="border-2 border-white/40 text-slate-900 font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">What the grant covers</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: 'Full Tuition',
                desc: '100% of program tuition for approved courses on the INDemand Jobs list.',
              },
              {
                icon: GraduationCap,
                title: 'Exam Fees',
                desc: 'Certification exam fees — EPA 608, CompTIA, NHA, and other industry exams.',
              },
              {
                icon: FileCheck,
                title: 'Books & Supplies',
                desc: 'Required course materials, textbooks, and lab supplies for eligible programs.',
              },
            ].map((item) => (
              <div key={item.title} className="border border-slate-200 rounded-xl p-6">
                <item.icon className="w-6 h-6 text-brand-red-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Who qualifies</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Indiana resident',
              'Age 25 or older (or 21–24 with a high school diploma/GED)',
              'Currently employed or recently unemployed',
              'Enrolling in an approved high-demand program',
              'Program must be on the Indiana INDemand Jobs list',
            ].map((req) => (
              <div
                key={req}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg p-4"
              >
                <CheckCircle className="w-5 h-5 text-brand-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">How to apply</h2>

          {/* ── Indiana Career Connect callout ───────────────────────── */}
          <div className="mb-8 bg-amber-50 border-2 border-amber-400 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-amber-900 text-lg mb-1">Start at Indiana Career Connect</p>
              <p className="text-amber-800 text-sm leading-relaxed">
                The Workforce Ready Grant is processed through{' '}
                <strong>Indiana Career Connect</strong> — Indiana's official workforce
                portal. Create a free account there to begin your application.
                Your school enrollment at Elevate is step two.
              </p>
            </div>
            <a
              href="https://www.indianacareerconnect.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm text-center"
            >
              Go to Indiana Career Connect →
            </a>
          </div>

          <ol className="space-y-6">
            {[
              {
                n: '1',
                title: 'Check eligibility',
                desc: 'Use our eligibility checker to confirm you qualify before applying.',
              },
              {
                n: '2',
                title: 'Apply to Elevate',
                desc: 'Submit your program application. Our team identifies all funding you qualify for.',
              },
              {
                n: '3',
                title: 'Complete the grant application',
                desc: 'We guide you through the state application. Most students finish in under 30 minutes.',
              },
              {
                n: '4',
                title: 'Start training',
                desc: 'Once approved, your tuition is covered. You start at no cost.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check My Eligibility
            </Link>
            <Link
              href="/contact"
              className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
