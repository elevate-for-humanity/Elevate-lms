'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';

const FAQS = [
  {
    q: 'What happens during the organization trial?',
    a: 'The trial is intended for evaluation of the organization workspace and supported platform features. Access, provisioning, retained data, and the features available during a trial are controlled by the current trial configuration and agreement; the trial should not be described as a production deployment until its provisioning and acceptance checks pass.',
  },
  {
    q: 'What payment methods are supported?',
    a: `Card payments are processed through the configured checkout provider. Where offered, BNPL options may include ${BNPL_PROVIDER_NAMES}. Availability, approval, term length, interest, and limits are determined by the payment provider and the current checkout configuration.`,
  },
  {
    q: 'What does implementation cover?',
    a: 'Implementation scope is defined in the applicable order or agreement. It may include branding, domain configuration, program setup, roles, integrations, data migration, testing, and staff onboarding. Public marketing copy does not override the signed scope, price, or acceptance criteria.',
  },
  {
    q: 'Can I cancel?',
    a: 'Cancellation rights, minimum terms, notice periods, fees, data export, and retention are governed by the active agreement for the purchased service. Review the agreement before purchase rather than relying on a generic cancellation promise.',
  },
  {
    q: 'What happens to organization data after termination?',
    a: 'Export, retention, deletion, legal-hold, and backup treatment must follow the active agreement and published data-retention controls. A specific retention period is not promised here unless it is defined for the purchased service.',
  },
  {
    q: 'How long does implementation take?',
    a: 'Implementation time depends on data quality, number of programs, domains, integrations, role configuration, security requirements, migration scope, and acceptance testing. A delivery date is established in the implementation plan rather than guaranteed by a generic website estimate.',
  },
  {
    q: 'Do I need technical staff?',
    a: 'Managed deployments are designed to reduce the customer\'s infrastructure burden, but the organization still needs designated owners for program configuration, data governance, user access, acceptance testing, and operational decisions. Support responsibilities are defined in the purchased service agreement.',
  },
  {
    q: 'Does the platform support WIOA and workforce reporting?',
    a: 'The production data model includes participant, service, PIRL mapping/export, performance, document, regulatory-evidence, and report-run infrastructure. Those capabilities support workforce reporting workflows, but platform functionality by itself does not establish legal or program compliance with WIOA and does not determine participant eligibility, funding authorization, or reporting accuracy.',
  },
  {
    q: 'What is the difference between managed and source-use licensing?',
    a: 'Managed licensing uses Elevate-operated infrastructure and support according to the purchased service. A source-use arrangement, when offered, is governed by a separate license defining deployment, modification, updates, support, security responsibilities, and permitted use. The signed license controls.',
  },
  {
    q: 'Can BNPL be used to pay over time?',
    a: `Where the checkout presents a BNPL option such as ${BNPL_PROVIDER_NAMES}, the provider determines eligibility, available terms, interest or fees, and approval. BNPL is not guaranteed for every purchase or license tier.`,
  },
];

export default function StoreFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-y border-slate-200 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, index) => (
            <div key={faq.q} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <span className="pr-4 text-sm font-semibold text-slate-900">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${open === index ? 'rotate-180' : ''}`} />
              </button>
              {open === index && <div className="px-5 pb-4"><p className="text-sm leading-relaxed text-slate-600">{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
