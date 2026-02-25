import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  FileText,
  Download,
  ExternalLink,
  FolderOpen,
  Search,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | FERPA Portal',
  description: 'Access FERPA policies, forms, and documentation.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface FerpaDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  file_url: string | null;
  version: string;
  is_public: boolean;
  created_at: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  consent_form: 'Consent Forms',
  release_form: 'Release Forms',
  policy: 'Policies',
  procedure: 'Procedures',
  template: 'Templates',
  training_material: 'Training Materials',
  audit_report: 'Audit Reports',
  other: 'Other Documents',
};

export default async function FerpaDocumentationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/ferpa/documentation');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff', 'student'];
  if (!profile || !allowedRoles.includes(profile.role)) redirect('/unauthorized');

  // Fetch documents based on role
  let query = db
    .from('ferpa_documents')
    .select('*')
    .eq('is_current', true)
    .order('document_type')
    .order('title');

  // Students can only see public documents
  if (profile.role === 'student') {
    query = query.eq('is_public', true);
  }

  const { data: documents } = await query;

  // Group documents by type
  const groupedDocs: Record<string, FerpaDocument[]> = {};
  (documents as FerpaDocument[] | null)?.forEach((doc) => {
    if (!groupedDocs[doc.document_type]) {
      groupedDocs[doc.document_type] = [];
    }
    groupedDocs[doc.document_type].push(doc);
  });

  // External resources
  const externalResources = [
    {
      title: 'U.S. Department of Education FERPA Page',
      url: 'https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html',
      description: 'Official FERPA guidance and regulations',
    },
    {
      title: 'FERPA General Guidance for Students',
      url: 'https://studentprivacy.ed.gov/ferpa',
      description: 'Student privacy rights under FERPA',
    },
    {
      title: 'Model Notification of Rights',
      url: 'https://studentprivacy.ed.gov/resources/ferpa-model-notification-rights',
      description: 'Template for annual FERPA notification',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Documentation</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              <p className="text-gray-600 mt-1">FERPA policies, forms, and resources</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Categories */}
        {Object.keys(groupedDocs).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedDocs).map(([type, docs]) => (
              <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-brand-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {DOCUMENT_TYPE_LABELS[type] || type}
                  </h2>
                  <span className="text-sm text-gray-500">({docs.length})</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {docs.map((doc) => (
                    <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.title}</h3>
                          {doc.description && (
                            <p className="text-sm text-gray-500">{doc.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Version {doc.version}</p>
                        </div>
                      </div>
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">No file</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents available</p>
          </div>
        )}

        {/* External Resources */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">External Resources</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {externalResources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 block"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{resource.title}</h3>
                  <p className="text-sm text-gray-500">{resource.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
