import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, CheckCircle, XCircle, Shield, Code } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'SEO & Indexing Governance | Elevate for Humanity',
  description: 'How search engine indexing is controlled and enforced to protect platform credibility and prevent accidental exposure.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/seo-indexing',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const allowedContent = [
  'Public, stable, evergreen pages that are complete and aligned with authoritative documents',
  'Approved resource pages listed in the Resource Index',
  'Marketing and informational pages',
  'Program overviews (not course content)',
  'Governance and transparency documents',
];

const neverIndexed = [
  'Authentication pages (/auth/*, /login, /signup)',
  'Dashboards and admin routes (/dashboard/*, /admin/*)',
  'Checkout flows and success/cancel routes (/checkout/*)',
  'Personalized or dynamic pages',
  'URLs with query parameters',
  'LMS lesson content and assessments',
  'API routes',
];

const enforcementMethods = [
  {
    title: 'Whitelist Control',
    description: 'A JSON whitelist defines the only URLs allowed to be indexed. Pages not on the list default to noindex.',
  },
  {
    title: 'CI/CD Gates',
    description: 'Continuous Integration checks fail builds if indexing rules are violated. Non-compliant changes cannot be deployed.',
  },
  {
    title: 'Pull Request Checklists',
    description: 'Every PR that affects public pages requires explicit acknowledgment of SEO governance rules.',
  },
  {
    title: 'Canonical Enforcement',
    description: 'All indexed pages must have self-referencing canonical URLs pointing to the production domain.',
  },
];

export default function SeoIndexingPage() {
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
          { label: 'SEO & Indexing' },
        ]}
      />
      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8 text-brand-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            SEO & Indexing Governance
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Indexing is governed deliberately to protect platform credibility and prevent 
            accidental exposure of restricted flows.
          </p>
          <div className="mt-6 text-sm text-slate-400">
            Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Core Rule */}
        <section className="mb-12 bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Core Rule</h2>
          <p className="text-lg text-slate-800 font-medium mb-4">
            Publishing is not the same as indexing.
          </p>
          <p className="text-slate-700">
            Public pages default to <code className="bg-slate-200 px-2 py-0.5 rounded text-sm">noindex</code> unless 
            explicitly approved. Indexing is a governance decision, not a content decision.
          </p>
        </section>

        {/* What Is Allowed */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What Is Allowed to Be Indexed</h2>
          <div className="space-y-3">
            {allowedContent.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* What Is Never Indexed */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What Is Never Indexed</h2>
          <div className="space-y-3">
            {neverIndexed.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Enforcement */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Enforcement</h2>
          <p className="text-slate-700 mb-6">
            Indexing rules are enforced through multiple layers of control:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {enforcementMethods.map((method, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Code className="w-4 h-4 text-brand-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{method.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{method.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Details */}
        <section className="mb-12 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Technical Implementation</h2>
          <div className="space-y-4 text-slate-700">
            <p>
              <strong>Default robots directive:</strong>
            </p>
            <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<meta name="robots" content="noindex, follow">`}
            </pre>
            <p>
              <strong>Indexed page directive:</strong>
            </p>
            <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.elevateforhumanity.org/page-path">`}
            </pre>
            <p className="text-sm text-slate-600 mt-4">
              See <code className="bg-slate-200 px-2 py-0.5 rounded">config/seo-index-whitelist.json</code> for 
              the complete list of approved indexed pages.
            </p>
          </div>
        </section>

        {/* Monitoring */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Monitoring</h2>
          <div className="space-y-4 text-slate-700">
            <p><strong>Weekly:</strong> Search Console coverage scan, index count vs sitemap audit</p>
            <p><strong>Monthly:</strong> Full indexed page inventory, thin content check, canonical audit</p>
            <p><strong>Response protocol:</strong> If an issue is detected, apply noindex immediately, then investigate and fix.</p>
          </div>
        </section>

        {/* Related */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Related Documentation</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/governance/operational-controls"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Operational Controls
            </Link>
            <Link
              href="/governance/authoritative-docs"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Authoritative Documents
            </Link>
            <Link
              href="/resources"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Resource Library
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
