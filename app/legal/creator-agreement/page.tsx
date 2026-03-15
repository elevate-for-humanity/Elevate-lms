
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Legal Creator Agreement | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

export default function CreatorAgreementPage() {

  return (
    <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Creator Agreement" }]} />
      </div>
<div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2">Creator Agreement</h1>
        <p className="text-black mb-8">Last Updated: December 13, 2024</p>

        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Agreement to Terms</h2>
            <p>
              By applying to become a creator on the Elevate for Humanity
              marketplace ("Platform"), you agree to be bound by this Creator
              Agreement. This agreement governs your relationship with Elevate
              for Humanity ("Platform Owner," "we," "us") as a seller of digital
              products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Creator Eligibility</h2>
            <p>To become a creator, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 18 years old</li>
              <li>Have legal capacity to enter into contracts</li>
              <li>Own all rights to content you upload</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Provide accurate payout information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Content Ownership</h2>
            <p>You represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You own or have the necessary rights to all content you upload
              </li>
              <li>
                Your content does not infringe on any third-party intellectual
                property rights
              </li>
              <li>
                You have obtained all necessary permissions, licenses, and
                releases
              </li>
              <li>Your content does not violate any laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Revenue Split</h2>
            <p>
              The default revenue split is <strong>70% to Creator</strong> and{' '}
              <strong>30% to Platform</strong>. This split:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Applies to all sales of your products</li>
              <li>Is calculated on the gross sale amount</li>
              <li>May be adjusted by Platform Owner on a case-by-case basis</li>
              <li>Covers platform hosting, payment processing, and support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Payout Terms</h2>
            <p>Payouts are processed as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Schedule:</strong> Monthly, on or around the 15th of
                each month
              </li>
              <li>
                <strong>Minimum:</strong> $50 USD minimum balance required for
                payout
              </li>
              <li>
                <strong>Methods:</strong> ACH, PayPal, Zelle, or Stripe Connect
                (when available)
              </li>
              <li>
                <strong>Timing:</strong> Payouts may take 3-7 business days to
                process
              </li>
              <li>
                <strong>Fees:</strong> You are responsible for any fees charged
                by your payout method
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Product Guidelines</h2>
            <p>All products must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be digital products only (no physical goods)</li>
              <li>Be accurately described and priced</li>
              <li>Be delivered immediately upon purchase</li>
              <li>Not contain malware, viruses, or harmful code</li>
              <li>Not violate any laws or third-party rights</li>
              <li>Not contain adult, illegal, or restricted content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Approval Process</h2>
            <p>
              All creator applications and products are subject to approval by
              Platform Owner. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Approve or reject any creator application</li>
              <li>Approve or reject any product submission</li>
              <li>Request modifications before approval</li>
              <li>Remove approved products at any time</li>
              <li>Suspend or terminate creator accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Refund Handling</h2>
            <p>When a refund is issued:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The full sale amount is refunded to the buyer</li>
              <li>Your creator earnings for that sale are deducted</li>
              <li>
                If already paid out, the amount may be deducted from future
                earnings
              </li>
              <li>Platform Owner handles all refund requests and decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">9. License Grant</h2>
            <p>
              You grant Platform Owner a non-exclusive, worldwide, royalty-free
              license to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Display and market your products on the Platform</li>
              <li>Process payments and deliver products to buyers</li>
              <li>Use your creator name and bio for promotional purposes</li>
              <li>Create thumbnails and previews of your content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              10. Prohibited Activities
            </h2>
            <p>You may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload content you don't own or have rights to</li>
              <li>Manipulate pricing or sales data</li>
              <li>Create multiple accounts to circumvent rules</li>
              <li>Engage in fraudulent or deceptive practices</li>
              <li>Spam or harass buyers or other creators</li>
              <li>Attempt to bypass the Platform's payment system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">11. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon
              termination:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your products will be removed from the marketplace</li>
              <li>Pending earnings will be paid out (if above minimum)</li>
              <li>You must cease using Platform branding and materials</li>
              <li>Buyers retain access to previously purchased products</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              12. Limitation of Liability
            </h2>
            <p>
              Platform Owner is not liable for any indirect, incidental, or
              consequential damages arising from your use of the marketplace.
              Our total liability is limited to the amount of creator earnings
              owed to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Platform Owner from any
              claims, damages, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your breach of this agreement</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Content you upload or sell</li>
              <li>Your interactions with buyers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              14. Changes to Agreement
            </h2>
            <p>
              We may modify this agreement at any time. Continued use of the
              marketplace after changes constitutes acceptance of the modified
              terms. Material changes will be communicated via email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              15. Tax Responsibilities
            </h2>
            <p>
              You are responsible for all taxes related to your creator
              earnings. Platform Owner may issue tax forms (e.g., 1099) as
              required by law. You must provide accurate tax information when
              requested.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">16. Contact</h2>
            <p>
              For questions about this Creator Agreement, contact us at{' '}
              <a
                href="/contact"
                className="text-brand-blue-600 hover:underline"
              >
                our contact form
              </a>
            </p>
          </section>

          <div className="mt-8 p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
            <p className="text-sm text-brand-blue-900">
              <strong>
                By applying to become a creator, you acknowledge that you have
                read, understood, and agree to be bound by this Creator
                Agreement.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
