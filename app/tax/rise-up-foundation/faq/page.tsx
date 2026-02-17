import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VITA FAQ - Common Questions | Rise Up Foundation',
  description:
    'Frequently asked questions about free VITA tax preparation services. Get answers about eligibility, appointments, and more.',
  keywords: [
    'VITA FAQ',
    'free tax help questions',
    'VITA eligibility',
    'tax preparation questions',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax/rise-up-foundation/faq',
  },
  openGraph: {
    title: 'VITA FAQ - Common Questions',
    description:
      'Get answers to common questions about free VITA tax services.',
    url: 'https://www.elevateforhumanity.org/tax/rise-up-foundation/faq',
    type: 'website',
  },
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'Who qualifies for free VITA tax help?',
      answer:
        'Generally, individuals and families earning $64,000 or less per year qualify. Persons with disabilities and limited English-speaking taxpayers also qualify regardless of income.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'VITA services are Funded. There are no fees, no hidden charges, and no upsells. Everything from tax preparation to e-filing is provided at no cost.',
    },
    {
      question: 'Do I need an appointment?',
      answer:
        'Yes, appointments are required. Call support center to schedule. Walk-ins may experience very long wait times or may not be seen.',
    },
    {
      question: 'What documents do I need to bring?',
      answer:
        "You'll need photo ID, Social Security cards for everyone on the return, all W-2s and 1099s, bank account information for direct deposit, and last year's tax return if available.",
    },
    {
      question: 'How long does it take?',
      answer:
        'Most appointments take 45-90 minutes depending on the complexity of your return. Simple returns may be faster, while returns with multiple income sources or deductions may take longer.',
    },
    {
      question: 'Can you help with business taxes?',
      answer:
        'VITA focuses on individual tax returns. We can handle simple self-employment income (Schedule C), but complex business returns should be prepared by a paid professional.',
    },
    {
      question: 'When will I get my refund?',
      answer:
        'If you choose direct deposit, most refunds arrive within 21 days of e-filing. Paper checks take 4-6 weeks. The IRS provides a refund tracker at IRS.gov/refunds.',
    },
    {
      question: 'Can I get a refund advance?',
      answer:
        'No, VITA does not offer refund advances. If you need immediate cash, consider our paid service SupersonicFastCash which offers refund advances up to $7,500.',
    },
    {
      question: 'What if I owe taxes?',
      answer:
        "We can still prepare your return for free. We'll help you understand your payment options and set up a payment plan with the IRS if needed.",
    },
    {
      question: "Can you amend a previous year's return?",
      answer:
        'Yes, we can help with amended returns (Form 1040-X) for the current and prior three years, subject to volunteer availability.',
    },
    {
      question: 'Do you prepare state returns?',
      answer:
        'Yes, we prepare both federal and Indiana state returns at no charge.',
    },
    {
      question: "What if I'm missing a W-2 or 1099?",
      answer:
        "Contact your employer or payer first. If you can't get it, the IRS can provide a wage and income transcript. Contact us for guidance.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Faq" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax/rise-up-foundation"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Rise Up Foundation
        </Link>
      </div>

      <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
      <p className="mt-3 text-lg text-black">
        Common questions about free VITA tax preparation services.
      </p>

      <section className="mt-8 space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-black mb-2">
              {faq.question}
            </h2>
            <p className="text-black">{faq.answer}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-brand-green-50 border-l-4 border-brand-green-600 p-6">
        <h2 className="text-xl font-bold mb-3">Still Have Questions?</h2>
        <p className="text-black mb-6">
          Can't find the answer you're looking for? Give us a call and we'll be
          happy to help.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-brand-green-700 transition"
          >
            Call support center
          </a>
          <a
            href="mailto:info@elevateforhumanity.org"
            className="px-6 py-3 rounded-lg border-2 border-brand-green-600 text-brand-green-600 font-semibold hover:bg-brand-green-50 transition"
          >
            Email Us
          </a>
          <Link
            href="/tax/rise-up-foundation/free-tax-help"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            Schedule Appointment
          </Link>
        </div>
      </section>
    </div>
  );
}
