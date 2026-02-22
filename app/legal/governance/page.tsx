export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, ChevronRight, Shield, Scale, BookOpen, ShoppingCart, Calculator, UserPlus, Building } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const metadata: Metadata = {
  title: 'Governance Documents | Elevate For Humanity',
  description: 'Authoritative governance documents for Elevate For Humanity platform operations, compliance, and standards.',
};


export default async function GovernanceIndexPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('legal_documents').select('*').limit(50);
const documents = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Governance" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Governance</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Governance Documents</h1>
          <p className="text-gray-300 max-w-2xl">Authoritative reference documents for Elevate For Humanity platform operations, compliance, and standards. These documents are audit-ready and serve as the single source of truth for all governance matters.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Document Set Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold">7</p>
            </div>
            <div>
              <p className="text-gray-500">Version</p>
              <p className="text-2xl font-bold">1.0</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-2xl font-bold">Jan 2025</p>
            </div>
            <div>
              <p className="text-gray-500">Review Cycle</p>
              <p className="text-2xl font-bold">Annual</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.id}
                href={doc.href}
                className="block bg-white rounded-lg border hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="p-6 flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${doc.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-gray-500">{doc.id}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
                    <p className="text-xs text-gray-500">Owner: {doc.owner}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Document Cross-References</h2>
          <p className="text-gray-600 text-sm mb-4">These documents are designed to work together as a complete governance framework. Key relationships:</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Platform Overview</strong> provides context for all other documents and defines the organizational structure.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Security Statement</strong> applies to all platform components described in LMS, Store, and Tax Operations documents.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Compliance Framework</strong> establishes regulatory requirements referenced by Tax Operations and Store documents.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>UX Standards</strong> defines accessibility and support standards that apply across all user-facing components.</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>For questions about these documents, contact: our contact form</p>
          <p className="mt-1">© 2025 Elevate For Humanity. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
