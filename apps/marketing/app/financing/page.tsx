'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  CheckCircle,
  Shield,
  ChevronRight,
  CreditCard,
  Landmark,
  Wallet,
} from 'lucide-react';

const FINANCING_OPTIONS = [
  {
    id: 'third-party-financing',
    name: 'Third-Party Financing',
    tagline: 'Review terms before accepting an offer',
    description:
      'Where a third-party financing option is offered at checkout, the finance provider controls approval, rates, fees, repayment terms, disclosures, and credit-related decisions.',
    terms: [
      'Availability varies by program and checkout',
      'Provider terms control the financing agreement',
      'Review APR, fees, and repayment schedule',
      'Financing approval is not guaranteed by Elevate',
    ],
    icon: CreditCard,
    color: 'blue',
    cta: 'Review Program Options',
    href: '/programs',
  },
  {
    id: 'wioa',
    name: 'WIOA / WorkOne Funding',
    tagline: 'Agency-authorized workforce funding',
    description:
      'WIOA is not consumer financing and is not approved by Elevate. WorkOne or the responsible workforce entity determines participant eligibility, approved programs, allowable costs, available funds, and authorization.',
    terms: [
      'Program-specific eligibility applies',
      'Participant eligibility is determined externally',
      'Covered costs and amounts vary',
      'Written authorization is required',
    ],
    icon: Landmark,
    color: 'green',
    cta: 'Review Funding Process',
    href: '/funding',
  },
  {
    id: 'payment-plan',
    name: 'Elevate Payment Arrangement',
    tagline: 'Ask whether installments are available',
    description:
      'Some self-pay programs may offer an installment arrangement. The enrollment agreement and checkout terms for the selected program control amounts, due dates, fees, cancellation, and refund obligations.',
    terms: [
      'Availability varies by program',
      'Review the written enrollment agreement',
      'Confirm the total program price',
      'Do not rely on a generic payment example',
    ],
    icon: Wallet,
    color: 'amber',
    cta: 'Review Programs',
    href: '/programs',
  },
];

const FAQS = [
  {
    q: 'Does Elevate approve third-party financing?',
    a: 'No. Any lender or buy-now-pay-later provider controls its own application, approval, credit process, rates, fees, and repayment terms. Review that provider’s disclosures before accepting an offer.',
  },
  {
    q: 'Can workforce funding and self-pay both apply?',
    a: 'Do not assume a remaining balance or funding amount. First obtain the responsible agency’s written authorization showing what is approved. Then review the program enrollment agreement for any participant responsibility that remains.',
  },
  {
    q: "What if I cannot make a scheduled self-pay payment?",
    a: 'Contact the billing or enrollment team before the due date and review the written agreement governing your account. Any change must be documented rather than assumed from this page.',
  },
  {
    q: 'Are all programs eligible for financing or workforce funding?',
    a: 'No. Funding and financing are program specific. Workforce funding also requires participant eligibility and agency authorization.',
  },
];

export default function FinancingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
            <DollarSign className="w-4 h-4" aria-hidden="true" /> Payment & Funding Paths
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Understand the payment path before you enroll</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Self-pay arrangements, third-party financing, and government workforce funding are different processes with different decision-makers and written terms.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          This page is informational. It does not approve credit, create a financing offer, determine WIOA eligibility, guarantee funding, or replace the program enrollment agreement or a funding agency's written authorization.
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FINANCING_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const colors: Record<string, string> = {
              blue: 'border-blue-200 bg-blue-50',
              green: 'border-green-200 bg-green-50',
              amber: 'border-amber-200 bg-amber-50',
            };
            const btnColors: Record<string, string> = {
              blue: 'bg-blue-600 hover:bg-blue-700',
              green: 'bg-green-600 hover:bg-green-700',
              amber: 'bg-amber-600 hover:bg-amber-700',
            };
            return (
              <article key={opt.id} className={`rounded-2xl border-2 p-6 flex flex-col ${colors[opt.color]}`}>
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-slate-700 mb-3" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-slate-900">{opt.name}</h2>
                  <p className="text-sm font-medium text-slate-600 mt-1">{opt.tagline}</p>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">{opt.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {opt.terms.map((term) => (
                    <li key={term} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {term}
                    </li>
                  ))}
                </ul>
                <Link href={opt.href} className={`flex items-center justify-center gap-2 w-full text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm ${btnColors[opt.color]}`}>
                  {opt.cta} <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: 'Written terms control', sub: 'Use the applicable agreement and disclosures' },
            { icon: Landmark, label: 'Agency decisions stay external', sub: 'Elevate does not issue WIOA approval' },
            { icon: CheckCircle, label: 'Program-specific review', sub: 'Costs and available options can differ by program' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="w-6 h-6 text-slate-500" aria-hidden="true" />
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-slate-600 text-xs">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Common questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                {faq.q}
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} aria-hidden="true" />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-700 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white py-14 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Review the exact program first</h2>
        <p className="text-slate-300 mb-6 text-sm">
          Confirm tuition, required fees, refund terms, credential requirements, and the payment or funding path that applies to your enrollment.
        </p>
        <Link href="/programs" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors">
          Browse Programs <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
