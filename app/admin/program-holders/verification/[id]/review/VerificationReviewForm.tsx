'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  XCircle,
  FileText,
  Download,
  Eye,
  AlertCircle,
  ArrowLeft,
CheckCircle, } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  uploaded_at: string;
  file_url: string;
}

interface VerificationHistory {
  id: string;
  decision: string;
  status: string;
  notes: string;
  reviewed_at: string;
  reviewed_by: string;
  created_at: string;
  verification_type: string;
  verified_by_user?: {
    first_name: string;
    last_name: string;
  };
}

interface VerificationReviewFormProps {
  holder: any;
  documents: Document[];
  banking: any;
  verificationHistory: VerificationHistory[];
  adminUserId: string;
}

export default function VerificationReviewForm({
  holder,
  documents,
  banking,
  verificationHistory,
  adminUserId,
}: VerificationReviewFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!decision) {
      setError('Please select approve or reject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Update program holder status
      const { error: updateError } = await supabase
        .from('program_holders')
        .update({
          verification_status: decision === 'approve' ? 'verified' : 'rejected',
          status: decision === 'approve' ? 'verified_no_students' : 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', holder.id);

      if (updateError) throw updateError;

      // Create verification record
      const { error: verificationError } = await supabase
        .from('program_holder_verification')
        .insert({
          program_holder_id: holder.user_id,
          verification_type: 'manual',
          status: decision === 'approve' ? 'verified' : 'failed',
          verified_at: new Date().toISOString(),
          verified_by: adminUserId,
          notes,
        });

      if (verificationError) throw verificationError;

      // Mark all documents as verified/rejected
      const { error: docsError } = await supabase
        .from('program_holder_documents')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: adminUserId,
          notes,
        })
        .eq('program_holder_id', holder.user_id);

      if (docsError) throw docsError;

      // Mark banking as verified if approved
      if (decision === 'approve' && banking) {
        await supabase
          .from('program_holder_banking')
          .update({
            verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('program_holder_id', holder.user_id);
      }

      // Email notification handled by trigger to program holder

      router.push('/admin/program-holders/verification');
      router.refresh();
    } catch (err: any) {
      setError((err as Error).message || 'Failed to process verification');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/admin/program-holders/verification"
            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Verifications
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Review Program Holder Application
          </h1>
          <p className="text-black mt-2">
            {holder.user?.first_name} {holder.user?.last_name} -{' '}
            {holder.user?.email}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                Applicant Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-black">Name</p>
                  <p className="font-medium">
                    {holder.user?.first_name} {holder.user?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Email</p>
                  <p className="font-medium">{holder.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Phone</p>
                  <p className="font-medium">{holder.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Organization</p>
                  <p className="font-medium">
                    {holder.organization_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Applied</p>
                  <p className="font-medium">
                    {new Date(holder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Status</p>
                  <span className="px-3 py-2 bg-brand-orange-100 text-brand-orange-800 text-sm font-medium rounded-full">
                    {holder.verification_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                Uploaded Documents
              </h2>
              {documents.length === 0 ? (
                <p className="text-black">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-black" />
                        <div>
                          <p className="font-medium text-black">
                            {doc.document_type
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-black">
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-black">
                            Uploaded:{' '}
                            {new Date(doc.uploaded_at).toLocaleDateString()}
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
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={`/api/admin/documents/${doc.id}/download`}
                          className="p-2 text-black hover:bg-gray-100 rounded"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Banking Information */}
            {banking && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">
                  Banking Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black">Account Holder</p>
                    <p className="font-medium">{banking.account_holder_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Bank Name</p>
                    <p className="font-medium">{banking.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Account Type</p>
                    <p className="font-medium capitalize">
                      {banking.account_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Routing Number</p>
                    <p className="font-medium">
                      ****{banking.routing_number?.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Account Number</p>
                    <p className="font-medium">
                      ****{banking.account_number?.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Verified</p>
                    <p className="font-medium">
                      {banking.verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Verification History */}
            {verificationHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">
                  Verification History
                </h2>
                <div className="space-y-3">
                  {verificationHistory.map((record: any) => (
                    <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-3 py-2 text-sm font-medium rounded-full ${
                            record.status === 'verified'
                              ? 'bg-brand-green-100 text-brand-green-800'
                              : 'bg-brand-red-100 text-brand-red-800'
                          }`}
                        >
                          {record.status}
                        </span>
                        <p className="text-sm text-black">
                          {new Date(record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-black">
                        Type: {record.verification_type}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-black mt-2">
                          Notes: {record.notes}
                        </p>
                      )}
                      {record.verified_by_user && (
                        <p className="text-xs text-black mt-1">
                          By: {record.verified_by_user.first_name}{' '}
                          {record.verified_by_user.last_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Decision Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-bold text-black mb-4">
                Verification Decision
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Decision Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setDecision('approve')}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                      decision === 'approve'
                        ? 'bg-brand-green-600 text-white'
                        : 'bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100'
                    }`}
                  >
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Approve & Verify
                  </button>

                  <button
                    onClick={() => setDecision('reject')}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                      decision === 'reject'
                        ? 'bg-brand-red-600 text-white'
                        : 'bg-brand-red-50 text-brand-red-700 hover:bg-brand-red-100'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Application
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Add any notes about this verification..."
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!decision || loading}
                  className="w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Submit Decision'}
                </button>

                {/* Checklist */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-black mb-3">
                    Verification Checklist
                  </h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Photo ID matches name</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>SSN card is valid</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Credentials are current</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Syllabus meets standards</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Banking info complete</span>
                    </label>
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      This decision will notify the program holder via email and
                      update their portal access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
