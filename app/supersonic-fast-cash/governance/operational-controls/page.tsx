
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Settings, BookOpen, ShoppingCart, Code, Shield, Zap } from 'lucide-react';
import { QuickSummary } from '@/app/governance/_content/QuickSummary';

export const metadata: Metadata = {
  title: 'Operational Controls | Governance | Supersonic Fast Cash',
  description: 'How quality, integrity, and risk controls are enforced across the platform.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/operational-controls',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const contentControls = [
  'Broken links are audited and resolved',
  'Placeholder or mock content is not permitted in production-facing pages',
  'Public resource pages follow a standardized template and are reviewed before indexing',
  'Claims must be supported by authoritative documents',
];

const lmsControls = [
  'Visible courses must meet completeness standards (ownership, structure, content integrity, completion rules)',
  'Quarterly LMS audits validate course readiness and consistency',
  'Instructor assignments are tracked and verified',
  'Assessment and completion logic is tested before deployment',
];

const storeControls = [
  'Products must be clearly scoped, priced, and mapped to defined post-purchase behavior',
  'Quarterly Store audits validate checkout integrity and post-purchase experience',
  'Stripe product configuration follows metadata discipline',
  'Refund and dispute handling procedures are documented',
];

const deploymentChecks = [
  'Indexing/robots directives validation',
  'Canonical discipline enforcement',
  'Metadata completeness and uniqueness',
  'Sitemap and robots alignment',
  'Restricted route protection',
  'TypeScript type checking',
  'Linting and code quality',
];

const summaryBullets = [
  'Content integrity controls prevent broken links and placeholder content',
  'LMS and Store undergo quarterly audits',
  'CI/CD gates block non-compliant deployments',
  'Change management requires explicit review for sensitive changes',
];

export default function SupersonicOperationalControlsPage() {

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Operational Controls" }]} />
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
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 text-sm">Supersonic Fast Cash</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Operational Controls
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            This page summarizes how quality, integrity, and risk controls are enforced 
            across the platform.
          </p>
          <div className="mt-6 text-sm text-emerald-300">
            Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Summary */}
        <QuickSummary
          title="Operational Controls"
          bullets={summaryBullets}
          elevateCanonicalPath="/governance/operational-controls"
        />

        {/* Content Integrity */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Content Integrity Controls</h2>
          </div>
          <div className="space-y-3">
            {contentControls.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* LMS Controls */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">LMS Controls</h2>
          </div>
          <div className="space-y-3">
            {lmsControls.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Store Controls */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-brand-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Store Controls</h2>
          </div>
          <div className="space-y-3">
            {storeControls.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Deployment Controls */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-brand-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Deployment Controls</h2>
          </div>
          <p className="text-slate-700 mb-4">
            Deploys are gated by CI checks that validate:
          </p>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="grid md:grid-cols-2 gap-3">
              {deploymentChecks.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-600 text-sm mt-4">
            If any check fails, the deployment is blocked until issues are resolved.
          </p>
        </section>

        {/* Audit Schedule */}
        <section className="mb-12 bg-emerald-50 rounded-xl p-6 border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Audit Schedule</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-900">Weekly</p>
              <p className="text-slate-600 text-sm">Search Console coverage, index count verification, broken link checks</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Monthly</p>
              <p className="text-slate-600 text-sm">Full indexed page inventory, metadata audit, canonical verification</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Quarterly</p>
              <p className="text-slate-600 text-sm">LMS course audit, Store product audit, compliance language review</p>
            </div>
          </div>
        </section>

        {/* Change Management */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Change Management</h2>
          <p className="text-slate-700 mb-4">
            The following changes require explicit review and approval:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li>• Changing page intent or purpose</li>
            <li>• Changing page title or meta description</li>
            <li>• Changing index/noindex status</li>
            <li>• Adding new public routes</li>
            <li>• Removing disclosures or compliance language</li>
          </ul>
          <p className="text-slate-600 text-sm mt-4">
            Emergency fixes may be deployed but must be reviewed within 24 hours.
          </p>
        </section>

        {/* Related */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Related Documentation</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/governance/seo-indexing"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              SEO & Indexing
            </Link>
            <Link
              href="/governance/security"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Security & Data Protection
            </Link>
            <Link
              href="/governance/authoritative-docs"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Authoritative Documents
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
