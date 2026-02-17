import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Terms of Service | Supersonic Fast Cash',
  description: 'Terms of service for Supersonic Fast Cash tax preparation services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/legal/terms',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Terms" }]} />
      </div>
<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By using the services of Supersonic Fast Cash, a trade name of 2Exclusive LLC-S (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree 
              to these Terms of Service. If you do not agree, do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Services Provided</h2>
            <p className="text-gray-700 mb-4">
              We provide tax preparation services, including preparation and electronic filing 
              of federal and state tax returns. We may also offer optional refund advance services 
              through third-party banking partners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Tax Preparation Services</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for providing accurate and complete information for your tax return. 
              We prepare your return based on the information you provide. You are responsible for 
              reviewing your return before filing and for the accuracy of the information submitted to the IRS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Refund Advance (Optional)</h2>
            <p className="text-gray-700 mb-4">
              Refund advances are optional and provided by third-party banking partners. 
              Key terms:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Advances are not required to use our tax preparation services</li>
              <li>Eligibility is determined by the banking partner, not by us</li>
              <li>Advances are repaid from your tax refund</li>
              <li>Fees and terms are disclosed before you accept an advance</li>
              <li>This is not a loan; it is an advance against your expected refund</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Fees and Payment</h2>
            <p className="text-gray-700 mb-4">
              Tax preparation fees are disclosed before you file. You may pay at the time of 
              filing or choose to have fees deducted from your refund (additional fee may apply). 
              Refund advance fees, if applicable, are separate and disclosed by the banking partner.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. No Guarantees</h2>
            <p className="text-gray-700 mb-4">
              We do not guarantee:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>A specific refund amount (the IRS determines your refund)</li>
              <li>Refund timing (the IRS controls processing times)</li>
              <li>Approval for a refund advance (the bank determines eligibility)</li>
              <li>That your return will not be audited</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Responsibilities</h2>
            <p className="text-gray-700 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Review your return before authorizing filing</li>
              <li>Respond to IRS or state tax authority inquiries</li>
              <li>Pay all applicable fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, our liability is limited to the fees 
              you paid for our services. We are not liable for IRS penalties, interest, or 
              adjustments resulting from information you provided or failed to provide.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Any disputes arising from these terms or our services will be resolved through 
              binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms of Service from time to time. Continued use of our 
              services after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
            <p className="text-gray-700">
              2Exclusive LLC-S (d/b/a Supersonic Fast Cash)<br />
              Email: legal@supersonicfastcash.com<br />
              Phone: Get Help Online
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
