import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Upload } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Documents | Apprentice Portal',
  description: 'Access your apprenticeship documents and forms.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/documents');
  }

  // Use admin client for all data reads to bypass RLS
  const admin = await requireAdminClient();

  // Get apprentice profile
  const { data: apprentice } = await admin
    .from('apprentices')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get documents by user_id
  const { data: documents } = await admin
    .from('documents')
    .select('id, name, document_type, status, verification_status, file_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get required forms
  const { data: requiredForms } = await admin
    .from('apprentice_forms')
    .select('*')
    .eq('program_id', apprentice?.program_id)
    .eq('is_required', true);

  const displayDocuments = documents ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[{ label: 'Apprentice Portal', href: '/apprentice' }, { label: 'Documents' }]}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-slate-700">Access your apprenticeship documents and forms</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Document Upload Instructions</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Required Documents:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Government-issued ID (driver's license, passport, or state ID)</li>
              <li>Social Security Card or official SSN document</li>
              <li>High school diploma or GED certificate</li>
              <li>Employment verification letter from host shop</li>
              <li> Signed apprenticeship agreement</li>
            </ul>
            <p className="mt-3"><strong>Upload Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Accepted formats: PDF, JPG, PNG (max 10MB per file)</li>
              <li>Ensure documents are clear and readable</li>
              <li>Documents will be verified within 3-5 business days</li>
              <li>Click "Upload Document" to add new files</li>
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Documents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">My Documents</h2>
              </div>
              {displayDocuments.length > 0 ? (
                <div className="divide-y">
                  {displayDocuments.map((doc: any) => {
                    const label = (doc.name || doc.document_type || 'Document')
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c: string) => c.toUpperCase());
                    const statusColor =
                      doc.status === 'approved' ? 'text-brand-green-600' :
                      doc.status === 'rejected' ? 'text-red-600' : 'text-amber-600';
                    return (
                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <FileText className="w-9 h-9 text-brand-blue-500 shrink-0" />
                          <div>
                            <h3 className="font-medium text-slate-900">{label}</h3>
                            <p className="text-sm text-slate-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                              {doc.status && (
                                <span className={`ml-2 font-medium capitalize ${statusColor}`}>
                                  · {doc.status}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No documents uploaded yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Use the Upload button to add your photo ID, proof of residency, or other required documents.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Documents Instructions */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Required Documents</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <div>
                    <p className="font-medium text-blue-900">Photo ID</p>
                    <p className="text-blue-700 text-xs mt-0.5">Drivers license, state ID, or passport</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <div>
                    <p className="font-medium text-blue-900">Proof of Residency</p>
                    <p className="text-blue-700 text-xs mt-0.5">Recent utility bill or lease (within 60 days)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <div>
                    <p className="font-medium text-blue-900">High School Diploma/GED</p>
                    <p className="text-blue-700 text-xs mt-0.5">Copy of diploma, transcript, or GED</p>
                  </div>
                </div>
                <p className="text-blue-600 text-xs mt-2 pt-2 border-t border-blue-100">Accepted: PDF, JPG, PNG (max 10MB)</p>
              </div>
            </div>

            {/* Required Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Required Forms</h3>
              {requiredForms && requiredForms.length > 0 ? (
                <ul className="space-y-3">
                  {requiredForms.map((form: any) => (
                    <li key={form.id}>
                      <a
                        href={form.url || '#'}
                        className="flex items-center gap-2 text-brand-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        {form.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-700 text-sm">No forms available yet.</p>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/apprentice/handbook" className="text-brand-blue-600 hover:underline">
                    Apprentice Handbook
                  </Link>
                </li>
                <li>
                  <Link href="/apprentice/hours" className="text-brand-blue-600 hover:underline">
                    Log Hours
                  </Link>
                </li>
                <li>
                  <Link
                    href="/apprentice/transfer-hours"
                    className="text-brand-blue-600 hover:underline"
                  >
                    Transfer Hours
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
