import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Scale, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { QuickSummary } from '@/app/governance/_content/QuickSummary';
import { SupersonicScopeSection } from '@/app/governance/_content/SupersonicScopeSection';

export const metadata: Metadata = {
  title: 'Compliance & Disclosure Framework | Supersonic Fast Cash',
  description: 'How legal, financial, and eligibility disclosures are presented for Supersonic Fast Cash tax preparation and refund advance services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/compliance',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const summaryBullets = [
  'All disclosures are clear, timely, accurate, and complete',
  'Eligibility criteria for refund advances are stated explicitly',
  'Pricing and fees are disclosed before checkout completion',
  'Outcome claims are supportable and not misleading',
  'Quarterly compliance audits ensure ongoing alignment',
];

export default function SupersonicCompliancePage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Compliance" }]} />
      </div>
{/* Header - Supersonic branded */}
      <div className="bg-emerald-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            href="/governance" 
            className="inline-flex items-center text-emerald-300 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Governance
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-blue-600 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">Supersonic Fast Cash</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Compliance & Disclosure Framework
              </h1>
            </div>
          </div>
          <p className="text-emerald-100">
            Document 3 of 7 • Legal, financial, and eligibility standards
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-emerald-300">
            <span>Version: 1.0</span>
            <span>•</span>
            <span>Last Reviewed: {currentDate}</span>
            <span>•</span>
            <span>Owner: Platform Compliance</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Summary */}
        <QuickSummary
          title="Compliance & Disclosures"
          bullets={summaryBullets}
          elevateCanonicalPath="/governance/compliance"
          showSupersonicScope
        />

        {/* Supersonic Scope Section */}
        <SupersonicScopeSection pageType="compliance" />

        {/* Full Content Mirror */}
        <article className="prose prose-slate max-w-none">
          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              1. Purpose
            </h2>
            <p className="text-slate-700 leading-relaxed">
              This document defines how disclosures are presented, how claims are supported, 
              and how compliance alignment is maintained across the platform. It exists to 
              ensure that users, partners, regulators, and payment processors can verify 
              that the platform operates within applicable legal and ethical standards.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              2. Scope
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              This framework applies to:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Public website and marketing content</li>
              <li>Learning Management System (LMS) course descriptions and outcomes</li>
              <li>Store product descriptions and pricing</li>
              <li>Supersonic Fast Cash tax preparation and refund advance disclosures</li>
              <li>Partner and affiliate communications</li>
              <li>Email and notification content</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              3. Disclosure Principles
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Clear and Conspicuous</p>
                  <p className="text-slate-600 text-sm">Disclosures are presented in plain language, visible without scrolling or clicking where possible.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Timely</p>
                  <p className="text-slate-600 text-sm">Disclosures are presented before the user commits to a transaction or action.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Accurate</p>
                  <p className="text-slate-600 text-sm">All claims are supportable and aligned with authoritative documents.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Complete</p>
                  <p className="text-slate-600 text-sm">Material terms, conditions, and limitations are disclosed, not hidden.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              4. Eligibility Statements
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              When eligibility criteria apply (e.g., for refund advances, program enrollment, or certifications):
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Criteria are stated explicitly</li>
              <li>No guarantee of approval is implied unless explicitly stated</li>
              <li>Disqualifying factors are disclosed where known</li>
              <li>Users are informed of the decision process</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              5. Pricing and Fee Disclosures
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              All pricing and fees are disclosed as follows:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Total price is shown before checkout completion</li>
              <li>Recurring charges are clearly labeled with frequency</li>
              <li>Optional fees are distinguished from required fees</li>
              <li>Refund and cancellation policies are accessible</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              6. Outcome and Capability Claims
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700">
                  Claims about outcomes (e.g., job placement, income, certification value) must be 
                  supportable and not misleading. Typical results, not exceptional results, are used 
                  as the basis for claims.
                </p>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Where outcomes depend on user effort, market conditions, or third-party decisions, 
              this is disclosed.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              7. Regulatory Alignment
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              The platform is designed to align with applicable regulations, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Consumer protection laws</li>
              <li>Data privacy regulations</li>
              <li>Financial services disclosure requirements</li>
              <li>Advertising and marketing standards</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Specific regulatory requirements are addressed in the relevant authoritative documents.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              8. Review and Enforcement
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Compliance is maintained through:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Quarterly compliance language audits</li>
              <li>PR review checklists for disclosure-sensitive changes</li>
              <li>Escalation procedures for identified issues</li>
              <li>Documentation of compliance decisions</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              9. Versioning
            </h2>
            <p className="text-slate-700 leading-relaxed">
              This document is reviewed periodically and updated as regulations, products, or 
              operational practices change. Superseded versions are archived for reference.
            </p>
          </section>
        </article>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-center text-slate-500 text-sm mb-6">End of Document</p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/governance"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Back to Index
            </Link>
            <Link 
              href="/governance/contact"
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Contact Compliance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
