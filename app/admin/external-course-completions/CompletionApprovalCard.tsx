'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, X, ExternalLink, Mail, Loader2,
  Send, FileText, AlertTriangle,
} from 'lucide-react';

interface Rec {
  id: string;
  user_id: string;
  certificate_url?: string | null;
  login_sent_at?: string | null;
  elevate_sponsored?: boolean;
  rejection_reason?: string | null;
  course: { id: string; title: string; partner_name: string; external_url: string };
  student: { full_name: string; email: string };
  program: { title: string; slug: string };
}

interface Props {
  rec: Rec;
  mode: 'approve' | 'send_login';
}

export default function CompletionApprovalCard({ rec, mode }: Props) {
  const router = useRouter();
  const [loginInstructions, setLoginInstructions] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function callApprove(action: string, extra: Record<string, string> = {}) {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/external-course-completions/${rec.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Request failed');
    }
    setSaving(false);
  }

  if (done) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-slate-900">{rec.student.full_name}</span>
            <a
              href={`mailto:${rec.student.email}`}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-blue-600"
            >
              <Mail className="w-3 h-3" /> {rec.student.email}
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div>
              <span className="text-slate-400 block">Course</span>
              <span className="font-medium text-slate-700">{rec.course.title}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Partner</span>
              <a
                href={rec.course.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {rec.course.partner_name} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <span className="text-slate-400 block">Program</span>
              <span className="font-medium text-slate-700">{rec.program.title}</span>
            </div>
          </div>

          {/* Certificate preview */}
          {mode === 'approve' && rec.certificate_url && (
            <a
              href={rec.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-800 border border-brand-blue-200 rounded-lg px-3 py-1.5 mb-3 transition"
            >
              <FileText className="w-4 h-4" /> View uploaded certificate
            </a>
          )}

          {error && (
            <p className="text-sm text-red-600 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}

          {/* Send login mode */}
          {mode === 'send_login' && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Login credentials to send to student
                <span className="text-slate-400 ml-1">(username, temp password, login URL)</span>
              </label>
              <textarea
                value={loginInstructions}
                onChange={e => setLoginInstructions(e.target.value)}
                rows={4}
                placeholder={`Username: student@email.com\nTemporary password: Abc12345!\nLogin at: https://careersafe.com/login`}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none mb-2"
              />
              <button
                onClick={() => callApprove('send_login', { login_instructions: loginInstructions })}
                disabled={saving || !loginInstructions.trim()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send login to student</>}
              </button>
            </div>
          )}

          {/* Approve / reject mode */}
          {mode === 'approve' && !showReject && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => callApprove('approve_credential')}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Approve</>}
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {/* Rejection form */}
          {mode === 'approve' && showReject && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Certificate is illegible — please resubmit a clearer photo"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => callApprove('reject_credential', { rejection_reason: rejectionReason })}
                  disabled={saving || !rejectionReason.trim()}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Send rejection'}
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
