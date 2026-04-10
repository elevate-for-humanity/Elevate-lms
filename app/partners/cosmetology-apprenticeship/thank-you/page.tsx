import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowRight, Phone, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Received | Salon Partner | Elevate for Humanity',
  description: 'Thank you for applying to become a host salon for the Indiana Cosmetology Apprenticeship program.',
  robots: { index: false, follow: false },
};

export default function CosmetologyThankYouPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Thank You' }]} />
      </div>

      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-purple-600 text-3xl font-bold">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Received!</h1>
          <p className="text-lg text-black mb-8">
            Thank you for applying to become a host salon for the Indiana Cosmetology
            Apprenticeship program. We&apos;ve received your application and will be in touch soon.
          </p>

          <div className="bg-white p-8 rounded-xl shadow-sm border text-left mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next</h2>
            <div className="space-y-4">
              {[
                { n: '1', title: 'Verification (1–3 business days)', desc: "We'll verify your salon license and supervisor credentials with the Indiana Professional Licensing Agency (IPLA)." },
                { n: '2', title: 'MOU Review & Signing', desc: "We'll send you the official MOU for review and electronic signature." },
                { n: '3', title: 'Site Approval', desc: 'Once verified and MOU signed, your salon becomes an approved worksite.' },
                { n: '4', title: 'Apprentice Matching', desc: "We'll work with you to match qualified apprentice candidates to your salon." },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">{item.n}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-black text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-8 rounded-xl mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Your Site Visit</h3>
            <p className="text-black mb-4">
              Ready to move forward? Book your 15-minute Zoom site visit now. We&apos;ll walk through
              your salon and answer any questions.
            </p>
            <a
              href="https://calendly.com/elevate4humanityedu/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors"
            >
              Schedule Site Visit <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>

          <div className="bg-brand-blue-50 p-6 rounded-xl mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              <span className="font-semibold text-gray-900">Confirmation Email Sent</span>
            </div>
            <p className="text-black text-sm">
              Check your inbox for a confirmation email with your application details and program info.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Questions?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 text-gray-700 hover:text-brand-blue-600">
                <Phone className="w-4 h-4" /> (317) 314-3757
              </a>
              <a href="/contact" className="inline-flex items-center justify-center gap-2 text-gray-700 hover:text-brand-blue-600">
                <Mail className="w-4 h-4" /> Contact Us
              </a>
            </div>
          </div>

          <Link
            href="/partners/cosmetology-apprenticeship"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Back to Partner Info <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
