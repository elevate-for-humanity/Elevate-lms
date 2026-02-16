'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Upload, 
  
  AlertCircle, 
  Clock,
  ArrowRight,
  Loader2,
  X,
  Building2
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface DocumentRequirement {
  id: string;
  document_type: string;
  document_name: string;
  description: string;
  is_required: boolean;
  requires_expiration: boolean;
  uploaded: boolean;
  status: 'missing' | 'pending' | 'accepted' | 'rejected' | 'expired';
  document: {
    id: string;
    file_name: string;
    file_url: string;
    status: string;
    rejection_reason?: string;
    expires_at?: string;
  } | null;
}

export default function PartnerDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/partner/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      setAllComplete(data.allComplete || false);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(documentType: string, file: File, expiresAt?: string) {
    setUploading(documentType);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (expiresAt) formData.append('expiresAt', expiresAt);

      const res = await fetch('/api/partner/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh documents
      await fetchDocuments();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setUploading(null);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
      expired: 'bg-red-100 text-red-700',
      missing: 'bg-slate-100 text-slate-600',
    };
    return styles[status] || styles.missing;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  const requiredDocs = documents.filter(d => d.is_required);
  const completedDocs = requiredDocs.filter(d => d.status === 'accepted');
  const progress = requiredDocs.length > 0 ? Math.round((completedDocs.length / requiredDocs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Documents' }]} />
        </div>
      </div>
      
      <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-brand-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Required Documents</h1>
          <p className="text-slate-600">
            Upload the required documents to activate your partner account.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Document Completion</span>
            <span className="text-sm font-bold text-brand-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${allComplete ? 'bg-green-500' : 'bg-brand-blue-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {allComplete && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <p className="font-medium text-green-800">All documents accepted!</p>
                <p className="text-sm text-green-600">Your partner account is now active.</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className={`bg-white rounded-xl p-6 border ${
                doc.status === 'accepted' ? 'border-green-200' : 
                doc.status === 'rejected' ? 'border-red-200' : 
                'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {doc.document_name}
                      {doc.is_required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-slate-500">{doc.description}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(doc.status)}`}>
                  {doc.status === 'missing' ? 'Not Uploaded' : doc.status}
                </span>
              </div>

              {doc.document && doc.status === 'rejected' && doc.document.rejection_reason && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <strong>Rejection reason:</strong> {doc.document.rejection_reason}
                </div>
              )}

              {doc.document && doc.status === 'accepted' && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-green-700">{doc.document.file_name}</span>
                  <a 
                    href={doc.document.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline"
                  >
                    View
                  </a>
                </div>
              )}

              {/* Upload Section */}
              {(doc.status === 'missing' || doc.status === 'rejected' || doc.status === 'expired') && (
                <div className="mt-4">
                  <label className="block">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-blue-400 hover:bg-brand-blue-50 transition-colors">
                      {uploading === doc.document_type ? (
                        <div className="flex items-center gap-2 text-brand-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, JPEG, or PNG (max 10MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.document_type, file);
                      }}
                      disabled={uploading !== null}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          {allComplete ? (
            <Link
              href="/partner/dashboard"
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <p className="text-sm text-slate-500">
              Upload all required documents to access your partner dashboard.
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
