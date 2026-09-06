'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Award, BookOpen, Bot, Boxes, Loader2, RefreshCw, Sparkles, Video } from 'lucide-react';
import CourseInstructorMediaPanel from '@/components/admin/course-builder/CourseInstructorMediaPanel';
import CredentialRegistryPanel from '@/components/admin/course-builder/CredentialRegistryPanel';
import { runCourseFactoryPipeline } from '@/components/admin/course-builder/runCourseFactoryPipeline';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';

const AutomaticCourseBuilder = dynamic(() => import('@/components/course/AutomaticCourseBuilder'), {
  ssr: false,
});

type Tab = 'courses' | 'ai' | 'blueprints' | 'media' | 'registry';
type CourseRow = {
  id: string;
  title: string;
  slug: string;
  program_id?: string | null;
  status?: string;
  duration_hours?: number | null;
};
type ProgramRow = {
  id: string;
  title: string;
  status?: string | null;
  is_active?: boolean | null;
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
type CreditState = {
  operator?: boolean;
  metered?: boolean;
  credits?: { balance?: number };
};
type HealthState = {
  status: 'healthy' | 'degraded' | 'unavailable';
  checks: Array<{ name: string; passed: boolean; message: string }>;
  checkedAt: string;
};

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'ai', label: 'AI Generate', icon: Sparkles },
  { id: 'blueprints', label: 'Blueprints', icon: Boxes },
  { id: 'media', label: 'Video + Audio', icon: Video },
  { id: 'registry', label: 'Credential Registry', icon: Award },
];

export default function UnifiedCourseBuilder() {
  const [tab, setTab] = useState<Tab>('courses');
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [courseId, setCourseId] = useState('');
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [creditState, setCreditState] = useState<CreditState | null>(null);
  const [health, setHealth] = useState<HealthState | null>(null);

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
    fetch('/api/admin/dev-studio/programs', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setPrograms(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setPrograms([]));
    fetch('/api/admin/course-builder?action=credits', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setCreditState(data))
      .catch(() => setCreditState(null));
    fetch('/api/admin/courses/health', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setHealth(data?.checks ? data : null))
      .catch(() => setHealth(null));
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
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Build, review, govern, publish, and maintain complete courses from one authority.
            </p>
            {creditState ? (
              <p className="mt-2 text-sm font-bold text-amber-300">
                {creditState.operator
                  ? 'Platform operator workspace • usage metering exempt'
                  : `${Number(creditState.credits?.balance ?? 0).toLocaleString()} Course Builder credits available`}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadCourses()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {selectedCourse ? (
              <Link
                href={`/studio/courses/${selectedCourse.id}`}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400"
              >
                Open {selectedCourse.title}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-slate-800 bg-slate-950 px-4 py-3">
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
        {health ? (
          <section
            aria-label="Course Builder health"
            className={`mb-4 rounded-xl border p-4 ${health.status === 'healthy' ? 'border-emerald-700 bg-emerald-950/40' : 'border-amber-700 bg-amber-950/40'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-white">Course Builder health: {health.status}</h2>
              <span className="text-xs text-slate-400">Checked {new Date(health.checkedAt).toLocaleString()}</span>
            </div>
            <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {health.checks.map((check) => (
                <li key={check.name} className="rounded-lg bg-slate-950/60 p-3 text-sm">
                  <div className={check.passed ? 'font-bold text-emerald-300' : 'font-bold text-amber-300'}>
                    {check.passed ? 'Ready' : 'Needs attention'} · {check.name}
                  </div>
                  <p className="mt-1 text-slate-300">{check.message}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {tab === 'courses' && (
          <CourseCatalog
            courses={courses}
            programs={programs}
            onChanged={loadCourses}
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
        {tab === 'media' && <CourseInstructorMediaPanel courseId={courseId} />}
        {tab === 'registry' && <CredentialRegistryPanel course={selectedCourse} />}
      </main>
    </div>
  );
}

function CourseCatalog({
  courses,
  programs,
  onChanged,
  onCreated,
}: {
  courses: CourseRow[];
  programs: ProgramRow[];
  onChanged: () => void | Promise<void>;
  onCreated: (id: string) => void | Promise<void>;
}) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function mutate(course: CourseRow, action: 'clone' | 'publish' | 'unpublish' | 'delete') {
    if (action === 'delete' && !window.confirm(`Archive ${course.title}? You can restore it later.`)) return;
    setBusyId(course.id);
    setError('');
    try {
      const endpoint = action === 'clone'
        ? `/api/admin/courses/${course.id}/clone`
        : action === 'publish'
          ? '/api/admin/course-builder'
          : `/api/admin/courses/${course.id}`;
      const response = await fetch(endpoint, {
        method: action === 'delete' ? 'DELETE' : action === 'unpublish' ? 'PATCH' : 'POST',
        ...(action === 'publish'
          ? {
              headers: courseBuilderJsonHeaders(`course-publish:${course.id}`),
              body: JSON.stringify({ action: 'publish-persisted', courseId: course.id }),
            }
          : action === 'unpublish'
          ? {
              headers: courseBuilderJsonHeaders(`course-unpublish:${course.id}`),
              body: JSON.stringify({ status: 'draft', is_published: false }),
            }
          : {}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? `${action} failed`);
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${action} failed`);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-bold">Course applications</h2>
        <p className="mt-1 text-sm text-slate-400">
          Every course opens the same session, state provider, mutation layer and feature workspace.
        </p>
        {error ? <p role="alert" className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-xl border border-slate-700 bg-slate-950 p-4 hover:border-cyan-500"
            >
              <Link href={`/studio/courses/${course.id}`} className="font-bold text-white hover:text-cyan-300">{course.title}</Link>
              <div className="mt-1 text-xs text-slate-400">
                {course.status ?? 'draft'} · {course.duration_hours ?? '—'} hours
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <Link href={`/studio/courses/${course.id}`} className="rounded-md bg-cyan-500 px-2.5 py-1.5 text-slate-950">Open</Link>
                <button disabled={busyId === course.id} onClick={() => void mutate(course, course.status === 'published' ? 'unpublish' : 'publish')} className="rounded-md border border-slate-600 px-2.5 py-1.5 text-slate-200 disabled:opacity-50">
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button disabled={busyId === course.id} onClick={() => void mutate(course, 'clone')} className="rounded-md border border-slate-600 px-2.5 py-1.5 text-slate-200 disabled:opacity-50">Clone</button>
                <button disabled={busyId === course.id} onClick={() => void mutate(course, 'delete')} className="rounded-md border border-red-800 px-2.5 py-1.5 text-red-300 disabled:opacity-50">Archive</button>
              </div>
            </article>
          ))}
          {!courses.length && <p className="text-sm text-slate-400">No courses found.</p>}
        </div>
      </section>
      <CreateCoursePanel programs={programs} onCreated={onCreated} />
    </div>
  );
}

function CreateCoursePanel({
  programs,
  onCreated,
}: {
  programs: ProgramRow[];
  onCreated: (id: string) => void | Promise<void>;
}) {
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
        placeholder="Learner audience"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      />
      <select
        name="programId"
        required
        defaultValue=""
        aria-label="Canonical program"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      >
        <option value="" disabled>Select a canonical program</option>
        {programs
          .filter((program) => program.is_active !== false && program.status !== 'archived')
          .map((program) => (
            <option key={program.id} value={program.id}>{program.title}</option>
          ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="moduleCount"
          type="number"
          min={1}
          max={40}
          defaultValue={6}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <input
          name="lessonsPerModule"
          type="number"
          min={1}
          max={20}
          defaultValue={5}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {saving ? 'Building…' : 'Build complete course'}
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
  onGenerated: (courseId: string) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function generate(blueprint: BlueprintRow) {
    if (!selectedCourse?.program_id) {
      setError('Select a course linked to a canonical program before generating from a blueprint.');
      return;
    }
    setBusy(blueprint.id);
    setError('');
    try {
      const res = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('generate-from-blueprint'),
        body: JSON.stringify({
          action: 'generate-from-blueprint',
          blueprintId: blueprint.id,
          programId: selectedCourse.program_id,
          mode: 'refresh',
          contentSource: 'ai',
          videoMode: 'queue',
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.courseId)
        throw new Error(result.error || 'Blueprint generation failed');
      await onGenerated(result.courseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Blueprint generation failed');
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-bold">Credential blueprints</h2>
        <p className="mt-1 text-sm text-slate-400">
          Generate through the same Course Builder authority. Blueprints provide regulated
          structure; Course Factory fills governed course content and media.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {blueprints.map((blueprint) => (
          <div key={blueprint.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-cyan-400">
              {blueprint.state ?? 'General'}
            </div>
            <h3 className="mt-1 font-bold text-white">{blueprint.title}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {blueprint.modules} modules · {blueprint.lessons} lessons
            </p>
            <button
              type="button"
              onClick={() => void generate(blueprint)}
              disabled={busy === blueprint.id || !selectedCourse?.program_id}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {busy === blueprint.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate governed course
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
