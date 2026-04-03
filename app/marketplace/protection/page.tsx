import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import {
  ChevronRight,
  Shield,
  RefreshCw,
  CreditCard,
  Lock,
  MessageCircle,
  HelpCircle,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Buyer Protection | Marketplace',
  description: 'Learn about our marketplace buyer protection policies.',
};

export default function BuyerProtectionPage() {
  const protections = [
    {
      icon: RefreshCw,
      title: '30-Day Money-Back Guarantee',
      description: 'Not satisfied with your purchase? Get a full refund within 30 days, no questions asked.',
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'All courses and resources are reviewed by our team to ensure they meet quality standards.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Your payment information is encrypted and processed through secure payment providers.',
    },
    {
      icon: Lock,
      title: 'Lifetime Access',
      description: 'Once you purchase a course, you have lifetime access to the content and updates.',
    },
    {
      icon: MessageCircle,
      title: 'Direct Support',
      description: 'Get help from sellers directly through our messaging system.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Sellers',
      description: 'All sellers are verified professionals with proven expertise in their field.',
    },
  ];

  const faqs = [
    {
      question: 'How do I request a refund?',
      answer: 'You can request a refund within 30 days of purchase by going to your order history and clicking "Request Refund" on the item. Our team will process your request within 3-5 business days.',
    },
    {
      question: 'What if the content is not as described?',
      answer: 'If you believe the content does not match the description, contact our support team. We will investigate and either work with the seller to resolve the issue or provide a full refund.',
    },
    {
      question: 'Are my payment details safe?',
      answer: 'Yes, we use industry-standard encryption and never store your full payment details. All transactions are processed through PCI-compliant payment providers.',
    },
    {
      question: 'What happens if a seller becomes unavailable?',
      answer: 'You will always have access to content you have purchased. If a seller leaves the platform, their content remains available to existing purchasers.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Protection" }]} />
      </div>
<div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/marketplace" className="hover:text-gray-700">Marketplace</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Buyer Protection</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Protection</h1>
          <p className="text-gray-600 mt-1">Shop with confidence on our marketplace</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center mb-12">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Your Purchase is Protected</h2>
          <p className="text-white max-w-xl mx-auto">
            We stand behind every purchase on our marketplace with comprehensive buyer protection.
          </p>
        </div>

        {/* Protection Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {protections.map((protection, index) => {
            const Icon = protection.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-brand-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{protection.title}</h3>
                <p className="text-sm text-gray-600">{protection.description}</p>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How Buyer Protection Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-brand-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Make a Purchase</h3>
              <p className="text-sm text-gray-600">
                Buy any course or resource from our verified sellers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-brand-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Access Content</h3>
              <p className="text-sm text-gray-600">
                Get immediate access to your purchased content.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-brand-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Protected for 30 Days</h3>
              <p className="text-sm text-gray-600">
                Request a refund anytime within 30 days if not satisfied.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-white">
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Have questions about buyer protection?</p>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
