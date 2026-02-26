export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { getAdminDocumentUrl } from '@/lib/admin/document-access';
import Link from 'next/link';
import { ArrowLeft, FileText, XCircle, AlertTriangle, Download, Upload, CheckCircle, Users, Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Eligibility | WIOA Admin',
  description: 'Verify WIOA participant eligibility.',
  robots: { index: false, follow: false },
};

export default async function WIOAVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return <div className="p-8 text-center text-brand-red-600">Access denied</div>;
  }

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const params = await searchParams;
  const participantId = params.id;

  // If no participant ID, show list of pending verifications
  if (!participantId) {
    const { data: pending } = await db
      .from('wioa_participants')
      .select('id, first_name, last_name, email, eligibility_status, created_at')
      .in('eligibility_status', ['pending', 'in_review'])
      .order('created_at', { ascending: true })
      .limit(50);

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin/wioa/eligibility" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Eligibility
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Verifications</h1>
          <p className="text-gray-600 mb-8">Select a participant to verify their WIOA eligibility.</p>

          {(!pending || pending.length === 0) ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-brand-green-400" />
              <p className="font-medium text-gray-900">All caught up</p>
              <p className="text-sm text-gray-500 mt-1">No pending verifications at this time.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {pending.map(p => (
                <Link
                  key={p.id}
                  href={`/admin/wioa/verify?id=${p.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                    <p className="text-sm text-gray-500">{p.email}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    {p.eligibility_status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Load specific participant
  const { data: participant } = await db
    .from('wioa_participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (!participant) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-gray-500">Participant not found.</p>
          <Link href="/admin/wioa/verify" className="text-brand-blue-600 hover:underline mt-2 inline-block">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  // Load documents for this participant
  const { data: documents } = await db
    .from('documents')
    .select('id, title, file_url, file_path, document_type, status, created_at')
    .eq('user_id', participant.user_id)
    .order('created_at', { ascending: false });

  // Generate signed URLs via centralized admin document access
  const docs = await Promise.all(
    (documents || []).map(async (doc) => {
      if (doc.file_path) {
        const url = await getAdminDocumentUrl({
          adminId: user.id,
          documentId: doc.id,
          context: 'wioa_verify',
        });
        return { ...doc, file_url: url || doc.file_url };
      }
      return doc;
    })
  );
  const address = participant.address as any;
  const missingDocs = docs.filter(d => d.status === 'missing' || !d.file_url);

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/funding-hero.jpg" alt="Funding administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/wioa/verify" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Verification List
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eligibility Verification</h1>
            <p className="text-gray-600">Review and verify WIOA eligibility for {participant.first_name} {participant.last_name}</p>
          </div>
          <div className="flex gap-3">
            <form action={`/api/admin/wioa/verify`} method="POST">
              <input type="hidden" name="participantId" value={participant.id} />
              <input type="hidden" name="action" value="deny" />
              <button type="submit" className="px-4 py-2 border border-brand-red-300 text-brand-red-600 rounded-lg hover:bg-brand-red-50 transition flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Deny
              </button>
            </form>
            <form action={`/api/admin/wioa/verify`} method="POST">
              <input type="hidden" name="participantId" value={participant.id} />
              <input type="hidden" name="action" value="approve" />
              <button type="submit" className="px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </form>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Applicant Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{participant.first_name} {participant.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{participant.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{participant.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {participant.date_of_birth
                      ? new Date(participant.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SSN</p>
                  <p className="font-medium text-gray-900">{participant.ssn_hash ? '***-**-****' : 'Not on file'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Funding Source</p>
                  <p className="font-medium text-gray-900">{participant.funding_source || 'WIOA'}</p>
                </div>
                {address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {[address.street, address.city, address.state, address.zip].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Eligibility Status</h2>
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  participant.eligibility_status === 'approved' ? 'bg-brand-green-100' :
                  participant.eligibility_status === 'denied' ? 'bg-brand-red-100' : 'bg-yellow-100'
                }`}>
                  {participant.eligibility_status === 'approved' && <CheckCircle className="w-5 h-5 text-brand-green-600" />}
                  {participant.eligibility_status === 'denied' && <XCircle className="w-5 h-5 text-brand-red-600" />}
                  {!['approved', 'denied'].includes(participant.eligibility_status) && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{participant.eligibility_status}</p>
                  {participant.eligibility_verified_at && (
                    <p className="text-sm text-gray-500">
                      Verified {new Date(participant.eligibility_verified_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{participant.notes || 'No notes yet.'}</p>
            </div>
          </div>

          {/* Sidebar: Documents */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Documents ({docs.length})</h3>
              {docs.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${doc.file_url ? 'text-brand-green-600' : 'text-brand-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.title || doc.document_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg">
                          <Download className="w-4 h-4 text-gray-500" />
                        </a>
                      ) : (
                        <span className="text-xs text-brand-red-500 font-medium">Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {missingDocs.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Action Required</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {missingDocs.length} document{missingDocs.length > 1 ? 's are' : ' is'} missing. Request from applicant before approval.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-1.5" />
                  <div>
                    <p className="text-gray-900">Application submitted</p>
                    <p className="text-gray-500">{new Date(participant.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                {participant.enrollment_date && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-brand-green-500 rounded-full mt-1.5" />
                    <div>
                      <p className="text-gray-900">Enrolled</p>
                      <p className="text-gray-500">{new Date(participant.enrollment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                )}
                {participant.exit_date && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5" />
                    <div>
                      <p className="text-gray-900">Exited</p>
                      <p className="text-gray-500">{new Date(participant.exit_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
