import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, Calculator, DollarSign, Shield, Clock, AlertTriangle, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tax Preparation and Refund Advance Operations | Elevate For Humanity',
  description: 'Supersonic Fast Cash tax preparation services, refund advance loans, IRS compliance, and operational procedures.',
};

export default function TaxOperationsPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Tax Operations" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Tax Operations</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Tax Preparation and Refund Advance Operations</h1>
          <p className="text-gray-300">Supersonic Fast Cash services, compliance, and operational procedures</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />EFH-TAX-001</span>
            <span>Version 1.0</span>
            <span>January 2025</span>
            <span>Owner: Tax Operations Manager</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-red-900">Official Tax Operations Document</p>
            <p className="text-sm text-red-700">Authoritative reference for Supersonic Fast Cash tax services and refund advances.</p>
          </div>
          <a href="/docs/Tax_Preparation_Refund_Advance_Operations.pdf" download className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <nav className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-red-600 hover:underline">1. Purpose & Scope</a></li>
            <li><a href="#services" className="text-red-600 hover:underline">2. Services Offered</a></li>
            <li><a href="#compliance" className="text-red-600 hover:underline">3. IRS Compliance</a></li>
            <li><a href="#refund-advance" className="text-red-600 hover:underline">4. Refund Advance Program</a></li>
            <li><a href="#fees" className="text-red-600 hover:underline">5. Fee Structure & Disclosures</a></li>
            <li><a href="#data-security" className="text-red-600 hover:underline">6. Data Security & Privacy</a></li>
            <li><a href="#quality" className="text-red-600 hover:underline">7. Quality Assurance</a></li>
            <li><a href="#responsibilities" className="text-red-600 hover:underline">8. Roles & Responsibilities</a></li>
            <li><a href="#versioning" className="text-red-600 hover:underline">9. Versioning & Review</a></li>
          </ol>
        </nav>

        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-red-600" />
            1. Purpose & Scope
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">This document governs all tax preparation services operated under the Supersonic Fast Cash brand, including individual tax return preparation, refund advance loans, and related financial products. It ensures IRS compliance, consumer protection, and operational excellence.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Scope</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Individual federal and state tax return preparation</li>
            <li>Refund Advance loan products</li>
            <li>Refund Transfer (bank product) services</li>
            <li>Tax preparer training and certification</li>
            <li>Quality review and error resolution</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.3 Operating Entity</h3>
          <p className="text-gray-700"><strong>Supersonic Fast Cash</strong> operates as a DBA of Elevate For Humanity LLC, registered in Indiana. Tax preparation services are provided by licensed tax preparers with valid PTINs.</p>
        </section>

        <section id="services" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-red-600" />
            2. Services Offered
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Tax Preparation Services</h3>
          <table className="w-full border-collapse border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Service</th>
                <th className="border p-3 text-left">Description</th>
                <th className="border p-3 text-left">Delivery</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-3">Basic Return (1040)</td><td className="border p-3">W-2 income, standard deduction</td><td className="border p-3">Same day</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Standard Return</td><td className="border p-3">W-2, 1099, itemized deductions</td><td className="border p-3">1-2 days</td></tr>
              <tr><td className="border p-3">Complex Return</td><td className="border p-3">Self-employment, rental, investments</td><td className="border p-3">2-5 days</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">State Returns</td><td className="border p-3">All 50 states supported</td><td className="border p-3">With federal</td></tr>
              <tr><td className="border p-3">Amended Returns</td><td className="border p-3">Corrections to prior filings</td><td className="border p-3">3-5 days</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Service Channels</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Online Self-Prep:</strong> Guided DIY tax preparation with review</li>
            <li><strong>Virtual Assisted:</strong> Video/phone consultation with tax preparer</li>
            <li><strong>Drop-Off:</strong> Document upload, preparer completes return</li>
            <li><strong>In-Person:</strong> Partner locations during tax season</li>
          </ul>
        </section>

        <section id="compliance" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-600" />
            3. IRS Compliance
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Preparer Requirements</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Requirement</th><th className="border p-3 text-left">Description</th><th className="border p-3 text-left">Verification</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">PTIN</td><td className="border p-3">Preparer Tax Identification Number</td><td className="border p-3">Annual renewal verified</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">AFSP or Credential</td><td className="border p-3">Annual Filing Season Program or EA/CPA</td><td className="border p-3">Certificate on file</td></tr>
              <tr><td className="border p-3">Background Check</td><td className="border p-3">Criminal and credit check</td><td className="border p-3">Prior to onboarding</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Continuing Education</td><td className="border p-3">18 hours annually (AFSP)</td><td className="border p-3">Completion certificates</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 EFIN Management</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Electronic Filing Identification Number (EFIN) registered with IRS</li>
            <li>EFIN holder responsible for all returns filed under the number</li>
            <li>Annual EFIN renewal and suitability check</li>
            <li>Secure storage of EFIN credentials</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.3 Circular 230 Compliance</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Due diligence on all return positions</li>
            <li>No frivolous or fraudulent positions</li>
            <li>Proper documentation of preparer advice</li>
            <li>Client communication standards</li>
          </ul>
        </section>

        <section id="refund-advance" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-red-600" />
            4. Refund Advance Program
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Product Overview</h3>
          <p className="text-gray-700 mb-4">Refund Advance is a loan offered by our partner bank, secured by the taxpayer's expected federal refund. The loan is repaid when the IRS issues the refund.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 Loan Terms</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Feature</th><th className="border p-3 text-left">Details</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Loan Amounts</td><td className="border p-3">$250, $500, $1,000, $2,500, $5,000</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Interest Rate</td><td className="border p-3">0% APR (no interest charged)</td></tr>
              <tr><td className="border p-3">Fees</td><td className="border p-3">$0 loan fee (tax prep fees separate)</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Repayment</td><td className="border p-3">Automatic from IRS refund</td></tr>
              <tr><td className="border p-3">Funding Time</td><td className="border p-3">Same day or next business day</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Eligibility Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Federal refund of at least $500</li>
            <li>Tax return prepared by Supersonic Fast Cash</li>
            <li>Valid government-issued ID</li>
            <li>Bank account or prepaid card for funding</li>
            <li>Pass bank's underwriting criteria</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.4 Required Disclosures</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800"><strong>Important:</strong> All Refund Advance disclosures must be provided in writing before loan application, including: APR, total cost, repayment terms, risks if refund is less than expected, and right to cancel.</p>
          </div>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Truth in Lending Act (TILA) disclosures</li>
            <li>Loan agreement with all terms</li>
            <li>Risk disclosure (refund may differ from estimate)</li>
            <li>Bank partner identification and FDIC status</li>
          </ul>
        </section>

        <section id="fees" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-red-600" />
            5. Fee Structure & Disclosures
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Tax Preparation Fees</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Service</th><th className="border p-3 text-left">Fee Range</th><th className="border p-3 text-left">Notes</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Basic Federal Return</td><td className="border p-3">$50 - $100</td><td className="border p-3">W-2 only, standard deduction</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Standard Federal Return</td><td className="border p-3">$100 - $200</td><td className="border p-3">Multiple income sources</td></tr>
              <tr><td className="border p-3">Complex Federal Return</td><td className="border p-3">$200 - $400</td><td className="border p-3">Self-employment, Schedule C</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">State Return</td><td className="border p-3">$40 - $75</td><td className="border p-3">Per state</td></tr>
              <tr><td className="border p-3">Amended Return</td><td className="border p-3">$75 - $150</td><td className="border p-3">Corrections to prior year</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Bank Product Fees</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Product</th><th className="border p-3 text-left">Fee</th><th className="border p-3 text-left">Description</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Refund Advance</td><td className="border p-3">$0</td><td className="border p-3">No-fee loan</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Refund Transfer</td><td className="border p-3">$35 - $50</td><td className="border p-3">Pay fees from refund</td></tr>
              <tr><td className="border p-3">Prepaid Card</td><td className="border p-3">$0 - $10</td><td className="border p-3">Optional card for refund</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Fee Disclosure Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>All fees disclosed in writing before service begins</li>
            <li>Fee estimate provided after initial document review</li>
            <li>Final fee confirmed before return is filed</li>
            <li>No hidden fees or surprise charges</li>
            <li>Itemized receipt provided after payment</li>
          </ul>
        </section>

        <section id="data-security" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-600" />
            6. Data Security & Privacy
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Sensitive Data Handling</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>SSN:</strong> Encrypted at rest and in transit, masked in UI (XXX-XX-1234)</li>
            <li><strong>Tax Documents:</strong> Encrypted storage, access logging, 7-year retention</li>
            <li><strong>Bank Information:</strong> Tokenized, never stored in plain text</li>
            <li><strong>Income Data:</strong> Encrypted, access restricted to assigned preparer</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 IRC Section 7216 Compliance</h3>
          <p className="text-gray-700 mb-4">Tax return information cannot be disclosed or used for purposes other than tax preparation without written consent from the taxpayer.</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Consent form required before any data sharing</li>
            <li>Separate consent for marketing use</li>
            <li>Consent is revocable at any time</li>
            <li>Records of consent maintained for 3 years</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.3 FTC Safeguards Rule</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Written information security program</li>
            <li>Designated security coordinator</li>
            <li>Risk assessment and mitigation</li>
            <li>Employee training on data security</li>
            <li>Vendor oversight for data handling</li>
          </ul>
        </section>

        <section id="quality" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            7. Quality Assurance
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.1 Review Process</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Preparer Review:</strong> Initial preparation and self-review</li>
            <li><strong>Peer Review:</strong> Second preparer reviews complex returns</li>
            <li><strong>Quality Review:</strong> Random sampling of all returns (10%)</li>
            <li><strong>Manager Review:</strong> All returns over $10,000 refund</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.2 Error Resolution</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Error Type</th><th className="border p-3 text-left">Resolution</th><th className="border p-3 text-left">Client Communication</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Minor (no financial impact)</td><td className="border p-3">Correct and refile if needed</td><td className="border p-3">Notify client</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Moderate (small financial impact)</td><td className="border p-3">Amended return, fee waived</td><td className="border p-3">Explain and apologize</td></tr>
              <tr><td className="border p-3">Major (significant impact)</td><td className="border p-3">Amended return, penalty coverage</td><td className="border p-3">Manager contact, remediation plan</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.3 Accuracy Guarantee</h3>
          <p className="text-gray-700">If an error on a return prepared by Supersonic Fast Cash results in IRS penalties or interest, we will reimburse the client for those penalties and interest (up to $10,000) and prepare the amended return at no charge.</p>
        </section>

        <section id="responsibilities" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-red-600" />
            8. Roles & Responsibilities
          </h2>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Role</th><th className="border p-3 text-left">Responsibilities</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Tax Operations Manager</td><td className="border p-3">Overall tax operations, IRS relationships, EFIN management</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Quality Review Manager</td><td className="border p-3">Return review process, error tracking, preparer coaching</td></tr>
              <tr><td className="border p-3">Tax Preparers</td><td className="border p-3">Return preparation, client communication, continuing education</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Client Services</td><td className="border p-3">Scheduling, document collection, status updates</td></tr>
              <tr><td className="border p-3">Compliance Officer</td><td className="border p-3">Regulatory compliance, audit response, policy updates</td></tr>
            </tbody>
          </table>
        </section>

        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Versioning & Review</h2>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Version</th><th className="border p-3 text-left">Date</th><th className="border p-3 text-left">Changes</th></tr></thead>
            <tbody><tr><td className="border p-3">1.0</td><td className="border p-3">January 2025</td><td className="border p-3">Initial authoritative version</td></tr></tbody>
          </table>
          <p className="text-gray-700"><strong>Review Schedule:</strong> Annually before tax season, or upon IRS regulatory changes.</p>
        </section>

        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-TAX-001 | <strong>Owner:</strong> Tax Operations Manager</p>
          <p className="mt-2">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
