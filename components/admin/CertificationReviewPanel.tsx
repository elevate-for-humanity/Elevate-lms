'use client';

import { useState } from 'react';
import { 
  
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

interface Submission {
  id: string;
  certification_name: string;
  provider: string;
  user_id: string;
  program_id: string;
  status: 'pending_review' | 'approved' | 'rejected';
  certificate_url?: string;
  credential_number?: string;
  completion_date?: string;
  expiration_date?: string;
  created_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  profiles?: { id: string; full_name: string; email: string };
  programs?: { id: string; name: string };
}

interface CertificationReviewPanelProps {
  pendingSubmissions: Submission[];
  recentSubmissions: Submission[];
}

export function CertificationReviewPanel({ 
  pendingSubmissions: initialPending, 
  recentSubmissions: initialRecent 
}: CertificationReviewPanelProps) {
  const [pending, setPending] = useState(initialPending);
  const [recent, setRecent] = useState(initialRecent);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleApprove = async (submission: Submission) => {
    setProcessing(submission.id);
    
    try {
      const res = await fetch('/api/admin/certifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          action: 'approve',
          notes: reviewNotes[submission.id] || '',
        }),
      });

      if (res.ok) {
        // Move from pending to recent
        const updated = { ...submission, status: 'approved' as const, reviewed_at: new Date().toISOString() };
        setPending(prev => prev.filter(p => p.id !== submission.id));
        setRecent(prev => [updated, ...prev]);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (submission: Submission) => {
    if (!reviewNotes[submission.id]) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(submission.id);
    
    try {
      const res = await fetch('/api/admin/certifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          action: 'reject',
          notes: reviewNotes[submission.id],
        }),
      });

      if (res.ok) {
        const updated = { ...submission, status: 'rejected' as const, reviewed_at: new Date().toISOString() };
        setPending(prev => prev.filter(p => p.id !== submission.id));
        setRecent(prev => [updated, ...prev]);
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessing(null);
    }
  };

  const renderSubmission = (submission: Submission, showActions: boolean) => (
    <div key={submission.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
      >
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          {submission.status === 'approved' && <span className="text-slate-400 flex-shrink-0">•</span>}
          {submission.status === 'rejected' && <XCircle className="w-5 h-5 text-brand-red-600" />}
          {submission.status === 'pending_review' && <Clock className="w-5 h-5 text-amber-600" />}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900">{submission.certification_name}</h3>
            <p className="text-sm text-slate-500">
              {submission.profiles?.full_name || 'Unknown'} • {submission.provider}
            </p>
          </div>

          {/* Date */}
          <div className="text-right text-sm text-slate-500">
            <div>{new Date(submission.created_at).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="text-xs">{submission.programs?.name}</div>
          </div>

          {/* Expand */}
          {expandedId === submission.id ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expandedId === submission.id && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Student Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4" /> Student
              </h4>
              <p className="text-sm text-slate-600">{submission.profiles?.full_name}</p>
              <p className="text-sm text-slate-500">{submission.profiles?.email}</p>
            </div>

            {/* Certification Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Details
              </h4>
              {submission.credential_number && (
                <p className="text-sm text-slate-600">Credential #: {submission.credential_number}</p>
              )}
              {submission.completion_date && (
                <p className="text-sm text-slate-600">
                  Completed: {new Date(submission.completion_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {submission.expiration_date && (
                <p className="text-sm text-slate-600">
                  Expires: {new Date(submission.expiration_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Certificate Link */}
          {submission.certificate_url && (
            <div className="mb-4">
              <a
                href={submission.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Uploaded Certificate
              </a>
            </div>
          )}

          {/* Review Notes */}
          {showActions && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Review Notes {submission.status === 'pending_review' && '(required for rejection)'}
              </label>
              <textarea
                value={reviewNotes[submission.id] || ''}
                onChange={(e) => setReviewNotes(prev => ({ ...prev, [submission.id]: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                rows={3}
                placeholder="Add notes about this submission..."
              />
            </div>
          )}

          {/* Previous Notes */}
          {submission.reviewer_notes && (
            <div className="mb-4 bg-slate-100 rounded-lg p-3">
              <p className="text-sm text-slate-600">
                <strong>Review Notes:</strong> {submission.reviewer_notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && submission.status === 'pending_review' && (
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(submission)}
                disabled={processing === submission.id}
                className="flex-1 bg-brand-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="text-slate-400 flex-shrink-0">•</span>
                {processing === submission.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(submission)}
                disabled={processing === submission.id}
                className="flex-1 bg-brand-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {processing === submission.id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending Review ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'recent'
              ? 'bg-brand-blue-100 text-brand-blue-800'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Recent Activity ({recent.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <h3 className="font-medium text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-600">No certifications pending review.</p>
            </div>
          ) : (
            pending.map(submission => renderSubmission(submission, true))
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4">
          {recent.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-2">No recent activity</h3>
              <p className="text-slate-600">Reviewed certifications will appear here.</p>
            </div>
          ) : (
            recent.map(submission => renderSubmission(submission, false))
          )}
        </div>
      )}
    </div>
  );
}
