import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  FileText, 
  Shield, 
  DollarSign, 
  Lock,
  Users,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How We Operate | Supersonic Fast Cash LLC',
  description: 'Transparency about our tax preparation services, data protection, and how we operate.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/transparency',
  },
};

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Transparency" }]} />
      </div>
{/* Hero */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            How Supersonic Fast Cash Operates
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Clear information about our services, processes, and commitments.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section 1 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">What We Provide</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Supersonic Fast Cash LLC provides professional tax preparation services through 
              a guided, secure filing platform. Our primary service is helping individuals 
              prepare and file their tax returns accurately and efficiently.
            </p>
            <p className="text-gray-700">
              After completing a tax return, eligible filers may choose to access an optional 
              refund-based cash advance. This option is not required to file a return.
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">How the Tax Filing Process Works</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">1.</span>
                Users complete a guided tax preparation flow
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">2.</span>
                Returns are reviewed before submission
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">3.</span>
                Federal (and applicable state) returns are electronically filed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">4.</span>
                Filers can track refund status after filing
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Our platform is designed to prioritize clarity, accuracy, and user choice 
              throughout the process.
            </p>
          </div>

          {/* Section 3 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Refund-Based Cash Advance (Optional)</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Some filers may be eligible to receive a portion of their expected tax refund 
              before the IRS issues the full refund.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">Key points:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• The advance is optional</li>
                <li>• Eligibility is determined after a return is completed</li>
                <li>• Any advance is repaid directly from the tax refund</li>
                <li>• Filing does not require selecting an advance</li>
              </ul>
            </div>
            <p className="text-gray-600 text-sm">
              Availability, amounts, and timing vary by individual return.
            </p>
          </div>

          {/* Section 4 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Data Protection & Privacy</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We use industry-standard safeguards to protect personal and tax information.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">This includes:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Encrypted data transmission</li>
                <li>• Secure storage practices</li>
                <li>• Restricted internal access</li>
                <li>• No sale of personal tax data</li>
              </ul>
            </div>
            <p className="text-gray-700">
              Our systems are designed to align with IRS privacy and data handling expectations.
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Payments & Transparency</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Tax preparation fees are clearly disclosed before filing.
            </p>
            <p className="text-gray-700 mb-4">
              Refund advance availability does not affect tax preparation pricing.
            </p>
            <p className="text-gray-700">
              Users maintain control over all optional services.
            </p>
          </div>

          {/* Section 6 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Support & Accountability</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Users can access support resources throughout the filing process.
            </p>
            <p className="text-gray-700">
              We aim to provide clear explanations, timely responses, and straightforward communication.
            </p>
          </div>

          {/* Links */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="font-medium text-gray-900 mb-4">Learn More</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link 
                href="/supersonic-fast-cash/legal/privacy"
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">Privacy Policy</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link 
                href="/supersonic-fast-cash/legal/terms"
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">Terms of Service</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link 
                href="/supersonic-fast-cash/support"
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">Support Center</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link 
                href="/supersonic-fast-cash/cash-advance"
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">About Refund Advances</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to file?
          </h2>
          <p className="text-gray-600 mb-8">
            Start your tax return with a platform built on clarity and trust.
          </p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Start Tax Preparation
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
