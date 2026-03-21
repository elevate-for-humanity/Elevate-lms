
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  ArrowRight,
  FileText,
  Users,
  Phone,
  AlertTriangle,
  Scale,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Audit Protection | Supersonic Fast Cash',
  description: 'Full audit representation and protection. If the IRS contacts you, we handle everything.',
  alternates: {
    canonical: 'https://www.supersonicfastermoney.com/services/audit-protection',
  },
};

const coverageIncludes = [
  {
    icon: Users,
    title: 'Full Representation',
    description: 'We represent you before the IRS so you never have to face them alone',
  },
  {
    icon: FileText,
    title: 'Document Preparation',
    description: 'We gather and organize all required documentation',
  },
  {
    icon: Phone,
    title: 'IRS Communication',
    description: 'We handle all correspondence and phone calls with the IRS',
  },
  {
    icon: Scale,
    title: 'Appeals Support',
    description: 'If needed, we support you through the appeals process',
  },
];

const whatsCovered = [
  'IRS correspondence audits',
  'In-person IRS audits',
  'State tax audits',
  'Identity theft resolution',
  'Notice responses',
  'Payment plan negotiations',
];

const faqs = [
  {
    question: 'What is audit protection?',
    answer: 'Audit protection is a service that provides professional representation if you are audited by the IRS or state tax authority. We handle all communication and documentation on your behalf.',
  },
  {
    question: 'How much does it cost?',
    answer: 'Audit protection is available for a small additional fee when you file your taxes with us. The exact cost depends on your tax situation.',
  },
  {
    question: 'What if I get audited without protection?',
    answer: 'If you filed with us but didn\'t purchase audit protection, we can still help. Contact us and we\'ll discuss your options for representation.',
  },
  {
    question: 'How long does coverage last?',
    answer: 'Your audit protection covers the tax year for which it was purchased, for as long as that return can be audited (typically 3 years from filing).',
  },
];

export default function AuditProtectionPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Audit Protection" }]} />
      </div>
{/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/supersonic-page-4.jpg" alt="Audit Protection" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Why You Need It */}
      <section className="py-16 bg-amber-50 border-y border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Did You Know?</h2>
              <p className="text-gray-700">
                The IRS audits over 1 million tax returns every year. Even honest mistakes can trigger an audit. 
                Without professional representation, you could end up paying more than you owe or facing penalties 
                that could have been avoided.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Includes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              What&apos;s Included
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive protection when you need it most
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coverageIncludes.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-brand-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-brand-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Covered */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                Types of Audits We Cover
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our audit protection covers a wide range of tax-related issues, giving you peace of mind no matter what comes your way.
              </p>
              <ul className="space-y-4">
                {whatsCovered.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center">
                <Shield className="w-20 h-20 text-brand-red-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Add Audit Protection
                </h3>
                <p className="text-gray-600 mb-6">
                  Protect yourself for just a small additional fee when you file with us.
                </p>
                <Link
                  href="/supersonic-fast-cash/apply"
                  className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-red-700 transition-colors w-full"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6">
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
            Don&apos;t Face the IRS Alone
          </h2>
          <p className="text-xl text-brand-red-100 mb-8">
            Add audit protection to your tax return and file with confidence.
          </p>
          <Link
            href="/supersonic-fast-cash/apply"
            className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-700 px-10 py-5 rounded-xl font-bold text-xl hover:bg-brand-red-50 transition-colors shadow-lg"
          >
            🛡️ Get Protected Today
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
