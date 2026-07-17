'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';

const FAQS = [
  {
    q: 'What happens during the 14-day trial?',
    a: 'You get a fully functional instance with your own subdomain and admin dashboard. Import your programs, enroll test learners, run reports. Everything works. No credit card required. At the end of 14 days, choose a plan to keep your data and go live — or walk away.',
  },
  {
    q: 'What payment methods do you accept?',
    a: `Stripe (all major credit/debit cards) and BNPL providers (${BNPL_PROVIDER_NAMES}). All payment options are available at checkout — no invoices, no purchase orders, no waiting.`,
  },
  {
    q: 'What does the setup fee cover?',
    a: 'Onboarding configuration: your branding, domain setup, program structure, user roles, and initial data migration if needed. This is a one-time fee. Growth plan: $5,000. Professional plan: $7,500.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Managed platform licenses are month-to-month after the initial term. Cancel anytime — your data is exported and retained for 30 days. No cancellation fees.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'You get a full data export (CSV + JSON) before your account is deactivated. Data is retained on our servers for 30 days after cancellation, then permanently deleted. You own your data.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'Most organizations are live within two weeks. Week 1: branding, domain, program setup. Week 2: user training, test enrollments, go-live. Complex migrations (existing student data, multiple programs) may take 3-4 weeks.',
  },
  {
    q: 'Do I need technical staff to run this?',
    a: 'No. The platform is fully managed — we handle hosting, security, updates, and backups. Your staff uses the admin dashboard to manage programs, students, and reports. If something breaks, we fix it.',
  },
  {
    q: 'Is this WIOA compliant?',
    a: 'Yes. The platform includes WIOA eligibility determination, ITA tracking, PIRL reporting, and quarterly performance metrics. It also supports FERPA student data privacy, DOL registered apprenticeship standards, and automated grant reporting.',
  },
  {
    q: 'What\'s the difference between Managed and Enterprise?',
    a: 'Managed: we host and operate the platform for you. You get your own branded instance on our infrastructure. Enterprise Source-Use: you get the full source code and deploy on your own servers. Enterprise is for state agencies or large networks that require on-premise deployment for compliance reasons.',
  },
  {
    q: 'Can I use BNPL to pay over time?',
    a: `Yes. At checkout, select your preferred BNPL provider (${BNPL_PROVIDER_NAMES}). Options include 3–36 month financing and interest-free installment plans. Available for all license tiers.`,
  },
];

export default function StoreFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-14 sm:py-20 border-y border-slate-200">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-semibold text-slate-900 text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
