import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Shield, Scale, BookOpen, 
  CreditCard, Receipt, Users, Download, ExternalLink 
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Authoritative Documents | Governance | Elevate for Humanity',
  description: 'The seven governing documents that define platform operations for website, LMS, Store, and tax services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/authoritative-docs',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const documents = [
  {
    number: 1,
    title: 'Platform Overview & Governance',
    icon: FileText,
    covers: 'Entire ecosystem',
    description: 'What the platform is, how components relate, who owns decisions, and how governance is enforced.',
    governs: [
      'Public positioning',
      'Platform components and roles',
      'Change management and review cadence',
    ],
  },
  {
    number: 2,
    title: 'Security & Data Protection Statement',
    icon: Shield,
    covers: 'All data handling and security practices',
    description: 'How data is collected, protected, accessed, retained, and how incidents are handled.',
    governs: [
      'Security and privacy language',
      'Data handling across website, LMS, Store, and tax services',
    ],
    link: '/governance/security',
  },
  {
    number: 3,
    title: 'Compliance & Disclosure Framework',
    icon: Scale,
    covers: 'Legal, financial, eligibility, and claims discipline',
    description: 'How disclosures are presented, how claims are supported, and how compliance alignment is maintained.',
    governs: [
      'Eligibility statements',
      'Pricing and fee disclosures',
      'Outcome and capability claims',
    ],
    link: '/governance/compliance',
  },
  {
    number: 4,
    title: 'LMS Governance & Course Standards',
    icon: BookOpen,
    covers: 'Learning Management System operations',
    description: 'How courses are owned, structured, audited, and maintained.',
    governs: [
      'Course completeness requirements',
      'Instructor and ownership rules',
      'Assessments, completion, and audits',
    ],
  },
  {
    number: 5,
    title: 'Store, Payments & Licensing Framework',
    icon: CreditCard,
    covers: 'Store products and payments',
    description: 'How products are sold, priced, paid for, and supported after purchase.',
    governs: [
      'Checkout behavior',
      'Stripe configuration and metadata discipline',
      'Refunds, disputes, and post-purchase obligations',
    ],
  },
  {
    number: 6,
    title: 'Tax Preparation & Refund Advance Operations',
    icon: Receipt,
    covers: 'Supersonic Fast Cash LLC services',
    description: 'How tax preparation works and how optional refund-based advances are positioned and controlled.',
    governs: [
      'Tax filing workflow',
      'Refund advance eligibility and opt-in',
      'Repayment mechanics and disclosures',
    ],
  },
  {
    number: 7,
    title: 'Onboarding & User Experience Standards',
    icon: Users,
    covers: 'All onboarding flows',
    description: 'How users are guided from entry to completion across roles.',
    governs: [
      'Student, instructor, admin, and tax user onboarding',
      'Required disclosures by stage',
      'Completion and exit criteria',
    ],
  },
];

export default function AuthoritativeDocsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Governance', href: '/governance' },
          { label: 'Authoritative Documents' },
        ]}
      />
      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Authoritative Documentation Index
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            These seven documents define how the platform operates. They are designed to 
            stand alone during buyer review, regulatory review, or payment processor review.
          </p>
          <div className="mt-6 text-sm text-slate-400">
            Version: 1.0 • Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* How to Use */}
        <section className="mb-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">How to Use This Index</h2>
          <ul className="space-y-2 text-slate-700">
            <li><strong>Users:</strong> Reference these documents to understand how services work.</li>
            <li><strong>Partners & Buyers:</strong> Use this index to locate governing materials for diligence.</li>
            <li><strong>Auditors & Reviewers:</strong> Each document includes scope, controls, and versioning.</li>
            <li><strong>Internal Teams:</strong> Product copy, features, and workflows must align with these documents.</li>
          </ul>
          <p className="mt-4 text-slate-600 italic">
            Website pages summarize. These documents govern.
          </p>
        </section>

        {/* Document List */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Document Set</h2>
          <div className="space-y-6">
            {documents.map((doc) => (
              <div 
                key={doc.number} 
                className="border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <doc.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-500">Document {doc.number}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      <strong>Covers:</strong> {doc.covers}
                    </p>
                    <p className="text-slate-700 mb-4">
                      {doc.description}
                    </p>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-900 mb-2">Governs:</p>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {doc.governs.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    {doc.link && (
                      <Link 
                        href={doc.link}
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700"
                      >
                        View Summary <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Versioning */}
        <section className="mb-12 bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Versioning & Authority</h2>
          <ul className="space-y-2 text-slate-700">
            <li>• Each document includes its own version number and review date.</li>
            <li>• Superseded versions are archived.</li>
            <li>• In the event of conflict, the most recently reviewed version prevails.</li>
            <li>• No other page, template, or artifact overrides these documents.</li>
          </ul>
        </section>

        {/* Request PDFs */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Request Full Documents</h2>
          <p className="text-slate-600 mb-6">
            For PDF versions of these documents or additional diligence materials, 
            contact our governance team.
          </p>
          <Link
            href="/governance/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <Download className="w-5 h-5" />
            Request Documents
          </Link>
        </section>
      </div>
    </div>
  );
}
