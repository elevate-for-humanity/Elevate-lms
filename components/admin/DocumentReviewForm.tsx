'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  XCircle,
  FileText,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface Props {
  document: any;
  adminId: string;
}

export function DocumentReviewForm({ document, adminId }: Props) {
  const router = useRouter();
  const [docUrl, setDocUrl] = useState(document.file_url);
  const [urlExpired, setUrlExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh URL before it expires (refresh at 45s of 60s TTL)
  useEffect(() => {
    if (!document.file_path) return;
    const timer = setTimeout(() => setUrlExpired(true), 45_000);
    return () => clearTimeout(timer);
  }, [document.file_path, docUrl]);

  const refreshUrl = useCallback(async () => {
    if (!document.file_path) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/admin/documents/signed-url?id=${encodeURIComponent(document.id)}`
      );
      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          setDocUrl(url);
          setUrlExpired(false);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [document.file_path]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : null,
          adminId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review document');
      }

      router.push('/admin/documents/review?success=true');
      router.refresh();
    } catch (err: any) {
      setError('Failed to review document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-brand-red-50 border-2 border-brand-red-600 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-brand-red-900">Error</h3>
            <p className="text-brand-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Document Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Document Information</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">File Name</p>
              <p className="font-semibold text-black">
                {document.file_name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">Document Type</p>
              <p className="font-semibold text-black">
                {document.document_type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">Uploaded By</p>
              <p className="font-semibold text-black">
                {document.profiles?.full_name || 'Unknown User'}
              </p>
              <p className="text-sm text-black">
                {document.profiles?.email} • {document.profiles?.role}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">Upload Date</p>
              <p className="font-semibold text-black">
                {new Date(document.created_at).toLocaleString('en-US')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">File Size</p>
              <p className="font-semibold text-black">
                {(document.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Document Preview</h2>
          {document.file_path && (
            <button
              onClick={refreshUrl}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition"
              aria-label="Refresh document URL"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
        {urlExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Document link may have expired.
            <button onClick={refreshUrl} className="underline font-medium">Click to refresh</button>
          </div>
        )}
        <div className="relative border rounded-lg overflow-hidden">
          {document.mime_type === 'application/pdf' ? (
            <iframe
              src={docUrl}
              className="w-full h-[600px]"
              title="Document Preview"
            />
          ) : (
            <div className="relative w-full min-h-[400px]">
              {docUrl && (
                <Image
                  src={docUrl}
                  alt="Document"
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              )}
            </div>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={async () => {
              await refreshUrl();
              if (docUrl) window.open(docUrl, '_blank', 'noopener,noreferrer');
            }}
            className="text-brand-blue-600 hover:underline font-semibold"
          >
            Open in New Tab →
          </button>
        </div>
      </div>

      {/* Review Actions */}
      {document.status === 'pending' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Review Decision</h2>

          <div className="space-y-4 mb-6">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                action === 'approve'
                  ? 'border-brand-green-600 bg-brand-green-50'
                  : 'border-slate-300 hover:border-brand-green-600'
              }`}
            >
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div className="text-left">
                <p
                  className={`font-bold ${action === 'approve' ? 'text-brand-green-900' : 'text-black'}`}
                >
                  Approve Document
                </p>
                <p
                  className={`text-sm ${action === 'approve' ? 'text-brand-green-700' : 'text-black'}`}
                >
                  Document meets requirements and is approved
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAction('reject')}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                action === 'reject'
                  ? 'border-brand-red-600 bg-brand-red-50'
                  : 'border-slate-300 hover:border-brand-red-600'
              }`}
            >
              <XCircle
                className={`w-6 h-6 ${action === 'reject' ? 'text-brand-red-600' : 'text-slate-400'}`}
              />
              <div className="text-left">
                <p
                  className={`font-bold ${action === 'reject' ? 'text-brand-red-900' : 'text-black'}`}
                >
                  Reject Document
                </p>
                <p
                  className={`text-sm ${action === 'reject' ? 'text-brand-red-700' : 'text-black'}`}
                >
                  Document does not meet requirements
                </p>
              </div>
            </button>
          </div>

          {action === 'reject' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows={4}
                placeholder="Explain why this document is being rejected..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 border-2 border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !action || (action === 'reject' && !rejectionReason)
              }
              className="px-8 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {document.status !== 'pending' && (
        <div
          className={`p-6 rounded-lg border-2 ${
            document.status === 'approved'
              ? 'bg-brand-green-50 border-brand-green-600'
              : 'bg-brand-red-50 border-brand-red-600'
          }`}
        >
          <h2 className="text-xl font-bold mb-2">
            {document.status === 'approved'
              ? 'Document Approved'
              : 'Document Rejected'}
          </h2>
          <p className="text-sm mb-4">
            Reviewed on {new Date(document.reviewed_at).toLocaleString('en-US')}
          </p>
          {document.rejection_reason && (
            <div className="p-4 bg-white rounded-lg border">
              <p className="text-sm font-semibold mb-1">Rejection Reason:</p>
              <p className="text-sm">{document.rejection_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
