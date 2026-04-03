
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal',
  },
  title: 'Legal | Elevate For Humanity',
  description:
    'Legal documents, agreements, and policies for Elevate For Humanity.',
};

export default function LegalPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal" }]} />
      </div>
{/* Hero Section */}
      <section className="bg-brand-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Legal</h1>
            <p className="text-lg text-white">
              Legal documents, agreements, and policies.
            </p>
          </div>
        </div>
      </section>

      {/* Legal Documents */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Legal Documents</h2>

            <div className="space-y-4">
              {/* Policies */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Policies & Terms
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href="/privacy-policy"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms-of-service"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Terms of Service
                  </Link>
                  <Link
                    href="/cookies"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Cookie Policy
                  </Link>
                  <Link
                    href="/refund-policy"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Refund Policy
                  </Link>
                </div>
              </div>

              {/* Agreements */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Agreements</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href="/legal/creator-agreement"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Creator Agreement
                  </Link>
                  <Link
                    href="/legal/marketplace-terms"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Marketplace Terms
                  </Link>
                  <Link
                    href="/legal/mou"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Memorandum of Understanding
                  </Link>
                  <Link
                    href="/legal/nda"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Non-Disclosure Agreement
                  </Link>
                  <Link
                    href="/legal/non-compete"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Non-Compete Agreement
                  </Link>
                </div>
              </div>

              {/* Compliance */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Compliance</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href="/accessibility"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Accessibility Statement
                  </Link>
                  <Link
                    href="/dmca"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    DMCA Policy
                  </Link>
                  <Link
                    href="/copyright"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Copyright Notice
                  </Link>
                  <Link
                    href="/compliance"
                    className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-brand-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Compliance Information
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Questions?</h2>
            <p className="text-gray-600 mb-6">
              If you have questions about our legal documents or policies,
              please contact us.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
