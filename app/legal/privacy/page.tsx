
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Elevate For Humanity',
  description: 'Privacy Policy describing how Elevate For Humanity collects, uses, and protects personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Privacy Policy' }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Version 1.0 | Effective: April 1, 2026</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Elevate for Humanity collects information you provide when you use our website, submit
              applications, request information, enroll in programs, or contact us.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Name, email address, phone number, and mailing address</li>
              <li>Program interest and application details</li>
              <li>Payment and transaction records, when applicable</li>
              <li>Technical information such as IP address, browser type, and device information</li>
              <li>Attendance, progress, and assessment records for enrolled learners</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Information</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>To respond to inquiries and process applications</li>
              <li>To deliver training, program administration, and learner support</li>
              <li>To process payments and maintain records</li>
              <li>To improve site performance, security, and user experience</li>
              <li>To comply with legal, regulatory, or reporting obligations</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell personal information. We may share information with service providers,
              payment processors, learning technology vendors, and government or program partners when
              required to operate services, fulfill program requirements, or comply with law.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We use reasonable administrative, technical, and physical safeguards to protect personal
              information. No method of transmission or storage is completely secure.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Your Choices</h2>
            <p className="text-gray-700 mb-4">
              You may contact us to update your information, ask questions about our practices, or
              request assistance regarding your data.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Contact</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions, contact:{' '}
              <a href="mailto:info@elevateforhumanity.org" className="text-brand-green-600 hover:underline">
                info@elevateforhumanity.org
              </a>
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                By using the Elevate For Humanity platform, you acknowledge that you have read and
                understood this Privacy Policy.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/legal/acceptable-use" className="text-brand-green-600 hover:underline">
                  Acceptable Use Policy
                </Link>
                <Link href="/terms" className="text-brand-green-600 hover:underline">
                  Terms of Use
                </Link>
                <Link href="/legal/disclosures" className="text-brand-green-600 hover:underline">
                  Disclosures
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
