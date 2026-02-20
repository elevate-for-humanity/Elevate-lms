
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, ShoppingCart, CreditCard, FileCheck, RefreshCw, Shield, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Store, Payments, and Licensing Framework | Elevate For Humanity',
  description: 'E-commerce operations, payment processing, digital product licensing, and refund policies.',
};

export default function StorePaymentsPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Store Payments" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Store & Payments</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Store, Payments, and Licensing Framework</h1>
          <p className="text-gray-300">E-commerce operations, payment processing, and digital licensing</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />EFH-STO-001</span>
            <span>Version 1.0</span>
            <span>January 2025</span>
            <span>Owner: Director of Operations</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-brand-blue-900">Official Store Operations Document</p>
            <p className="text-sm text-brand-blue-700">Authoritative reference for e-commerce, payments, and licensing.</p>
          </div>
          <a href="/docs/Store_Payments_Licensing_Framework.pdf" download className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <nav className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-brand-blue-600 hover:underline">1. Purpose & Scope</a></li>
            <li><a href="#products" className="text-brand-blue-600 hover:underline">2. Product Types & Catalog</a></li>
            <li><a href="#payments" className="text-brand-blue-600 hover:underline">3. Payment Processing</a></li>
            <li><a href="#licensing" className="text-brand-blue-600 hover:underline">4. Digital Licensing</a></li>
            <li><a href="#pricing" className="text-brand-blue-600 hover:underline">5. Pricing & Promotions</a></li>
            <li><a href="#refunds" className="text-brand-blue-600 hover:underline">6. Refunds & Disputes</a></li>
            <li><a href="#seller" className="text-brand-blue-600 hover:underline">7. Seller/Creator Policies</a></li>
            <li><a href="#responsibilities" className="text-brand-blue-600 hover:underline">8. Roles & Responsibilities</a></li>
            <li><a href="#versioning" className="text-brand-blue-600 hover:underline">9. Versioning & Review</a></li>
          </ol>
        </nav>

        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-brand-blue-600" />
            1. Purpose & Scope
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">This document governs all e-commerce operations for the Elevate For Humanity Store, including product listings, payment processing, digital licensing, and customer policies. It ensures consistent, compliant, and customer-friendly commerce operations.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Scope</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Digital product sales (templates, guides, tools)</li>
            <li>Course purchases (individual and bundled)</li>
            <li>Subscription services</li>
            <li>Third-party creator marketplace</li>
            <li>Payment processing and financial operations</li>
          </ul>
        </section>

        <section id="products" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-brand-blue-600" />
            2. Product Types & Catalog
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Product Categories</h3>
          <table className="w-full border-collapse border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-left">Description</th>
                <th className="border p-3 text-left">Delivery</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-3">Digital Templates</td><td className="border p-3">Spreadsheets, documents, planners</td><td className="border p-3">Instant download</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">E-books & Guides</td><td className="border p-3">PDF guides, workbooks</td><td className="border p-3">Instant download</td></tr>
              <tr><td className="border p-3">Software Tools</td><td className="border p-3">Calculators, apps, plugins</td><td className="border p-3">Download or web access</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Courses</td><td className="border p-3">Self-paced learning programs</td><td className="border p-3">LMS access</td></tr>
              <tr><td className="border p-3">Bundles</td><td className="border p-3">Combined products at discount</td><td className="border p-3">Per component</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Subscriptions</td><td className="border p-3">Recurring access to content/services</td><td className="border p-3">Ongoing access</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Product Listing Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Title:</strong> Clear, descriptive, accurate</li>
            <li><strong>Description:</strong> What's included, who it's for, how to use</li>
            <li><strong>Preview:</strong> Screenshots, sample pages, or demo where applicable</li>
            <li><strong>File Format:</strong> Clearly stated (PDF, XLSX, etc.)</li>
            <li><strong>System Requirements:</strong> Software needed to use product</li>
            <li><strong>License Type:</strong> Personal, commercial, or extended</li>
          </ul>
        </section>

        <section id="payments" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-brand-blue-600" />
            3. Payment Processing
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Payment Provider</h3>
          <p className="text-gray-700 mb-4">All payments processed through <strong>Stripe</strong>, a PCI DSS Level 1 certified payment processor. Elevate For Humanity does not store credit card numbers directly.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Accepted Payment Methods</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Credit/Debit Cards (Visa, Mastercard, American Express, Discover)</li>
            <li>Digital Wallets (Apple Pay, Google Pay)</li>
            <li>Bank transfers (ACH) for subscriptions</li>
            <li>Buy Now, Pay Later (Affirm, Klarna) for orders over $50</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.3 Currency & Taxes</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Currency:</strong> USD (United States Dollars)</li>
            <li><strong>Sales Tax:</strong> Calculated and collected based on customer location</li>
            <li><strong>Tax Remittance:</strong> Automated via Stripe Tax</li>
            <li><strong>Invoices:</strong> Provided for all purchases via email</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.4 Security Measures</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>TLS 1.3 encryption for all transactions</li>
            <li>3D Secure authentication for high-risk transactions</li>
            <li>Fraud detection via Stripe Radar</li>
            <li>No storage of full card numbers on our servers</li>
          </ul>
        </section>

        <section id="licensing" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-brand-blue-600" />
            4. Digital Licensing
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 License Types</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">License</th><th className="border p-3 text-left">Permitted Use</th><th className="border p-3 text-left">Restrictions</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Personal</td><td className="border p-3">Individual, non-commercial use</td><td className="border p-3">No resale, no commercial use, single user</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Commercial</td><td className="border p-3">Business use, client work</td><td className="border p-3">No resale as-is, attribution may be required</td></tr>
              <tr><td className="border p-3">Extended</td><td className="border p-3">Unlimited commercial use, derivative works</td><td className="border p-3">No resale of original, per-product terms</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Team/Enterprise</td><td className="border p-3">Multiple users within organization</td><td className="border p-3">Named users or seat-based, no external sharing</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 License Terms</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>License granted upon successful payment</li>
            <li>License is perpetual unless otherwise stated</li>
            <li>Updates included for 12 months (where applicable)</li>
            <li>License is non-transferable without written consent</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Prohibited Uses (All Licenses)</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Reselling or redistributing the original product</li>
            <li>Sharing download links or account access</li>
            <li>Removing copyright notices or attribution</li>
            <li>Using in illegal, defamatory, or harmful contexts</li>
          </ul>
        </section>

        <section id="pricing" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-brand-blue-600" />
            5. Pricing & Promotions
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Pricing Guidelines</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Prices displayed in USD, inclusive of base price</li>
            <li>Sales tax added at checkout based on location</li>
            <li>Price changes do not affect existing purchases</li>
            <li>Subscription price changes require 30-day notice</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Promotional Policies</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Discount Codes:</strong> Single use unless specified, cannot be combined</li>
            <li><strong>Sales:</strong> Clearly marked start/end dates, original price shown</li>
            <li><strong>Bundles:</strong> Discount reflected in bundle price vs. individual items</li>
            <li><strong>Scholarships:</strong> Available for qualifying individuals via Rise Foundation</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Subscription Billing</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Billed on same day each month/year</li>
            <li>Failed payment: 3 retry attempts over 7 days</li>
            <li>Access suspended after failed retries</li>
            <li>Cancel anytime, access continues until period end</li>
          </ul>
        </section>

        <section id="refunds" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-brand-blue-600" />
            6. Refunds & Disputes
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Refund Policy by Product Type</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Product Type</th><th className="border p-3 text-left">Refund Policy</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Digital Downloads</td><td className="border p-3">No refunds after download (disclosed at purchase)</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Courses</td><td className="border p-3">14 days if &lt;20% completed</td></tr>
              <tr><td className="border p-3">Subscriptions</td><td className="border p-3">No partial refunds; cancel anytime for future billing</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Bundles</td><td className="border p-3">Per component policy; partial refunds possible</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 Refund Process</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li>Request via our contact form within policy window</li>
            <li>Include order number and reason for refund</li>
            <li>Review completed within 3 business days</li>
            <li>Approved refunds processed within 5-10 business days</li>
            <li>Refund issued to original payment method</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.3 Exceptions</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Technical issues preventing product use (full refund)</li>
            <li>Product significantly different from description (full refund)</li>
            <li>Duplicate purchases (full refund)</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.4 Chargebacks</h3>
          <p className="text-gray-700">Customers should contact us before initiating chargebacks. Fraudulent chargebacks may result in account suspension and collection action.</p>
        </section>

        <section id="seller" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-blue-600" />
            7. Seller/Creator Policies
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.1 Creator Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Verified identity and tax information (W-9 for US creators)</li>
            <li>Agreement to Creator Terms of Service</li>
            <li>Original content or proper licensing for all materials</li>
            <li>Compliance with platform content guidelines</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.2 Revenue Share</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Creator Type</th><th className="border p-3 text-left">Creator Share</th><th className="border p-3 text-left">Platform Share</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Standard Creator</td><td className="border p-3">70%</td><td className="border p-3">30%</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Premium Creator (high volume)</td><td className="border p-3">80%</td><td className="border p-3">20%</td></tr>
              <tr><td className="border p-3">Exclusive Content</td><td className="border p-3">85%</td><td className="border p-3">15%</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.3 Payouts</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Monthly payouts via Stripe Connect</li>
            <li>Minimum payout threshold: $50</li>
            <li>Payout methods: Bank transfer, debit card</li>
            <li>Refunds deducted from creator balance</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.4 Content Guidelines</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>No plagiarized or copyright-infringing content</li>
            <li>No misleading claims or false advertising</li>
            <li>No illegal, harmful, or discriminatory content</li>
            <li>Products must deliver stated value</li>
          </ul>
        </section>

        <section id="responsibilities" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Roles & Responsibilities</h2>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Role</th><th className="border p-3 text-left">Responsibilities</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Director of Operations</td><td className="border p-3">Overall store governance, pricing strategy, vendor relationships</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Finance Team</td><td className="border p-3">Payment processing, tax compliance, creator payouts</td></tr>
              <tr><td className="border p-3">Content Team</td><td className="border p-3">Product review, catalog management, quality assurance</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Customer Support</td><td className="border p-3">Refund requests, purchase issues, dispute resolution</td></tr>
              <tr><td className="border p-3">Legal/Compliance</td><td className="border p-3">Licensing terms, regulatory compliance, dispute escalation</td></tr>
            </tbody>
          </table>
        </section>

        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Versioning & Review</h2>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Version</th><th className="border p-3 text-left">Date</th><th className="border p-3 text-left">Changes</th></tr></thead>
            <tbody><tr><td className="border p-3">1.0</td><td className="border p-3">January 2025</td><td className="border p-3">Initial authoritative version</td></tr></tbody>
          </table>
          <p className="text-gray-700"><strong>Review Schedule:</strong> Annually, or upon significant changes to payment processing, tax requirements, or product offerings.</p>
        </section>

        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-STO-001 | <strong>Owner:</strong> Director of Operations</p>
          <p className="mt-2">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
