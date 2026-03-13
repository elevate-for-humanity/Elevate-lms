import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  XCircle,
  Clock,
  FileText,
  Download,
  Eye,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Program Holder Verification | Admin',
  description: 'Review and verify program holder documents',
};

export default async function ProgramHolderVerificationPage() {
  const { user, profile } = await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get pending verifications
  const { data: pendingHolders } = await db
    .from('program_holders')
    .select(
      `
      *,
      user:profiles!user_id(
        id,
        email,
        first_name,
        last_name
      )
    `
    )
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });

  // Get documents for each holder
  const holdersWithDocs = await Promise.all(
    (pendingHolders || []).map(async (holder) => {
      const { data: documents } = await db
        .from('program_holder_documents')
        .select('*')
        .eq('program_holder_id', holder.user_id)
        .order('uploaded_at', { ascending: false });

      const { data: banking } = await db
        .from('program_holder_banking')
        .select('*')
        .eq('program_holder_id', holder.user_id)
        .single();

      return {
        ...holder,
        documents: documents || [],
        banking,
      };
    })
  );

  // Get recently verified
  const { data: recentlyVerified } = await db
    .from('program_holders')
    .select(
      `
      *,
      user:profiles!user_id(
        id,
        email,
        first_name,
        last_name
      )
    `
    )
    .in('verification_status', ['verified', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Verification" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-black">
            Program Holder Verification
          </h1>
          <p className="text-black mt-2">
            Review and verify program holder documents and information
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Pending Review</p>
                <p className="text-3xl font-bold text-brand-orange-600">
                  {holdersWithDocs.length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-brand-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Verified Today</p>
                <p className="text-3xl font-bold text-brand-green-600">
                  {
                    recentlyVerified?.filter(
                      (h) =>
                        h.verification_status === 'verified' &&
                        new Date(h.updated_at).toDateString() ===
                          new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Rejected</p>
                <p className="text-3xl font-bold text-brand-red-600">
                  {
                    recentlyVerified?.filter(
                      (h) => h.verification_status === 'rejected'
                    ).length
                  }
                </p>
              </div>
              <XCircle className="w-12 h-12 text-brand-red-600" />
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-black">
              Pending Verifications
            </h2>
          </div>

          {holdersWithDocs.length === 0 ? (
            <div className="px-6 py-12 text-center text-black">
              <Clock className="w-16 h-16 mx-auto mb-4 text-black" />
              <p>No pending verifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {holdersWithDocs.map((holder) => (
                <div key={holder.id} className="px-6 py-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-black">
                        {holder.user?.first_name} {holder.user?.last_name}
                      </h3>
                      <p className="text-sm text-black">
                        {holder.user?.email}
                      </p>
                      <p className="text-sm text-black mt-1">
                        Organization: {holder.organization_name || 'N/A'}
                      </p>
                      <p className="text-xs text-black mt-1">
                        Applied:{' '}
                        {new Date(holder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-2 bg-brand-orange-100 text-brand-orange-800 text-sm font-medium rounded-full">
                      Pending Review
                    </span>
                  </div>

                  {/* Documents */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-black mb-2">
                      Uploaded Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {holder.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-black" />
                            <div>
                              <p className="text-sm font-medium text-black">
                                {doc.document_type
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <p className="text-xs text-black">
                                {doc.file_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`/api/admin/documents/${doc.id}/view`}
                              target="_blank"
                              className="p-2 text-brand-blue-600 hover:bg-gray-50 rounded"
                              rel="noreferrer"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={`/api/admin/documents/${doc.id}/download`}
                              className="p-2 text-black hover:bg-gray-100 rounded"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Banking Info */}
                  {holder.banking && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black mb-2">
                        Banking Information
                      </h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-black">Account Holder</p>
                            <p className="font-medium">
                              {holder.banking.account_holder_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-black">Bank</p>
                            <p className="font-medium">
                              {holder.banking.bank_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-black">Account Type</p>
                            <p className="font-medium capitalize">
                              {holder.banking.account_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-black">Routing Number</p>
                            <p className="font-medium">
                              ****{holder.banking.routing_number?.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/program-holders/verification/${holder.id}/review`}
                      className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-center font-medium"
                    >
                      Review & Verify
                    </Link>
                    <Link
                      href={`/admin/program-holders/${holder.id}`}
                      className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Verified */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-black">
              Recently Verified
            </h2>
          </div>

          {recentlyVerified && recentlyVerified.length > 0 ? (
            <div className="divide-y">
              {recentlyVerified.map((holder) => (
                <div
                  key={holder.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-black">
                      {holder.user?.first_name} {holder.user?.last_name}
                    </p>
                    <p className="text-sm text-black">
                      {holder.user?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-2 text-sm font-medium rounded-full ${
                        holder.verification_status === 'verified'
                          ? 'bg-brand-green-100 text-brand-green-800'
                          : 'bg-brand-red-100 text-brand-red-800'
                      }`}
                    >
                      {holder.verification_status === 'verified'
                        ? 'Verified'
                        : 'Rejected'}
                    </span>
                    <Link
                      href={`/admin/program-holders/${holder.id}`}
                      className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-black">
              <p>No recent verifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
