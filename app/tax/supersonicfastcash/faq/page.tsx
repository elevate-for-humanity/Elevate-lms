
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ - SupersonicFastCash | Elevate for Humanity',
  description:
    'Frequently asked questions about SupersonicFastCash tax preparation and refund advance services.',
  keywords: [
    'tax FAQ',
    'refund advance questions',
    'tax preparation FAQ',
    'SupersonicFastCash',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax/supersonicfastcash/faq',
  },
  openGraph: {
    title: 'FAQ - SupersonicFastCash',
    description:
      'Get answers to common questions about our tax services and refund advances.',
    url: 'https://www.elevateforhumanity.org/tax/supersonicfastcash/faq',
    type: 'website',
  },
};

export default function FAQPage() {

  const faqs = [
    {
      category: 'Refund Advances',
      questions: [
        {
          q: 'How much can I get with a tax refund advance?',
          a: 'Refund advances range from $250 to $7,500, depending on your expected refund. Loans of $250, $500, and $1,000 have 0% APR. Larger amounts (25%, 50%, or 75% of expected refund) have 36% APR.',
        },
        {
          q: 'Do I need good credit?',
          a: 'No credit check required! Refund advances are based on your expected IRS refund, not your credit score.',
        },
        {
          q: 'How fast can I get my money?',
          a: 'Most refund advances are approved and funded within 15-30 minutes of filing your return.',
        },
        {
          q: 'What if my actual refund is less than expected?',
          a: "You're only responsible for repaying the loan amount plus any applicable interest. The difference is deducted from your IRS refund.",
        },
      ],
    },
    {
      category: 'Tax Preparation',
      questions: [
        {
          q: 'How much does tax preparation cost?',
          a: 'Individual returns start at $89. Business returns start at $299. Pricing varies based on complexity. See our services page for details.',
        },
        {
          q: 'Can you prepare business taxes?',
          a: 'Yes! We handle Schedule C, partnerships, S-corps, and corporate returns. We also provide quarterly tax planning and bookkeeping services.',
        },
        {
          q: 'Do you offer same-day service?',
          a: 'Yes, same-day filing is available for most returns. Walk-ins welcome, or book an appointment online.',
        },
        {
          q: 'Can I upload my documents online?',
          a: 'Absolutely! Use our secure document upload portal to submit your tax documents from anywhere.',
        },
      ],
    },
    {
      category: 'Virtual Appointments',
      questions: [
        {
          q: 'How do virtual appointments work?',
          a: "We meet via Zoom video call. You upload your documents beforehand, and we prepare your return together in real-time. It's just like an in-person appointment.",
        },
        {
          q: 'Do I need special software?',
          a: "No! Zoom works in your web browser. We'll send you a link - just click and join.",
        },
        {
          q: 'Is it secure?',
          a: 'Yes. We use encrypted video calls and secure document sharing. Your information is protected with bank-level security.',
        },
      ],
    },
    {
      category: 'Sub-Office Program',
      questions: [
        {
          q: 'How do I become a sub-office owner?',
          a: 'Contact us to discuss the opportunity. We provide training, software, EPS Financial partnership, and ongoing support.',
        },
        {
          q: 'What training is included?',
          a: 'Complete tax preparation training, professional tax software training, business operations, and marketing support.',
        },
        {
          q: 'Do I need to be IRS-certified?',
          a: "Yes, you'll need to complete IRS certification. We provide the training course and exam preparation.",
        },
        {
          q: 'Can I offer refund advances?',
          a: "Yes! As a sub-office, you'll have access to EPS Financial's refund advance program.",
        },
      ],
    },
    {
      category: 'General',
      questions: [
        {
          q: "What's the difference between SupersonicFastCash and Rise Up Foundation?",
          a: 'Rise Up Foundation offers FREE VITA tax help for qualifying individuals (income under $64,000). SupersonicFastCash is our paid service with no income restrictions, refund advances, and business tax services.',
        },
        {
          q: 'Do you prepare state returns?',
          a: 'Yes, we prepare both federal and state returns for all 50 states.',
        },
        {
          q: 'What if I get audited?',
          a: "Audit support is included with all returns. We'll help you respond to IRS inquiries and provide documentation.",
        },
        {
          q: "Can you amend a previous year's return?",
          a: 'Yes, we handle amended returns (Form 1040-X) for the current and prior 3 years.',
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Faq" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax"
          aria-label="Link"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Tax Services
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
      <p className="text-lg text-black mb-8">
        Common questions about SupersonicFastCash tax preparation and refund
        advance services.
      </p>

      <div className="space-y-8">
        {faqs.map((category, idx) => (
          <section key={idx} className="rounded-2xl border p-8">
            <h2 className="text-2xl font-bold mb-6 text-brand-blue-600">
              {category.category}
            </h2>
            <div className="space-y-6">
              {category.questions.map((faq, qIdx) => (
                <div key={qIdx}>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-black leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-brand-blue-50 border-l-4 border-brand-blue-600 p-6">
        <h2 className="text-xl font-bold mb-3">Still Have Questions?</h2>
        <p className="text-black mb-6">
          Can't find the answer you're looking for? We're here to help.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition"
          >
            Call support center
          </a>
          <a
            href="/contact"
            className="px-6 py-3 rounded-lg border-2 border-brand-blue-600 text-brand-blue-600 font-semibold hover:bg-white transition"
          >
            Email Us
          </a>
          <Link
            href="/tax/book-appointment"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-white transition"
          >
            Book Appointment
          </Link>
        </div>
      </section>

      <section className="mt-8 text-center">
        <p className="text-black mb-4">Ready to get started?</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/tax/supersonicfastcash/documents"
            className="px-6 py-3 rounded-lg bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition"
          >
            Upload Documents
          </Link>
          <Link
            href="/supersonic-fast-cash"
            className="px-6 py-3 rounded-lg border-2 border-brand-blue-600 text-brand-blue-600 font-semibold hover:bg-white transition"
          >
            View Services & Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
