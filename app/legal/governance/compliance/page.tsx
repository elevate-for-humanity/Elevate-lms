import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, Scale, FileCheck, AlertCircle, Globe, Building, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance and Disclosure Framework | Elevate For Humanity',
  description: 'Regulatory compliance, required disclosures, and legal framework for Elevate For Humanity platform operations.',
};

export default function ComplianceFrameworkPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Compliance" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Compliance Framework</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Compliance and Disclosure Framework</h1>
          <p className="text-gray-300">Regulatory requirements, disclosures, and legal compliance</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />EFH-COM-001</span>
            <span>Version 1.0</span>
            <span>January 2025</span>
            <span>Owner: Chief Compliance Officer</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">Official Compliance Document</p>
            <p className="text-sm text-blue-700">Authoritative reference for regulatory compliance and required disclosures.</p>
          </div>
          <a href="/docs/Compliance_and_Disclosure_Framework.pdf" download className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <nav className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-blue-600 hover:underline">1. Purpose & Scope</a></li>
            <li><a href="#entity" className="text-blue-600 hover:underline">2. Entity Structure & Registration</a></li>
            <li><a href="#regulatory" className="text-blue-600 hover:underline">3. Regulatory Framework</a></li>
            <li><a href="#disclosures" className="text-blue-600 hover:underline">4. Required Disclosures</a></li>
            <li><a href="#consumer" className="text-blue-600 hover:underline">5. Consumer Protection</a></li>
            <li><a href="#accessibility" className="text-blue-600 hover:underline">6. Accessibility Compliance</a></li>
            <li><a href="#responsibilities" className="text-blue-600 hover:underline">7. Compliance Responsibilities</a></li>
            <li><a href="#monitoring" className="text-blue-600 hover:underline">8. Monitoring & Reporting</a></li>
            <li><a href="#versioning" className="text-blue-600 hover:underline">9. Versioning & Review</a></li>
          </ol>
        </nav>

        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Scale className="w-6 h-6 text-blue-600" />
            1. Purpose & Scope
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">This document establishes the compliance framework for Elevate For Humanity, ensuring all platform operations meet applicable legal, regulatory, and ethical requirements. It serves as the authoritative reference for compliance obligations across all business units.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Scope</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Educational services (LMS, courses, certifications)</li>
            <li>E-commerce operations (Store, digital products)</li>
            <li>Tax preparation services (Supersonic Fast Cash)</li>
            <li>Financial products (Refund Advance loans)</li>
            <li>Nonprofit operations (Rise Foundation)</li>
          </ul>
        </section>

        <section id="entity" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Building className="w-6 h-6 text-blue-600" />
            2. Entity Structure & Registration
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Legal Entities</h3>
          <table className="w-full border-collapse border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Entity</th>
                <th className="border p-3 text-left">Type</th>
                <th className="border p-3 text-left">Jurisdiction</th>
                <th className="border p-3 text-left">Function</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-3">Elevate For Humanity LLC</td><td className="border p-3">LLC</td><td className="border p-3">Indiana</td><td className="border p-3">Platform operations, LMS, Store</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Rise Foundation</td><td className="border p-3">501(c)(3)</td><td className="border p-3">Indiana</td><td className="border p-3">Scholarships, grants, charitable programs</td></tr>
              <tr><td className="border p-3">Supersonic Fast Cash</td><td className="border p-3">DBA</td><td className="border p-3">Indiana</td><td className="border p-3">Tax preparation services</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Required Registrations</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>IRS:</strong> EIN registration, 501(c)(3) determination letter (Rise Foundation)</li>
            <li><strong>Indiana Secretary of State:</strong> Business registration, annual reports</li>
            <li><strong>IRS PTIN:</strong> Preparer Tax Identification Numbers for tax preparers</li>
            <li><strong>EFIN:</strong> Electronic Filing Identification Number for e-filing</li>
          </ul>
        </section>

        <section id="regulatory" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-blue-600" />
            3. Regulatory Framework
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Educational Services</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Regulation</th><th className="border p-3 text-left">Requirement</th><th className="border p-3 text-left">Our Compliance</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">FERPA</td><td className="border p-3">Student record privacy</td><td className="border p-3">Role-based access, consent management, audit logging</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">ADA/Section 508</td><td className="border p-3">Accessibility</td><td className="border p-3">WCAG 2.1 AA compliance, accessible content</td></tr>
              <tr><td className="border p-3">COPPA</td><td className="border p-3">Children's privacy (under 13)</td><td className="border p-3">Age verification, parental consent where required</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Tax Preparation Services</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Regulation</th><th className="border p-3 text-left">Requirement</th><th className="border p-3 text-left">Our Compliance</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">IRS Circular 230</td><td className="border p-3">Tax preparer standards</td><td className="border p-3">Licensed preparers, continuing education</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">IRC Section 7216</td><td className="border p-3">Taxpayer consent for disclosure</td><td className="border p-3">Written consent before data sharing</td></tr>
              <tr><td className="border p-3">FTC Safeguards Rule</td><td className="border p-3">Financial data protection</td><td className="border p-3">Encryption, access controls, incident response</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.3 Financial Products (Refund Advance)</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Regulation</th><th className="border p-3 text-left">Requirement</th><th className="border p-3 text-left">Our Compliance</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">TILA</td><td className="border p-3">Truth in Lending disclosures</td><td className="border p-3">APR, fees, terms clearly disclosed</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">ECOA</td><td className="border p-3">Equal credit opportunity</td><td className="border p-3">Non-discriminatory lending criteria</td></tr>
              <tr><td className="border p-3">State Lending Laws</td><td className="border p-3">State-specific requirements</td><td className="border p-3">Compliance by state of residence</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.4 E-Commerce</h3>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Regulation</th><th className="border p-3 text-left">Requirement</th><th className="border p-3 text-left">Our Compliance</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">PCI DSS</td><td className="border p-3">Payment card security</td><td className="border p-3">Stripe handles card data (Level 1 certified)</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Sales Tax</td><td className="border p-3">State sales tax collection</td><td className="border p-3">Automated calculation and remittance</td></tr>
              <tr><td className="border p-3">Digital Goods Laws</td><td className="border p-3">Refund policies, licensing</td><td className="border p-3">Clear terms, license agreements</td></tr>
            </tbody>
          </table>
        </section>

        <section id="disclosures" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            4. Required Disclosures
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Website Disclosures</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Privacy Policy:</strong> Data collection, use, sharing, and user rights</li>
            <li><strong>Terms of Service:</strong> User obligations, platform rules, liability limitations</li>
            <li><strong>Cookie Policy:</strong> Cookie usage and consent management</li>
            <li><strong>Accessibility Statement:</strong> Commitment to accessibility, contact for issues</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 Tax Service Disclosures</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Fee Disclosure:</strong> All fees disclosed before service begins</li>
            <li><strong>Refund Advance Terms:</strong> APR, fees, repayment terms, risks</li>
            <li><strong>Data Use Consent:</strong> IRC 7216 consent form before data sharing</li>
            <li><strong>Bank Product Disclosures:</strong> Partner bank information, FDIC status</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Educational Disclosures</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Accreditation Status:</strong> Clear statement of accreditation (or non-accreditation)</li>
            <li><strong>Certification Value:</strong> What certifications represent and their limitations</li>
            <li><strong>Outcome Data:</strong> Completion rates, employment outcomes where applicable</li>
          </ul>
        </section>

        <section id="consumer" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            5. Consumer Protection
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Refund Policies</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Product/Service</th><th className="border p-3 text-left">Refund Policy</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Digital Courses</td><td className="border p-3">14-day money-back guarantee if less than 20% completed</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Digital Products (Store)</td><td className="border p-3">No refunds after download (disclosed at purchase)</td></tr>
              <tr><td className="border p-3">Tax Preparation</td><td className="border p-3">Full refund if return not filed; partial if filed with errors</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Subscriptions</td><td className="border p-3">Cancel anytime, no refund for partial periods</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Dispute Resolution</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li><strong>Internal Resolution:</strong> Contact support within 30 days of issue</li>
            <li><strong>Escalation:</strong> Request supervisor review if unsatisfied</li>
            <li><strong>Mediation:</strong> Third-party mediation available for unresolved disputes</li>
            <li><strong>Arbitration:</strong> Binding arbitration per Terms of Service (with opt-out)</li>
          </ol>
        </section>

        <section id="accessibility" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-600" />
            6. Accessibility Compliance
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Standards</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>WCAG 2.1 Level AA compliance target</li>
            <li>Section 508 compliance for federal accessibility requirements</li>
            <li>ADA Title III compliance for public accommodations</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 Implementation</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Semantic HTML structure throughout platform</li>
            <li>Keyboard navigation support</li>
            <li>Screen reader compatibility</li>
            <li>Color contrast ratios meeting AA standards</li>
            <li>Alt text for images, captions for videos</li>
            <li>Accessible forms with proper labels and error messages</li>
          </ul>
        </section>

        <section id="responsibilities" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Compliance Responsibilities</h2>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Role</th><th className="border p-3 text-left">Responsibilities</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Chief Compliance Officer</td><td className="border p-3">Overall compliance program, regulatory relationships, policy approval</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Data Protection Officer</td><td className="border p-3">Privacy compliance, data subject requests, breach response</td></tr>
              <tr><td className="border p-3">Tax Operations Manager</td><td className="border p-3">IRS compliance, preparer oversight, EFIN management</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Content Managers</td><td className="border p-3">Accessibility compliance, content accuracy</td></tr>
              <tr><td className="border p-3">All Staff</td><td className="border p-3">Report compliance concerns, complete required training</td></tr>
            </tbody>
          </table>
        </section>

        <section id="monitoring" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Monitoring & Reporting</h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">8.1 Compliance Monitoring</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Quarterly compliance audits of all business units</li>
            <li>Annual third-party accessibility audit</li>
            <li>Continuous monitoring of regulatory changes</li>
            <li>User complaint tracking and trend analysis</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">8.2 Reporting</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Monthly compliance dashboard to leadership</li>
            <li>Quarterly board compliance report</li>
            <li>Annual compliance certification</li>
            <li>Immediate escalation of material compliance issues</li>
          </ul>
        </section>

        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Versioning & Review</h2>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Version</th><th className="border p-3 text-left">Date</th><th className="border p-3 text-left">Changes</th></tr></thead>
            <tbody><tr><td className="border p-3">1.0</td><td className="border p-3">January 2025</td><td className="border p-3">Initial authoritative version</td></tr></tbody>
          </table>
          <p className="text-gray-700"><strong>Review Schedule:</strong> Annually, or upon regulatory changes affecting platform operations.</p>
        </section>

        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-COM-001 | <strong>Owner:</strong> Chief Compliance Officer</p>
          <p className="mt-2">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
