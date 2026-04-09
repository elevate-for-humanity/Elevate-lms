'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DollarSign, CheckCircle, Clock, Shield, ChevronRight, CreditCard, Landmark, Wallet } from 'lucide-react';

const FINANCING_OPTIONS = [
  {
    id: 'affirm',
    name: 'Affirm',
    tagline: 'Pay over time — no hidden fees',
    description: 'Split your program cost into monthly payments. Rates from 0–36% APR. Check your rate without affecting your credit score.',
    terms: ['3, 6, or 12 month plans', 'No prepayment penalty', 'Instant decision', 'Soft credit check only'],
    icon: CreditCard,
    color: 'blue',
    cta: 'Apply with Affirm',
    href: '/enrollment?payment=affirm',
  },
  {
    id: 'wioa',
    name: 'WIOA / WorkOne Funding',
    tagline: 'Free training for eligible workers',
    description: 'The Workforce Innovation and Opportunity Act funds training for unemployed and underemployed workers. No repayment required if you qualify.',
    terms: ['Full tuition covered', 'No income repayment', 'Must meet eligibility', 'WorkOne referral required'],
    icon: Landmark,
    color: 'green',
    cta: 'Check Eligibility',
    href: '/check-eligibility',
  },
  {
    id: 'payment-plan',
    name: 'Elevate Payment Plan',
    tagline: 'Split into 2–4 installments',
    description: 'Pay your program cost in installments directly with Elevate. No interest, no credit check. First payment due at enrollment.',
    terms: ['2–4 installments', '0% interest', 'No credit check', 'Auto-pay available'],
    icon: Wallet,
    color: 'amber',
    cta: 'Enroll with Payment Plan',
    href: '/enrollment?payment=plan',
  },
];

const FAQS = [
  { q: 'Does Affirm affect my credit score?', a: 'Checking your rate with Affirm is a soft inquiry and does not affect your credit score. A hard inquiry only occurs if you accept a loan.' },
  { q: 'Can I combine WIOA funding with a payment plan?', a: 'If WIOA covers part of your program cost, you can use a payment plan for any remaining balance.' },
  { q: 'What if I can\'t make a payment?', a: 'Contact us before your payment is due. We work with students on hardship deferrals on a case-by-case basis.' },
  { q: 'Are all programs eligible for financing?', a: 'Most programs are eligible. Some short-term workshops require full payment at registration.' },
];

export default function FinancingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
            <DollarSign className="w-4 h-4" /> Flexible Financing
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Don't let cost stop you</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Elevate offers multiple ways to fund your training — from interest-free payment plans to full WIOA grants. Find the option that works for you.
          </p>
        </div>
      </section>

      {/* Options */}
      <section className="max-w-5xl mx-auto px-4 py-16">
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
              <div key={opt.id} className={`rounded-2xl border-2 p-6 flex flex-col ${colors[opt.color]}`}>
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-slate-700 mb-3" />
                  <h2 className="text-xl font-bold text-slate-900">{opt.name}</h2>
                  <p className="text-sm font-medium text-slate-600 mt-1">{opt.tagline}</p>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{opt.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {opt.terms.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  href={opt.href}
                  className={`flex items-center justify-center gap-2 w-full text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm ${btnColors[opt.color]}`}
                >
                  {opt.cta} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-slate-50 border-y border-slate-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: 'Secure payments', sub: 'Stripe & Affirm encrypted' },
            { icon: Clock, label: 'Instant decisions', sub: 'Know in seconds with Affirm' },
            { icon: CheckCircle, label: 'No hidden fees', sub: 'What you see is what you pay' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="w-6 h-6 text-slate-400" />
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-slate-500 text-xs">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Common questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                {faq.q}
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-slate-900 text-white py-14 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-slate-400 mb-6 text-sm">Choose your program and select your payment option at checkout.</p>
        <Link
          href="/enrollment"
          className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
        >
          Browse Programs <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
