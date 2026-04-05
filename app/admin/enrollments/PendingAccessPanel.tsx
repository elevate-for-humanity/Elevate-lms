'use client';

import { useState } from 'react';
import {
  Clock, CheckCircle, User, Loader2, ChevronDown, ChevronUp,
  FileText, Eye, AlertCircle, ExternalLink,
} from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  title: string;
  file_name: string | null;
  mime_type: string | null;
  status: string | null;
  verification_status: string | null;
  signed_url: string | null;
  ocr_text: string | null;
  uploaded_at: string;
}

interface PendingEnrollment {
  id: string;
  user_id: string;
  program_slug: string | null;
  enrolled_at: string;
  payment_status: string;
  amount_paid_cents: number | null;
  profile: {
    full_name: string | null;
    email: string | null;
    onboarding_completed: boolean;
  } | null;
}

interface Props {
  enrollments: PendingEnrollment[];
}

export default function PendingAccessPanel({ enrollments }: Props) {
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [granting, setGranting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, Document[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null);
  const [expandedOcr, setExpandedOcr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleExpand(enrollmentId: string) {
    if (expanded === enrollmentId) { setExpanded(null); return; }
    setExpanded(enrollmentId);
    if (docs[enrollmentId]) return;
    setLoadingDocs(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}/documents`);
      const body = await res.json();
      setDocs(prev => ({ ...prev, [enrollmentId]: body.documents || [] }));
    } catch {
      setDocs(prev => ({ ...prev, [enrollmentId]: [] }));
    } finally {
      setLoadingDocs(null);
    }
  }

  async function grantAccess(enrollmentId: string) {
    setGranting(enrollmentId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}/grant-access`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to grant access');
      }
      setGranted(prev => new Set([...prev, enrollmentId]));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGranting(null);
    }
  }

  const pending = enrollments.filter(e => !granted.has(e.id));
  if (pending.length === 0) return null;

  return (
    <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <h2 className="font-bold text-gray-900">Pending Access — Action Required</h2>
          <p className="text-sm text-gray-500">
            {pending.length} student{pending.length !== 1 ? 's' : ''} waiting for LMS access. Review documents then grant access.
          </p>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {pending.map(e => {
          const name = e.profile?.full_name || 'Unknown';
          const email = e.profile?.email || '—';
          const program = e.program_slug?.replace(/-/g, ' ') || 'Unknown program';
          const paid = e.amount_paid_cents ? `$${(e.amount_paid_cents / 100).toFixed(0)}` : 'Paid';
          const onboarded = e.profile?.onboarding_completed;
          const enrolledDate = new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const isExpanded = expanded === e.id;
          const isGranting = granting === e.id;
          const isLoadingDocs = loadingDocs === e.id;
          const studentDocs = docs[e.id] || [];

          return (
            <div key={e.id}>
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-sm text-gray-500 truncate">{email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400 capitalize">{program}</span>
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{paid}</span>
                    <span className="text-xs text-gray-400">Enrolled {enrolledDate}</span>
                    {onboarded
                      ? <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Onboarding ✓</span>
                      : <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Onboarding pending</span>
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleExpand(e.id)}
                    aria-label="View documents"
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    {isLoadingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Docs
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => grantAccess(e.id)}
                    disabled={isGranting || !onboarded}
                    title={!onboarded ? 'Student must complete onboarding first' : 'Grant LMS access'}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {isGranting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Granting…</>
                      : <><CheckCircle className="w-4 h-4" /> Grant Access</>
                    }
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-5">
                  {isLoadingDocs ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
                    </div>
                  ) : studentDocs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {studentDocs.length} document{studentDocs.length !== 1 ? 's' : ''} uploaded
                      </p>
                      {studentDocs.map(doc => {
                        const isOcrExpanded = expandedOcr === doc.id;
                        const isImage = doc.mime_type?.startsWith('image/');
                        const isPdf = doc.mime_type === 'application/pdf';
                        return (
                          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate capitalize">
                                  {doc.title || doc.document_type?.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  doc.verification_status === 'verified' ? 'bg-green-50 text-green-700'
                                  : doc.verification_status === 'rejected' ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {doc.verification_status || doc.status || 'pending'}
                                </span>
                                {doc.signed_url && (
                                  <a href={doc.signed_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                    {isImage ? 'View' : isPdf ? 'Open PDF' : 'Download'}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {doc.ocr_text && (
                                  <button onClick={() => setExpandedOcr(isOcrExpanded ? null : doc.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                    {isOcrExpanded ? 'Hide text' : 'Read text'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {isImage && doc.signed_url && (
                              <div className="border-t border-gray-100 p-3 bg-gray-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={doc.signed_url} alt={doc.title || doc.document_type}
                                  className="max-h-64 rounded object-contain mx-auto" />
                              </div>
                            )}
                            {isOcrExpanded && doc.ocr_text && (
                              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">OCR Extracted Text</p>
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                                  {doc.ocr_text}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
