'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

type LessonReview = {
  id: string;
  title: string;
  slug: string;
  lesson_type?: string | null;
  order_index?: number | null;
  approved: boolean;
  has_content: boolean;
  has_objectives: boolean;
  has_passing_score: boolean;
  has_video: boolean;
};

export default function CourseLessonReviewPanel({ courseId, onChanged }: { courseId: string; onChanged?: () => void | Promise<void> }) {
  const [lessons, setLessons] = useState<LessonReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/course-builder/lesson-review?courseId=${encodeURIComponent(courseId)}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Lesson review status failed');
      setLessons(Array.isArray(body.lessons) ? body.lessons : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lesson review status failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const approvedCount = useMemo(() => lessons.filter((lesson) => lesson.approved).length, [lessons]);
  const percent = lessons.length ? Math.round((approvedCount / lessons.length) * 100) : 0;

  async function setApproval(lesson: LessonReview, approved: boolean) {
    setBusyId(lesson.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/lesson-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonId: lesson.id, approved }),
      });
      const body = await response.json();
      if (!response.ok) {
        const details = Array.isArray(body.blockers) ? ` ${body.blockers.join(' ')}` : '';
        throw new Error(`${body.error || 'Lesson review update failed'}${details}`);
      }
      setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, approved } : item));
      await onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lesson review update failed');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400"><ShieldCheck className="h-4 w-4" />Lesson review</div>
          <h2 className="mt-1 text-xl font-bold text-white">Instructional approval gate</h2>
          <p className="mt-1 text-sm text-slate-400">Each lesson must contain reviewable content/objectives and each assessment must have a passing score before it can be approved.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-300">Approval progress</span><span className="text-slate-400">{approvedCount}/{lessons.length} · {percent}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${percent}%` }} /></div>
      </div>

      {message && <div className="mt-4 rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">{message}</div>}

      <div className="mt-5 max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {lessons.map((lesson) => {
          const structurallyReady = lesson.has_content && lesson.has_objectives && lesson.has_passing_score;
          return (
            <div key={lesson.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {lesson.approved ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" /> : <Circle className="h-4 w-4 shrink-0 text-slate-600" />}
                  <span className="truncate font-semibold text-white">{lesson.title}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">{lesson.lesson_type || 'lesson'}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <Badge ok={lesson.has_content} label="content" />
                  <Badge ok={lesson.has_objectives} label="objectives" />
                  <Badge ok={lesson.has_passing_score} label="passing score" />
                  <Badge ok={lesson.has_video} label="video" optional />
                </div>
              </div>
              <button
                disabled={busyId === lesson.id || (!lesson.approved && !structurallyReady)}
                onClick={() => void setApproval(lesson, !lesson.approved)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${lesson.approved ? 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-green-600 text-white hover:bg-green-500'}`}
              >
                {busyId === lesson.id ? 'Saving…' : lesson.approved ? 'Revoke approval' : 'Approve lesson'}
              </button>
            </div>
          );
        })}
        {!lessons.length && !loading && <p className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">No lessons found for this course.</p>}
      </div>
    </section>
  );
}

function Badge({ ok, label, optional = false }: { ok: boolean; label: string; optional?: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 ${ok ? 'bg-green-950 text-green-300' : optional ? 'bg-slate-800 text-slate-500' : 'bg-red-950 text-red-300'}`}>{ok ? '✓' : optional ? '○' : '✕'} {label}</span>;
}
