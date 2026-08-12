'use client';

import { useEffect, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Clapperboard,
  Copy,
  GitCommitHorizontal,
  History,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Undo2,
  Video,
  XCircle,
} from 'lucide-react';

type Course = {
  id: string;
  title: string;
  slug: string;
  review_status?: string | null;
  status?: string | null;
  version?: number | null;
  published_at?: string | null;
  is_active?: boolean | null;
};
type VersionRow = {
  id: string;
  version: number;
  label: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  hasSnapshot: boolean;
};

type BusyAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'archive'
  | 'revert_to_draft'
  | 'publish'
  | 'clone'
  | 'enhance'
  | 'video_queue'
  | 'video_render'
  | `rollback:${number}`
  | '';

export default function CourseOperationsPanel({
  course,
  onChanged,
  onCourseCreated,
}: {
  course: Course;
  onChanged?: () => void | Promise<void>;
  onCourseCreated?: (courseId: string) => void | Promise<void>;
}) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [busy, setBusy] = useState<BusyAction>('');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [cloneTitle, setCloneTitle] = useState(`${course.title} (Copy)`);
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [queueEnhancedVideos, setQueueEnhancedVideos] = useState(false);

  useEffect(() => {
    setCloneTitle(`${course.title} (Copy)`);
    void loadVersions();
  }, [course.id, course.title]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVersions() {
    try {
      const response = await fetch(
        `/api/admin/course-builder/versions?courseId=${encodeURIComponent(course.id)}`,
        { cache: 'no-store' },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to load versions');
      setVersions(Array.isArray(body.versions) ? body.versions : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load versions');
    }
  }

  async function runReview(action: Exclude<BusyAction, '' | 'publish' | 'clone' | 'enhance' | 'video_queue' | 'video_render' | `rollback:${number}`>) {
    setBusy(action);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, action, notes: notes.trim() || undefined }),
      });
      const body = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(body.blockers) ? ` ${body.blockers.join(' ')}` : '';
        throw new Error(`${body.error || 'Review action failed'}${detail}`);
      }
      setMessage(`Review status changed to ${body.review_status}.`);
      setNotes('');
      await onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review action failed');
    } finally {
      setBusy('');
    }
  }

  async function publishVersion() {
    setBusy('publish');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, label: versionLabel.trim() || undefined }),
      });
      const body = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(body.blockers) ? ` ${body.blockers.join(' ')}` : '';
        throw new Error(`${body.error || 'Publish failed'}${detail}`);
      }
      setVersionLabel('');
      setMessage(`Published version ${body.version}.`);
      await Promise.all([loadVersions(), onChanged?.()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setBusy('');
    }
  }

  async function rollback(version: number) {
    if (!window.confirm(`Restore course authoring content from version ${version}? The course will return to draft and learner progress records will be preserved.`)) return;
    setBusy(`rollback:${version}`);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, version }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Rollback failed');
      setMessage(`Restored authoring content from version ${version}.`);
      await Promise.all([loadVersions(), onChanged?.()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Rollback failed');
    } finally {
      setBusy('');
    }
  }

  async function cloneCourse() {
    setBusy('clone');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, title: cloneTitle.trim() || undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Clone failed');
      setMessage(`Created draft copy: ${body.course?.title ?? body.course?.id}.`);
      if (body.course?.id) await onCourseCreated?.(body.course.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Clone failed');
    } finally {
      setBusy('');
    }
  }

  async function enhance() {
    setBusy('enhance');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          mode: 'missing-only',
          contentSource: enhanceWithAI ? 'ai' : 'blueprint',
          queueVideos: queueEnhancedVideos,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body.errors?.join('; ') || body.error || 'Enhancement failed');
      }
      setMessage(
        `Enhancement complete: ${body.lessonCount ?? 0} lesson(s) written, ${body.skippedCount ?? 0} existing lesson(s) preserved.`,
      );
      await onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Enhancement failed');
    } finally {
      setBusy('');
    }
  }

  async function queueVideos() {
    setBusy('video_queue');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/video-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, onlyMissing: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Video queue failed');
      setMessage(`Video queue: ${body.queued ?? 0} queued, ${body.skipped ?? 0} skipped, ${body.failed ?? 0} failed.`);
      await onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Video queue failed');
    } finally {
      setBusy('');
    }
  }

  async function renderVideos() {
    if (!window.confirm('Run the production ffmpeg/TTS/b-roll renderer for lessons that still need videos? This is the heavier render path.')) return;
    setBusy('video_render');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/video-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, force: false }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Production render failed');
      setMessage(`Production render: ${body.generated ?? 0} generated, ${body.failed ?? 0} failed.`);
      await onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Production render failed');
    } finally {
      setBusy('');
    }
  }

  const reviewStatus = course.review_status ?? 'draft';

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Lifecycle</div>
          <h2 className="mt-1 text-xl font-bold text-white">Review + controlled publish</h2>
          <p className="mt-1 text-sm text-slate-400">
            Current review state: <strong className="text-white">{reviewStatus}</strong> · course state:{' '}
            <strong className="text-white">{course.status ?? 'draft'}</strong> · version{' '}
            <strong className="text-white">{course.version ?? 1}</strong>
          </p>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Reviewer notes (optional)"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />

        <div className="flex flex-wrap gap-2">
          {['draft', 'rejected'].includes(reviewStatus) && (
            <ActionButton icon={Send} label="Submit for review" busy={busy === 'submit'} onClick={() => void runReview('submit')} />
          )}
          {reviewStatus === 'in_review' && (
            <>
              <ActionButton icon={CheckCircle2} label="Approve" busy={busy === 'approve'} onClick={() => void runReview('approve')} tone="success" />
              <ActionButton icon={XCircle} label="Reject" busy={busy === 'reject'} onClick={() => void runReview('reject')} tone="danger" />
              <ActionButton icon={Undo2} label="Return to draft" busy={busy === 'revert_to_draft'} onClick={() => void runReview('revert_to_draft')} />
            </>
          )}
          {reviewStatus === 'rejected' && (
            <ActionButton icon={Undo2} label="Return to draft" busy={busy === 'revert_to_draft'} onClick={() => void runReview('revert_to_draft')} />
          )}
          {reviewStatus !== 'archived' && (
            <ActionButton icon={Archive} label="Archive" busy={busy === 'archive'} onClick={() => void runReview('archive')} tone="danger" />
          )}
        </div>

        <div className="border-t border-slate-800 pt-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Version label</label>
          <div className="flex gap-2">
            <input
              value={versionLabel}
              onChange={(event) => setVersionLabel(event.target.value)}
              placeholder={`v${Number(course.version ?? 1) + 1} — release notes`}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <ActionButton
              icon={GitCommitHorizontal}
              label="Publish version"
              busy={busy === 'publish'}
              disabled={reviewStatus !== 'approved'}
              onClick={() => void publishVersion()}
              tone="success"
            />
          </div>
          {reviewStatus !== 'approved' && (
            <p className="mt-2 text-xs text-amber-300">Publishing is locked until the course passes readiness review and reaches Approved.</p>
          )}
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Factory operations</div>
          <h2 className="mt-1 text-xl font-bold text-white">Preserved authoring capabilities</h2>
          <p className="mt-1 text-sm text-slate-400">These actions operate on the selected canonical course. They do not create parallel legacy records.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold text-white">Enhance missing curriculum</h3>
          <p className="mt-1 text-xs text-slate-500">Loads the registered program blueprint and fills missing modules/lessons while preserving existing lesson slugs.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={enhanceWithAI} onChange={(event) => setEnhanceWithAI(event.target.checked)} />AI-enrich missing content</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={queueEnhancedVideos} onChange={(event) => setQueueEnhancedVideos(event.target.checked)} />Queue missing videos</label>
          </div>
          <ActionButton icon={Sparkles} label="Enhance missing" busy={busy === 'enhance'} onClick={() => void enhance()} className="mt-3" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold text-white">Clone course</h3>
          <p className="mt-1 text-xs text-slate-500">Copies modules, lessons, media references, compliance metadata, and assessments into a new unpublished draft.</p>
          <div className="mt-3 flex gap-2">
            <input value={cloneTitle} onChange={(event) => setCloneTitle(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <ActionButton icon={Copy} label="Clone" busy={busy === 'clone'} onClick={() => void cloneCourse()} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold text-white">Video production</h3>
          <p className="mt-1 text-xs text-slate-500">Queue missing videos for asynchronous generation, or explicitly run the heavier ffmpeg + TTS + b-roll production renderer.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton icon={Video} label="Queue missing videos" busy={busy === 'video_queue'} onClick={() => void queueVideos()} />
            <ActionButton icon={Clapperboard} label="Production render" busy={busy === 'video_render'} onClick={() => void renderVideos()} tone="warning" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400"><History className="h-4 w-4" />Version history</div>
            <p className="mt-1 text-sm text-slate-400">New publishes contain full course/module/lesson snapshots. Older rows without snapshots remain visible but cannot be fabricated into rollback data.</p>
          </div>
          <button onClick={() => void loadVersions()} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Version</th><th className="px-4 py-3">Label</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Snapshot</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {versions.map((version) => (
                <tr key={version.id} className="bg-slate-900">
                  <td className="px-4 py-3 font-bold text-white">v{version.version}</td>
                  <td className="px-4 py-3 text-slate-300">{version.label || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{version.publishedAt ? new Date(version.publishedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">{version.hasSnapshot ? <span className="text-green-300">Available</span> : <span className="text-amber-300">Legacy metadata only</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={!version.hasSnapshot || busy === `rollback:${version.version}`}
                      onClick={() => void rollback(version.version)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy === `rollback:${version.version}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Restore draft
                    </button>
                  </td>
                </tr>
              ))}
              {!versions.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No version history yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {message && <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 xl:col-span-2">{message}</div>}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  busy,
  disabled,
  onClick,
  tone = 'default',
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone?: 'default' | 'success' | 'danger' | 'warning';
  className?: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-green-600 hover:bg-green-500 text-white'
      : tone === 'danger'
        ? 'bg-red-700 hover:bg-red-600 text-white'
        : tone === 'warning'
          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950';
  return (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {busy ? 'Working…' : label}
    </button>
  );
}
