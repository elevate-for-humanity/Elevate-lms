'use client';

/**
 * Instructor submission review page.
 * Loads a single step_submissions row and lets the instructor approve,
 * reject, or request revision with an optional note.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Clock,
  ClipboardList, FileText, ExternalLink,
} from 'lucide-react';

type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

interface Submission {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  step_type: string;
  submission_text: string | null;
  file_urls: string[];
  status: SubmissionStatus;
  instructor_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
  curriculum_lessons: { lesson_title: string; lesson_slug: string } | null;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted:          'Submitted',
  under_review:       'Under Review',
  approved:           'Approved',
  rejected:           'Rejected',
  revision_requested: 'Revision Requested',
};

export default function SubmissionReviewPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('step_submissions')
        .select(`
          id, user_id, lesson_id, course_id, step_type,
          submission_text, file_urls, status, instructor_note,
          reviewed_at, created_at,
          profiles:user_id ( full_name, email ),
          curriculum_lessons:lesson_id ( lesson_title, lesson_slug )
        `)
        .eq('id', submissionId)
        .single();

      if (error || !data) {
        setError('Submission not found.');
      } else {
        setSubmission(data as unknown as Submission);
        setNote(data.instructor_note ?? '');
      }
      setLoading(false);
    }
    load();
  }, [submissionId]);

  async function applyDecision(newStatus: SubmissionStatus) {
    if (!submission) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('step_submissions')
      .update({
        status: newStatus,
        instructor_note: note || null,
        instructor_id: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (updateError) {
      setError('Failed to save decision. Please try again.');
    } else {
      setSubmission(prev => prev ? { ...prev, status: newStatus, instructor_note: note } : prev);
      setSuccess(`Marked as "${STATUS_LABELS[newStatus]}".`);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500 text-sm">
        Loading submission…
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Submission not found.</p>
          <Link href="/instructor/submissions" className="mt-3 inline-block text-sm text-brand-blue-600 hover:underline">
            Back to submissions
          </Link>
        </div>
      </div>
    );
  }

  const learnerName = submission.profiles?.full_name ?? submission.profiles?.email ?? submission.user_id;
  const lessonTitle = submission.curriculum_lessons?.lesson_title ?? submission.lesson_id;
  const isResolved = submission.status === 'approved' || submission.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/instructor/submissions"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Submissions
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 truncate">{lessonTitle}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Meta card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-blue-600" />
                {lessonTitle}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Submitted by <span className="font-medium text-slate-700">{learnerName}</span>
                {' · '}
                <span className="capitalize">{submission.step_type}</span>
                {' · '}
                {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${
              submission.status === 'approved'           ? 'bg-green-50 text-green-700 border-green-200' :
              submission.status === 'rejected'           ? 'bg-red-50 text-red-700 border-red-200' :
              submission.status === 'revision_requested' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              submission.status === 'under_review'       ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                           'bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200'
            }`}>
              {STATUS_LABELS[submission.status]}
            </span>
          </div>
        </div>

        {/* Submission content */}
        {submission.submission_text && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Submission
            </h2>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
              {submission.submission_text}
            </div>
          </div>
        )}

        {/* File attachments */}
        {submission.file_urls?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Attachments
            </h2>
            <ul className="space-y-2">
              {submission.file_urls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {url.split('/').pop() ?? `File ${i + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Review panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
            Instructor Review
          </h2>

          {/* Note */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note to learner <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={saving}
              placeholder="Feedback, corrections, or encouragement…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y disabled:opacity-50"
            />
          </div>

          {/* Alerts */}
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 mb-3">{success}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {submission.status !== 'under_review' && (
              <button
                onClick={() => applyDecision('under_review')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                Mark Under Review
              </button>
            )}

            <button
              onClick={() => applyDecision('revision_requested')}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Request Revision
            </button>

            <button
              onClick={() => applyDecision('rejected')}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>

            <button
              onClick={() => applyDecision('approved')}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white text-sm font-semibold transition disabled:opacity-50 ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Saving…' : 'Approve'}
            </button>
          </div>

          {isResolved && submission.reviewed_at && (
            <p className="text-xs text-slate-400 mt-3">
              Reviewed {new Date(submission.reviewed_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
