export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Shield, Scale, BookOpen, 
  CreditCard, Receipt, Users, Download, ExternalLink, Zap
} from 'lucide-react';
import { QuickSummary } from '@/app/governance/_content/QuickSummary';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const metadata: Metadata = {
  title: 'Authoritative Documents | Governance | Supersonic Fast Cash',
  description: 'The seven governing documents that define platform operations for Supersonic Fast Cash tax preparation and refund advance services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/authoritative-docs',
  },
  robots: {
    index: true,
    follow: true,
  },
};


const summaryBullets = [
  'Seven authoritative documents govern all platform operations',
  'Document #6 specifically covers tax preparation and refund advance operations',
  'All documents are designed to stand alone during diligence or regulatory review',
  'Website pages summarize; these documents govern',
];

export default async function SupersonicAuthoritativeDocsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('tax_returns').select('*').limit(50);
const documents = (dbRows as any[]) || [];

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Authoritative Docs" }]} />
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Authoritative Documentation Index
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            These seven documents define how the platform operates. They are designed to 
            stand alone during buyer review, regulatory review, or payment processor review.
          </p>
          <div className="mt-6 text-sm text-emerald-300">
            Version: 1.0 • Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Summary */}
        <QuickSummary
          title="Authoritative Documents"
          bullets={summaryBullets}
          elevateCanonicalPath="/governance/authoritative-docs"
          showSupersonicScope
        />

        {/* How to Use */}
        <section className="mb-12 bg-emerald-50 rounded-xl p-6 border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">How to Use This Index</h2>
          <ul className="space-y-2 text-slate-700">
            <li><strong>Tax Filers:</strong> Reference Document #6 for tax preparation and refund advance operations.</li>
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
                className={`border rounded-xl p-6 transition-colors ${
                  doc.highlight 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.highlight ? 'bg-emerald-200' : 'bg-brand-blue-100'
                  }`}>
                    <doc.icon className={`w-6 h-6 ${doc.highlight ? 'text-emerald-700' : 'text-brand-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-500">Document {doc.number}</span>
                      {doc.highlight && (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded font-medium">
                          Tax Operations
                        </span>
                      )}
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
                        className="inline-flex items-center gap-2 text-emerald-600 text-sm font-medium hover:text-emerald-700"
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Request Documents
          </Link>
        </section>
      </div>
    </div>
  );
}
