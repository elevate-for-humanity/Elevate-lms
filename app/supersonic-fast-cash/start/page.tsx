import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  FileText, 
  Upload, 
  Calendar,
  Phone,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Start Your Tax Return | Supersonic Fast Cash LLC',
  description: 'Begin your tax preparation. Choose how you want to file - online, in-person, or with document upload.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/start',
  },
};

const filingOptions = [
  {
    title: 'File Online (DIY)',
    description: 'Answer guided questions and file from home. Best for simple returns.',
    icon: FileText,
    href: '/supersonic-fast-cash/diy-taxes',
    cta: 'Start Online Filing',
    features: ['W-2 income', 'Standard deductions', 'File at your pace'],
  },
  {
    title: 'Upload Documents',
    description: 'Send us your tax documents and we\'ll prepare your return.',
    icon: Upload,
    href: '/supersonic-fast-cash/upload-documents',
    cta: 'Upload Documents',
    features: ['We handle preparation', 'Review before filing', 'Email updates'],
  },
  {
    title: 'Schedule Appointment',
    description: 'Meet with a tax preparer in person or virtually.',
    icon: Calendar,
    href: '/supersonic-fast-cash/book-appointment',
    cta: 'Book Appointment',
    features: ['One-on-one help', 'Complex returns', 'Same-day options'],
  },
];

export default function StartPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Start" }]} />
      </div>
{/* Hero */}
      <section className="bg-brand-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Let's Get Your Taxes Filed
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to file. We're here to help every step of the way.
          </p>
        </div>
      </section>

      {/* Filing Options */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {filingOptions.map((option) => (
              <div 
                key={option.title}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                  <option.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {option.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {option.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={option.href}
                  className="block w-full text-center py-3 px-4 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
                >
                  {option.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call Option */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Phone className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Prefer to Talk?
            </h2>
            <p className="text-gray-600 mb-6">
              Contact us to discuss your tax situation or get help choosing the right option.
            </p>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            What to Expect
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Before You Start</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Gather your W-2s and 1099s</li>
                <li>• Have Social Security numbers ready</li>
                <li>• Know your bank account info for direct deposit</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">After Filing</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Receive confirmation within 24-48 hours</li>
                <li>• Track your refund status online</li>
                <li>• Download your return for your records</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Link */}
      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Questions about pricing?
          </h2>
          <p className="text-brand-blue-200 mb-8">
            See our transparent pricing before you start.
          </p>
          <Link
            href="/supersonic-fast-cash/pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Pricing
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
