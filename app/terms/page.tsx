
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | Elevate For Humanity',
  description: 'Terms of Use governing access to and use of the Elevate For Humanity platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms of Use' }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-gray-500 mb-8">Version 1.0 | Effective: April 1, 2026</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              By accessing or using this website, you agree to these Terms of Use. If you do not
              agree, do not use this site.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Use of Site</h2>
            <p className="text-gray-700 mb-4">
              You agree to use this site only for lawful purposes and in a manner that does not
              interfere with the operation, security, or accessibility of the site or its users.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Programs and Services</h2>
            <p className="text-gray-700 mb-4">
              Program availability, eligibility, pricing, timelines, and outcomes may vary. Nothing
              on this site guarantees admission, certification, employment, funding, or licensing
              outcomes.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Payments</h2>
            <p className="text-gray-700 mb-4">
              If you make a purchase or submit a payment, you agree to provide accurate billing
              information and comply with any posted payment terms. All fees are stated at the time
              of transaction.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              Site content, branding, curriculum, graphics, and materials are protected by applicable
              law and may not be copied, reproduced, or reused without written permission from
              Elevate for Humanity.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              This site is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
              without warranties of any kind, except where required by law. We do not warrant that
              the site will be uninterrupted, error-free, or free of harmful components.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the extent permitted by law, Elevate for Humanity shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of this
              site or its services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms of Use at any time. Continued use of the site after changes
              are posted constitutes acceptance of the updated terms.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Contact</h2>
            <p className="text-gray-700 mb-4">
              Questions regarding these terms may be sent to{' '}
              <a href="mailto:info@elevateforhumanity.org" className="text-brand-green-600 hover:underline">
                info@elevateforhumanity.org
              </a>
              .
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                By using the Elevate For Humanity platform, you acknowledge that you have read and
                agree to these Terms of Use.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/legal/privacy" className="text-brand-green-600 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/legal/acceptable-use" className="text-brand-green-600 hover:underline">
                  Acceptable Use Policy
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
