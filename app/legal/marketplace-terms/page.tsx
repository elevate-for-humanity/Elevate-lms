
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Legal Marketplace Terms | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

export default function MarketplaceTermsPage() {

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Marketplace Terms" }]} />
      </div>
<div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace Terms</h1>
        <p className="text-black mb-8">Last Updated: December 13, 2024</p>

        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Marketplace Overview</h2>
            <p>
              The Elevate for Humanity Creator Marketplace ("Marketplace") is a
              platform where approved creators sell digital products. By
              purchasing from the Marketplace, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              2. Digital Products Only
            </h2>
            <p>
              All products sold on the Marketplace are digital products,
              including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Downloadable files (PDFs, videos, audio, templates)</li>
              <li>Digital guides and workbooks</li>
              <li>Online courses and training materials</li>
              <li>Software and digital tools</li>
            </ul>
            <p className="mt-3">
              No physical products are sold through the Marketplace. All
              purchases are delivered digitally.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Purchase Process</h2>
            <p>When you purchase a product:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment is processed securely through Stripe</li>
              <li>You receive immediate access to download the product</li>
              <li>A download link is sent to your email</li>
              <li>Download links expire after 30 days</li>
              <li>
                You may download the product multiple times within the
                expiration period
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. No Account Required</h2>
            <p>
              You do not need to create an account to purchase from the
              Marketplace. Purchases are tied to your email address. Keep your
              purchase confirmation email for future access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Pricing and Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices are in USD</li>
              <li>Prices are set by individual creators</li>
              <li>Payment is processed at the time of purchase</li>
              <li>
                We accept major credit cards and payment methods supported by
                Stripe
              </li>
              <li>Prices may change at any time without notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Refund Policy</h2>
            <p>
              <strong>Digital products are generally non-refundable</strong> due
              to their nature. However, refunds may be issued in the following
              cases:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Product file is corrupted or cannot be downloaded</li>
              <li>Product is significantly different from its description</li>
              <li>Duplicate purchase made in error</li>
              <li>Technical issues prevent access to the product</li>
            </ul>
            <p className="mt-3">
              Refund requests must be submitted within 7 days of purchase.
              Contact{' '}
              <a
                href="/contact"
                className="text-brand-blue-600 hover:underline"
              >
                our contact form
              </a>{' '}
              with your order details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              7. License and Usage Rights
            </h2>
            <p>When you purchase a product, you receive:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A personal, non-transferable license to use the product</li>
              <li>
                The right to download and use the product for personal use
              </li>
              <li>Lifetime access to the purchased product</li>
            </ul>
            <p className="mt-3">You may NOT:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Resell, redistribute, or share the product</li>
              <li>Claim ownership or authorship of the product</li>
              <li>
                Use the product for commercial purposes (unless specified)
              </li>
              <li>Modify and redistribute the product</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              8. Creator Responsibility
            </h2>
            <p>
              Products are created and sold by independent creators. Elevate for
              Humanity:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Approves creators and products before listing</li>
              <li>Processes payments and delivers products</li>
              <li>Provides customer support for technical issues</li>
              <li>Does NOT create or guarantee the quality of products</li>
            </ul>
            <p className="mt-3">
              For product-specific questions or support, contact the creator
              directly through the product page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              9. Intellectual Property
            </h2>
            <p>
              All products sold on the Marketplace are protected by intellectual
              property laws. Creators retain ownership of their content.
              Unauthorized use, reproduction, or distribution is prohibited and
              may result in legal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">10. Prohibited Uses</h2>
            <p>You may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Share download links with others</li>
              <li>Attempt to circumvent payment or access controls</li>
              <li>Use products in violation of applicable laws</li>
              <li>Reverse engineer or decompile digital products</li>
              <li>Remove copyright notices or creator attribution</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              11. Disclaimer of Warranties
            </h2>
            <p>
              Products are provided "as is" without warranties of any kind. We
              do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Product quality, accuracy, or completeness</li>
              <li>Fitness for a particular purpose</li>
              <li>Results from using the product</li>
              <li>Compatibility with your devices or software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">
              12. Limitation of Liability
            </h2>
            <p>
              Elevate for Humanity is not liable for any damages arising from
              your purchase or use of Marketplace products. Our total liability
              is limited to the amount you paid for the product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">13. Privacy</h2>
            <p>
              Your purchase information is handled according to our{' '}
              <a
                href="/privacy-policy"
                className="text-brand-blue-600 hover:underline"
              >
                Privacy Policy
              </a>
              . We collect:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address for delivery and support</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Purchase history for record-keeping</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">14. Changes to Terms</h2>
            <p>
              We may update these Marketplace Terms at any time. Changes are
              effective immediately upon posting. Your continued use of the
              Marketplace constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">15. Governing Law</h2>
            <p>
              These terms are governed by the laws of the United States. Any
              disputes will be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">16. Contact</h2>
            <p>
              For questions about Marketplace purchases or these terms, contact:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{' '}
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
                By making a purchase on the Marketplace, you acknowledge that
                you have read, understood, and agree to these Marketplace Terms.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
