import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  CreditCard,
  Zap,
  BadgeCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund Advance | Supersonic Fast Cash',
  description: 'Get up to $7,500 same day with 0% interest. No credit check required. Walk out with cash today.',
  alternates: {
    canonical: 'https://www.supersonicfastermoney.com/services/refund-advance',
  },
};

const benefits = [
  {
    icon: DollarSign,
    title: 'Up to $7,500',
    description: 'Get a substantial advance on your expected refund',
  },
  {
    icon: Clock,
    title: 'Same Day Cash',
    description: 'Walk out with money in your pocket today',
  },
  {
    icon: Shield,
    title: '0% Interest',
    description: 'No interest charges, no hidden fees',
  },
  {
    icon: BadgeCheck,
    title: 'No Credit Check',
    description: 'Your credit score is not affected',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Bring Your Documents',
    description: 'W-2s, ID, and Social Security card',
  },
  {
    step: 2,
    title: 'We Prepare Your Return',
    description: 'Our PTIN-credentialed pros handle everything',
  },
  {
    step: 3,
    title: 'Get Approved',
    description: 'Approval in as little as 15 minutes',
  },
  {
    step: 4,
    title: 'Get Your Cash',
    description: 'Walk out with your advance today',
  },
];

const faqs = [
  {
    question: 'How much can I get?',
    answer: 'You can receive up to $7,500 depending on your expected refund amount. The advance is based on your anticipated tax refund.',
  },
  {
    question: 'Is there really no interest?',
    answer: 'Yes! Our refund advance loans are 0% APR with no interest charges. You only repay the amount you borrowed when your refund arrives.',
  },
  {
    question: 'What do I need to bring?',
    answer: 'Bring your W-2s or other income documents, a valid photo ID, your Social Security card, and bank account information for direct deposit.',
  },
  {
    question: 'How long does it take?',
    answer: 'Most customers are approved and receive their advance within 1-2 hours of completing their tax return.',
  },
  {
    question: 'Will this affect my credit?',
    answer: 'No. We do not perform a credit check, and this advance will not appear on your credit report.',
  },
];

export default function RefundAdvancePage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Refund Advance" }]} />
      </div>
{/* Hero */}
      <section className="relative bg-slate-700 text-white py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Same Day Cash Available
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Get Up to $7,500
              <span className="block text-green-300">Today</span>
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Don&apos;t wait weeks for your refund. Get a 0% interest advance on your tax refund and walk out with cash in your pocket.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/supersonic-fast-cash/apply"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors"
              >
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/supersonic-fast-cash/locations"
                className="inline-flex items-center justify-center gap-2 bg-green-500/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-500/40 transition-colors border border-white/30"
              >
                Find a Location
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get your money in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advance Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Advance Amounts
            </h2>
            <p className="text-xl text-gray-600">
              Based on your expected refund
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center border-2 border-gray-100">
              <div className="text-4xl font-black text-gray-900 mb-2">$500</div>
              <div className="text-gray-600 mb-4">Minimum Advance</div>
              <div className="text-sm text-gray-500">Expected refund: $1,000+</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center border-2 border-green-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <div className="text-4xl font-black text-green-600 mb-2">$3,500</div>
              <div className="text-gray-600 mb-4">Average Advance</div>
              <div className="text-sm text-gray-500">Expected refund: $5,000+</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center border-2 border-gray-100">
              <div className="text-4xl font-black text-gray-900 mb-2">$7,500</div>
              <div className="text-gray-600 mb-4">Maximum Advance</div>
              <div className="text-sm text-gray-500">Expected refund: $10,000+</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready to Get Your Money?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Apply now and walk out with up to $7,500 today.
          </p>
          <Link
            href="/supersonic-fast-cash/apply"
            className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-10 py-5 rounded-xl font-bold text-xl hover:bg-green-50 transition-colors shadow-lg"
          >
            💵 Apply Now
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
