'use client';

import { useEffect, useState } from 'react';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';
import { Bot, Loader2, Mic2, PlayCircle, RefreshCw, Sparkles } from 'lucide-react';

type Instructor = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  voice: string;
  avatar: string;
  bio: string;
};

export default function CourseInstructorMediaPanel({ courseId }: { courseId: string }) {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    if (!courseId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(
        `/api/admin/course-builder?action=instructor-media&courseId=${encodeURIComponent(courseId)}`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load instructor');
      setInstructor(data.instructor);
      setCourseTitle(data.course.title);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load instructor');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function queueVideos() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('queue-media'),
        body: JSON.stringify({ action: 'queue-media', courseId, onlyMissing: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to queue videos');
      setMessage(
        `Queued ${data.result.queued} instructor-led lesson videos and ${data.result.microclipsQueued ?? 0} microclips. ${data.result.skipped} already complete or in progress.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to queue videos');
    } finally {
      setLoading(false);
    }
  }

  async function rebuildCourseMedia() {
    if (!courseId) return;
    setLoading(true);
    setMessage('Preparing course-specific scripts and visual scenes…');
    try {
      const repairResponse = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('repair'),
        body: JSON.stringify({ action: 'repair', courseId }),
      });
      const repairData = await repairResponse.json();
      if (!repairResponse.ok || !repairData.ok) {
        throw new Error(repairData.error || 'Unable to prepare course media');
      }

      setMessage('Course scripts are ready. Queueing replacement visual lessons…');
      const queueResponse = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('queue-media'),
        body: JSON.stringify({
          action: 'queue-media',
          courseId,
          onlyMissing: false,
          force: true,
        }),
      });
      const queueData = await queueResponse.json();
      if (!queueResponse.ok || !queueData.ok) {
        throw new Error(queueData.error || 'Unable to queue replacement videos');
      }
      setMessage(
        `Queued ${queueData.result.queued} replacement lesson videos and ${queueData.result.microclipsQueued ?? 0} visual microclips. Existing published files remain available until replacements pass processing.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to rebuild course media');
    } finally {
      setLoading(false);
    }
  }

  if (!courseId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        Select a course above to manage its instructor, narration and media.
      </div>
    );
  }

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-950 via-slate-950 to-violet-950 text-white shadow-xl">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative min-h-72 bg-cyan-950">
          {instructor?.avatar ? (
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Bot className="h-20 w-20 text-cyan-300" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 p-5 pt-16">
            <p className="font-black">{instructor?.name || 'Loading instructor…'}</p>
            <p className="text-sm text-cyan-200">{instructor?.title}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
            <Sparkles className="h-4 w-4" /> Course Builder AI Instructor
          </div>
          <h2 className="mt-2 text-2xl font-black">{courseTitle || 'Selected course'}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">{instructor?.bio}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <Mic2 className="h-5 w-5 text-amber-300" />
              <p className="mt-2 text-xs text-slate-300">Natural instructor voice</p>
              <p className="font-bold capitalize">{instructor?.voice || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <PlayCircle className="h-5 w-5 text-cyan-300" />
              <p className="mt-2 text-xs text-slate-300">Lesson delivery</p>
              <p className="font-bold">Avatar + narration</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <Bot className="h-5 w-5 text-violet-300" />
              <p className="mt-2 text-xs text-slate-300">Teaching mode</p>
              <p className="font-bold">Course-specific scripts</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={queueVideos}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PlayCircle className="h-5 w-5" />
              )}
              Generate missing instructor lessons
            </button>
            <button
              type="button"
              onClick={rebuildCourseMedia}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              Rebuild scripts + visual lessons
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 font-bold hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          {message ? (
            <p className="mt-4 rounded-lg bg-white/10 p-3 text-sm text-cyan-100">{message}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
