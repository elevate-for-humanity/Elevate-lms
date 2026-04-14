'use client';

/**
 * Instructor submission review page.
 *
 * Shows: competency_key, submission content, file attachments,
 * approve / reject / revision_requested actions, audit trail.
 *
 * Rules enforced:
 * - Rejection and revision_requested require a note.
 * - Audit trail fetched from competency_audit_log.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Clock,
  ClipboardList, FileText, ExternalLink, ShieldCheck, History,
} from 'lucide-react';

type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

interface CompetencyCheck {
  key: string;
  label: string;
  description: string;
  isCritical: boolean;
  requiresInstructorSignoff: boolean;
}

interface Submission {
  id: string;
  user_id: string;
  course_lesson_id: string;
  lesson_id: string | null;
  course_id: string;
  step_type: string;
  submission_text: string | null;
  file_urls: string[];
  status: SubmissionStatus;
  instructor_note: string | null;
  reviewed_at: string | null;
  competency_key: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
  course_lessons: { title: string; slug: string; competency_checks: CompetencyCheck[] | null } | null;
}

interface AuditEntry {
  id: string;
  action: string;
  note: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted:          'Submitted',
  under_review:       'Under Review',
  approved:           'Approved',
  rejected:           'Rejected',
  revision_requested: 'Revision Requested',
};

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  submitted:          'bg-blue-50 text-blue-700 border-blue-200',
  under_review:       'bg-amber-50 text-amber-700 border-amber-200',
  approved:           'bg-green-50 text-green-700 border-green-200',
  rejected:           'bg-red-50 text-red-700 border-red-200',
  revision_requested: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function SubmissionReviewPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const supabase = createClient();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: sub, error: subErr }, { data: audit }] = await Promise.all([
        supabase
          .from('step_submissions')
          .select(`
            id, user_id, course_lesson_id, lesson_id, course_id, step_type,
            submission_text, file_urls, status, instructor_note,
            reviewed_at, created_at, competency_key,
            profiles:user_id ( full_name, email ),
            course_lessons:course_lesson_id ( title, slug, competency_checks )
          `)
          .eq('id', submissionId)
          .single(),
        supabase
          .from('competency_audit_log')
          .select('id, action, note, created_at, actor:actor_id ( full_name, email )')
          .eq('submission_id', submissionId)
          .order('created_at', { ascending: false }),
      ]);

      if (subErr || !sub) {
        setError('Submission not found.');
      } else {
        setSubmission(sub as unknown as Submission);
        setNote(sub.instructor_note ?? '');
      }
      setAuditLog((audit ?? []) as unknown as AuditEntry[]);
      setLoading(false);
    }
    load();
  }, [submissionId]);

  async function applyDecision(newStatus: SubmissionStatus) {
    if (!submission) return;
    if ((newStatus === 'rejected' || newStatus === 'revision_requested') && !note.trim()) {
      setError('A note is required when rejecting or requesting revision.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/lms/submissions/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id, status: newStatus, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save decision.');
      } else {
        setSubmission(prev => prev ? { ...prev, status: newStatus, instructor_note: note } : prev);
        setSuccess(`Marked as "${STATUS_LABELS[newStatus]}".`);
        const { data: newAudit } = await supabase
          .from('competency_audit_log')
          .select('id, action, note, created_at, actor:actor_id ( full_name, email )')
          .eq('submission_id', submission.id)
          .order('created_at', { ascending: false });
        setAuditLog((newAudit ?? []) as unknown as AuditEntry[]);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-sm">
        Loading submission…
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Submission not found.</p>
          <Link href="/instructor/submissions" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Back to submissions
          </Link>
        </div>
      </div>
    );
  }

  const learnerName = submission.profiles?.full_name ?? submission.profiles?.email ?? submission.user_id;
  const lessonTitle = submission.course_lessons?.title ?? submission.course_lesson_id;
  const isResolved = submission.status === 'approved' || submission.status === 'rejected';
  const checks: CompetencyCheck[] = submission.course_lessons?.competency_checks ?? [];
  const matchedCheck = submission.competency_key ? checks.find(c => c.key === submission.competency_key) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/instructor/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            Submissions
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 truncate">{lessonTitle}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Meta */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                {lessonTitle}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Submitted by <span className="font-medium text-slate-700">{learnerName}</span>
                {' · '}<span className="capitalize">{submission.step_type}</span>
                {' · '}{new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[submission.status]}`}>
              {STATUS_LABELS[submission.status]}
            </span>
          </div>
        </div>

        {/* Competency check */}
        {submission.competency_key && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Competency Check:{' '}
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{submission.competency_key}</code>
                  {matchedCheck?.isCritical && (
                    <span className="ml-2 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">Critical</span>
                  )}
                </p>
                {matchedCheck && <p className="text-sm text-slate-600 mt-1">{matchedCheck.description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Submission text */}
        {submission.submission_text && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />Submission
            </h2>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{submission.submission_text}</div>
          </div>
        )}

        {/* Attachments */}
        {submission.file_urls?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Attachments</h2>
            <ul className="space-y-2">
              {submission.file_urls.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {url.split('/').pop() ?? `File ${i + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Instructor Decision</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note to learner
              {(submission.status === 'rejected' || submission.status === 'revision_requested')
                ? <span className="text-red-500 ml-1 font-normal">* required for rejection / revision</span>
                : <span className="text-slate-400 font-normal ml-1">(optional)</span>
              }
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={e => { setNote(e.target.value); setError(null); }}
              disabled={saving}
              placeholder="Feedback, corrections, or what needs to be redone…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:opacity-50"
            />
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {success && <p className="text-sm text-green-600 mb-3">{success}</p>}

          <div className="flex flex-wrap gap-3">
            {submission.status !== 'under_review' && (
              <button onClick={() => applyDecision('under_review')} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition disabled:opacity-50">
                <Clock className="w-4 h-4" />Under Review
              </button>
            )}
            <button onClick={() => applyDecision('revision_requested')} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition disabled:opacity-50">
              <RotateCcw className="w-4 h-4" />Request Revision
            </button>
            <button onClick={() => applyDecision('rejected')} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50">
              <XCircle className="w-4 h-4" />Reject
            </button>
            <button onClick={() => applyDecision('approved')} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50 ml-auto">
              <CheckCircle2 className="w-4 h-4" />{saving ? 'Saving…' : 'Approve'}
            </button>
          </div>

          {isResolved && submission.reviewed_at && (
            <p className="text-xs text-slate-400 mt-3">Reviewed {new Date(submission.reviewed_at).toLocaleString()}</p>
          )}
        </div>

        {/* Audit trail */}
        {auditLog.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4" />Audit Trail
            </h2>
            <ol className="space-y-3">
              {auditLog.map(entry => {
                const actor = entry.actor?.full_name ?? entry.actor?.email ?? 'Unknown';
                const color =
                  entry.action === 'approved'           ? 'text-green-700 bg-green-50 border-green-200' :
                  entry.action === 'rejected'           ? 'text-red-700 bg-red-50 border-red-200' :
                  entry.action === 'revision_requested' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                          'text-amber-700 bg-amber-50 border-amber-200';
                return (
                  <li key={entry.id} className="flex items-start gap-3 text-sm">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${color}`}>
                      {entry.action.replace('_', ' ')}
                    </span>
                    <div>
                      <span className="font-medium text-slate-700">{actor}</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      {entry.note && <p className="text-slate-600 mt-0.5 italic">&ldquo;{entry.note}&rdquo;</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

      </div>
    </div>
  );
}
