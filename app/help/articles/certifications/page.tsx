import { Metadata } from 'next';
import Link from 'next/link';
import { Award, FileText, Download } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Certifications Help | Elevate For Humanity',
  description: 'Learn about certifications, how to earn them, and how to access your certificates.',
};

export default function CertificationsHelpPage() {
  const faqs = [
    {
      question: 'How do I earn a certification?',
      answer: 'Complete all required coursework and pass the final assessment with a score of 80% or higher. Your certificate will be automatically generated upon successful completion.',
    },
    {
      question: 'Where can I find my certificates?',
      answer: 'All your earned certificates are available in your student dashboard under the "Certificates" section. You can view, download, and share them from there.',
    },
    {
      question: 'Are the certifications accredited?',
      answer: 'Our certifications are industry-recognized and aligned with national standards. Many are approved by state workforce agencies and eligible for WIOA funding.',
    },
    {
      question: 'Can I verify my certificate?',
      answer: 'Yes! Each certificate has a unique verification code. Employers can verify your credentials at our verification portal.',
    },
    {
      question: 'How long are certifications valid?',
      answer: 'Most certifications do not expire. However, some industry certifications may require renewal or continuing education. Check your specific program requirements.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Breadcrumbs
        items={[
          { label: 'Help', href: '/help' },
          { label: 'Articles', href: '/help/articles' },
          { label: 'Certifications' },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4">

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-10 h-10 text-brand-blue-600" />
            <h1 className="text-3xl font-bold">Certifications</h1>
          </div>
          
          <p className="text-gray-600 text-lg mb-8">
            Everything you need to know about earning, accessing, and verifying your certifications.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-brand-blue-50 rounded-lg p-6">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <h3 className="font-semibold mb-2">Earn Certificates</h3>
              <p className="text-sm text-gray-600">Complete courses and pass assessments to earn industry-recognized credentials.</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <FileText className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Access Anytime</h3>
              <p className="text-sm text-gray-600">View and download your certificates from your dashboard 24/7.</p>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-6">
              <Download className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Share & Verify</h3>
              <p className="text-sm text-gray-600">Share certificates with employers who can verify them online.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
