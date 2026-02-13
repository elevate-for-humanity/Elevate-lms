import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  FileText, Shield, Scale, Search, Settings, Mail, 
  ArrowRight, Building2, CheckCircle, Zap
} from 'lucide-react';
import { QuickSummary } from '@/app/governance/_content/QuickSummary';

export const metadata: Metadata = {
  title: 'Governance | Supersonic Fast Cash',
  description: 'Platform governance, authoritative documents, and operational controls for Supersonic Fast Cash tax preparation and refund advance services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const quickLinks = [
  {
    title: 'Authoritative Documents',
    description: 'The seven governing documents that define platform operations',
    href: '/governance/authoritative-docs',
    icon: FileText,
  },
  {
    title: 'Security & Data Protection',
    description: 'How data is collected, protected, and managed',
    href: '/governance/security',
    icon: Shield,
  },
  {
    title: 'Compliance & Disclosures',
    description: 'Legal, financial, and eligibility standards',
    href: '/governance/compliance',
    icon: Scale,
  },
  {
    title: 'SEO & Indexing Governance',
    description: 'How search visibility is controlled and enforced',
    href: '/governance/seo-indexing',
    icon: Search,
  },
  {
    title: 'Operational Controls',
    description: 'Audits, CI gates, and deployment controls',
    href: '/governance/operational-controls',
    icon: Settings,
  },
  {
    title: 'Governance Contact',
    description: 'Who to contact for diligence questions',
    href: '/governance/contact',
    icon: Mail,
  },
];

const highlights = [
  'Single source of truth for all platform operations',
  'Documented security and data protection practices',
  'Automated enforcement of indexing and content rules',
  'Regular audits of LMS, Store, and compliance',
  'Clear change management and review processes',
];

const summaryBullets = [
  'Supersonic Fast Cash operates under the Elevate for Humanity governance framework',
  'All security, compliance, and operational controls apply to tax preparation services',
  'Refund advance products follow the same disclosure and eligibility standards',
  'No separate governance policies exist for Supersonic services',
];

export default function SupersonicGovernancePage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Governance" }]} />
      </div>
{/* Header - Supersonic branded */}
      <div className="bg-emerald-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Supersonic Fast Cash</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Governance
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            This page provides a clear overview of how Supersonic Fast Cash is governed, 
            documented, and controlled as part of the Elevate for Humanity platform ecosystem.
          </p>
          <div className="mt-6 text-sm text-emerald-300">
            Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Summary - Supersonic specific */}
        <QuickSummary
          title="Supersonic Governance"
          bullets={summaryBullets}
          elevateCanonicalPath="/governance"
          showSupersonicScope
        />

        {/* For Reviewers */}
        <section className="mb-12 bg-emerald-50 rounded-xl p-6 border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">For Partners, Buyers & Reviewers</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            If you are a partner, buyer, reviewer, or agency representative, this is the best 
            starting point for understanding how Supersonic Fast Cash operates and how risk is managed.
          </p>
          <p className="text-slate-700 leading-relaxed">
            All governance documents are designed to stand alone during diligence, regulatory 
            review, or payment processor review.
          </p>
        </section>

        {/* What You'll Find */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You Will Find Here</h2>
          <div className="space-y-3">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <link.icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">{link.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Supersonic Scope */}
        <section className="mb-12 bg-amber-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-amber-700" />
            <h2 className="text-xl font-bold text-slate-900">Application to Supersonic Fast Cash LLC</h2>
          </div>
          <p className="text-slate-700 mb-4">
            This governance framework applies to all Supersonic Fast Cash LLC services:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li>• Tax preparation services</li>
            <li>• Optional refund-based advance products</li>
            <li>• Customer support and communications</li>
            <li>• Data handling and security practices</li>
          </ul>
          <p className="mt-4 text-sm text-slate-600 italic">
            Supersonic does not maintain separate governance policies. All operations inherit 
            from the canonical Elevate for Humanity governance framework.
          </p>
        </section>

        {/* Related Resources */}
        <section className="mb-12 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tax-preparation"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-emerald-300 hover:text-emerald-600 transition-colors"
            >
              Tax Preparation
            </Link>
            <Link
              href="/refund-advance"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-emerald-300 hover:text-emerald-600 transition-colors"
            >
              Refund Advance
            </Link>
            <Link
              href="/privacy-policy"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-emerald-300 hover:text-emerald-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-emerald-300 hover:text-emerald-600 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
          <p className="text-slate-600 mb-6">
            For diligence inquiries or governance questions, contact our team.
          </p>
          <Link
            href="/governance/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Governance Team
          </Link>
        </section>
      </div>
    </div>
  );
}
