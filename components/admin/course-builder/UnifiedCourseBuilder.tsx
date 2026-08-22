'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookOpen, Bot, Boxes, Loader2, RefreshCw, Sparkles, Video } from 'lucide-react';
import CourseInstructorMediaPanel from '@/components/admin/course-builder/CourseInstructorMediaPanel';
import { runCourseFactoryPipeline } from '@/components/admin/course-builder/runCourseFactoryPipeline';

const AutomaticCourseBuilder = dynamic(() => import('@/components/course/AutomaticCourseBuilder'), {
  ssr: false,
});
const VideoStudio = dynamic(() => import('@/apps/admin/app/video-generator/VideoGeneratorClient'), {
  ssr: false,
});

type Tab = 'courses' | 'ai' | 'blueprints' | 'media';
type CourseRow = {
  id: string;
  title: string;
  slug: string;
  program_id?: string | null;
  status?: string;
  duration_hours?: number | null;
};
type BlueprintRow = {
  id: string;
  title: string;
  slug: string;
  state?: string | null;
  modules: number;
  lessons: number;
  status?: string;
};

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'ai', label: 'AI Generate', icon: Sparkles },
  { id: 'blueprints', label: 'Blueprints', icon: Boxes },
  { id: 'media', label: 'Video + Audio', icon: Video },
];

export default function UnifiedCourseBuilder() {
  const [tab, setTab] = useState<Tab>('courses');
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseId, setCourseId] = useState('');
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId],
  );

  async function loadCourses() {
    const res = await fetch('/api/admin/courses', { cache: 'no-store' });
    const data = await res.json().catch(() => []);
    const rows = Array.isArray(data) ? data : Array.isArray(data?.courses) ? data.courses : [];
    setCourses(rows);
    if (!courseId && rows[0]?.id) setCourseId(rows[0].id);
  }

  useEffect(() => {
    void loadCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab !== 'blueprints' || blueprints.length) return;
    fetch('/api/admin/course-builder?action=blueprints')
      .then((r) => r.json())
      .then((data) => setBlueprints(Array.isArray(data.blueprints) ? data.blueprints : []))
      .catch(() => setBlueprints([]));
  }, [tab, blueprints.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <Bot className="h-4 w-4" /> Unified Course Factory
            </div>
            <h1 className="mt-1 text-2xl font-black text-white">Course Builder</h1>
            <p className="text-sm text-slate-400">
              One authoring surface for curriculum, AI, blueprints, media, interactions, assessments
              and compliance.
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="min-h-10 min-w-[280px] rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="">Select a course…</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} — {course.status ?? 'draft'}
                </option>
              ))}
            </select>
            <button
              onClick={() => void loadCourses()}
              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
              title="Refresh courses"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {courseId && (
              <Link
                href={`/studio/courses/${courseId}`}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-cyan-400"
              >
                Open course application
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-slate-800 bg-slate-900/70 px-4 py-2">
        <div className="mx-auto flex max-w-[1600px] gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] p-4">
        {tab === 'courses' && (
          <CourseCatalog
            courses={courses}
            onCreated={async (id) => {
              await loadCourses();
              setCourseId(id);
            }}
          />
        )}

        {tab === 'ai' && (
          <div className="rounded-2xl bg-white p-6 text-slate-900">
            <AutomaticCourseBuilder />
          </div>
        )}
        {tab === 'blueprints' && (
          <BlueprintPanel
            blueprints={blueprints}
            selectedCourse={selectedCourse}
            onGenerated={async (id) => {
              await loadCourses();
              setCourseId(id);
              setTab('courses');
            }}
          />
        )}
        {tab === 'media' && (
          <>
            <CourseInstructorMediaPanel courseId={courseId} />
            <div className="overflow-hidden rounded-2xl bg-white text-slate-900">
              <VideoStudio />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CourseCatalog({
  courses,
  onCreated,
}: {
  courses: CourseRow[];
  onCreated: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-bold">Course applications</h2>
        <p className="mt-1 text-sm text-slate-400">
          Every course opens the same session, state provider, mutation layer and feature workspace.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/studio/courses/${course.id}`}
              className="rounded-xl border border-slate-700 bg-slate-950 p-4 hover:border-cyan-500"
            >
              <div className="font-bold text-white">{course.title}</div>
              <div className="mt-1 text-xs text-slate-400">
                {course.status ?? 'draft'} · {course.duration_hours ?? '—'} hours
              </div>
              <div className="mt-3 text-xs font-bold text-cyan-400">Open complete course →</div>
            </Link>
          ))}
          {!courses.length && <p className="text-sm text-slate-400">No courses found.</p>}
        </div>
      </section>
      <CreateCoursePanel onCreated={onCreated} />
    </div>
  );
}

function CreateCoursePanel({ onCreated }: { onCreated: (id: string) => void | Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const title = String(data.get('title') ?? '').trim();
      const topic = String(data.get('topic') ?? '').trim();
      const audience = String(data.get('audience') ?? '').trim();
      const programId = String(data.get('programId') ?? '').trim();
      const result = await runCourseFactoryPipeline({
        title,
        topic,
        audience,
        programId,
        difficulty: 'intermediate',
        moduleCount: Number(data.get('moduleCount') ?? 6),
        lessonsPerModule: Number(data.get('lessonsPerModule') ?? 5),
        includeVideos: true,
        dryRun: false,
      });
      if (!result.courseId) throw new Error('Course Factory completed without a course ID');
      await onCreated(result.courseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create course');
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
    >
      <h2 className="text-xl font-bold">Create course</h2>
      <input
        name="title"
        required
        placeholder="Course title"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      />
      <textarea
        name="topic"
        required
        rows={5}
        placeholder="Specific course scope, standards, credential domains, practical skills, and outcomes"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      />
      <input
        name="audience"
        required
        placeholder="Target learners and entry requirements"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      />
      <input
        name="programId"
        required
        placeholder="Canonical program UUID (required for standards and workforce evidence)"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="moduleCount"
          type="number"
          min={1}
          max={20}
          defaultValue={6}
          aria-label="Module count"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <input
          name="lessonsPerModule"
          type="number"
          min={1}
          max={20}
          defaultValue={5}
          aria-label="Lessons per module"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        disabled={saving}
        className="rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
      >
        {saving ? 'Running Course Factory…' : 'Build complete interactive course'}
      </button>
    </form>
  );
}

function BlueprintPanel({
  blueprints,
  selectedCourse,
  onGenerated,
}: {
  blueprints: BlueprintRow[];
  selectedCourse: CourseRow | null;
  onGenerated: (id: string) => void | Promise<void>;
}) {
  const [blueprintId, setBlueprintId] = useState('');
  const [programId, setProgramId] = useState(selectedCourse?.program_id ?? '');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');
  useEffect(() => {
    if (selectedCourse?.program_id) setProgramId(selectedCourse.program_id);
  }, [selectedCourse?.program_id]);
  async function generate() {
    if (!blueprintId || !programId) {
      setResult('Select a blueprint and enter the program UUID.');
      return;
    }
    setRunning(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-from-blueprint',
          blueprintId,
          programId,
          mode: 'refresh',
          contentSource: 'ai',
          videoMode: 'queue',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error((data.errors ?? [data.error ?? 'Generation failed']).join('; '));
      setResult(`Generated ${data.moduleCount ?? 0} modules and ${data.lessonCount ?? 0} lessons.`);
      if (data.courseId) await onGenerated(data.courseId);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setRunning(false);
    }
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-bold">Blueprint library</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {blueprints.map((bp) => (
            <button
              key={bp.id}
              onClick={() => setBlueprintId(bp.id)}
              className={`rounded-xl border p-4 text-left ${blueprintId === bp.id ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}
            >
              <div className="font-bold">{bp.title}</div>
              <div className="mt-1 text-xs text-slate-400">
                {bp.state ?? 'Multi-state'} · {bp.modules} modules · {bp.lessons} lessons
              </div>
              <div className="mt-2 font-mono text-[11px] text-slate-500">{bp.id}</div>
            </button>
          ))}
        </div>
      </div>
      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="font-bold">Build from blueprint</h3>
        <input
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          placeholder="Program UUID"
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <button
          onClick={generate}
          disabled={running || !blueprintId}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate + enrich + media
        </button>
        {result && <p className="mt-3 text-sm text-slate-300">{result}</p>}
      </aside>
    </div>
  );
}
