'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Award, BookOpen, Bot, Boxes, Loader2, RefreshCw, ShieldCheck, Sparkles, Video } from 'lucide-react';
import CourseInstructorMediaPanel from '@/components/admin/course-builder/CourseInstructorMediaPanel';
import CourseLifecycleWorkspace from '@/components/admin/course-builder/CourseLifecycleWorkspace';
import CredentialRegistryPanel from '@/components/admin/course-builder/CredentialRegistryPanel';
import CoursePipelineDiagram from '@/components/admin/course-builder/CoursePipelineDiagram';
import { runCourseFactoryPipeline } from '@/components/admin/course-builder/runCourseFactoryPipeline';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';
import { CourseProvider } from '@/components/studio/CourseProvider';
import { CourseStudioApplication } from '@/components/studio/CourseStudioApplication';
import { StudioWorkspace } from '@/components/studio/StudioWorkspace';
import type { CourseSession } from '@/lib/studio/course-session';

const AutomaticCourseBuilder = dynamic(() => import('@/components/course/AutomaticCourseBuilder'), {
  ssr: false,
});

type Tab = 'courses' | 'workspace' | 'ai' | 'blueprints' | 'media' | 'monitor' | 'governance' | 'registry';
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
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    issues?: Array<{ courseId: string; title: string; slug: string; issues: string[] }>;
    state?: 'ready' | 'paused' | 'attention';
  }>;
  checkedAt: string;
};

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'workspace', label: 'Build · Lessons · LMS Browser', icon: Boxes },
  { id: 'ai', label: 'Talk to Course Builder', icon: Sparkles },
  { id: 'blueprints', label: 'Blueprints', icon: Boxes },
  { id: 'media', label: 'Media Library', icon: Video },
  { id: 'monitor', label: 'Build Monitor', icon: Activity },
  { id: 'governance', label: 'Governance · Publish · SCORM', icon: ShieldCheck },
  { id: 'registry', label: 'Credential Registry', icon: Award },
];

export default function UnifiedCourseBuilder({
  initialCourseId = '',
  initialTab = 'workspace',
}: {
  initialCourseId?: string;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [courseSession, setCourseSession] = useState<CourseSession | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const [creditState, setCreditState] = useState<CreditState | null>(null);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [programError, setProgramError] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId],
  );

  async function loadCourses() {
    setInventoryLoading(true); setInventoryError('');
    try {
      const res = await fetch('/api/admin/courses', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Course inventory failed (${res.status})`);
      const rows: CourseRow[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.courses)
          ? data.courses
          : [];
      setCourses(rows);
      const requestedCourse = courseId
        ? rows.find((course) => course.id === courseId || course.slug === courseId)
        : null;
      if (requestedCourse?.id && requestedCourse.id !== courseId) selectCourse(requestedCourse.id);
      else if (!requestedCourse && rows[0]?.id) selectCourse(rows[0].id);
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Unable to load course inventory');
    } finally { setInventoryLoading(false); }
  }

  useEffect(() => {
    void loadCourses();
    fetch('/api/admin/dev-studio/programs', { cache: 'no-store' })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data?.error ?? `Programs failed (${response.status})`); return data; })
      .then((data) => setPrograms(Array.isArray(data?.data) ? data.data : []))
      .catch((error) => setProgramError(error instanceof Error ? error.message : 'Unable to load programs'));
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

  useEffect(() => {
    if (tab !== 'workspace' || !courseId) return;
    const controller = new AbortController();
    setWorkspaceLoading(true);
    setWorkspaceError('');
    setCourseSession(null);
    fetch(
      `/api/admin/course-builder?action=session&courseId=${encodeURIComponent(courseId)}`,
      { cache: 'no-store', signal: controller.signal },
    )
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.session) {
          throw new Error(payload?.error || `Course workspace failed (${response.status})`);
        }
        return payload.session as CourseSession;
      })
      .then(setCourseSession)
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setWorkspaceError(error instanceof Error ? error.message : 'Unable to load course workspace');
      })
      .finally(() => {
        if (!controller.signal.aborted) setWorkspaceLoading(false);
      });
    return () => controller.abort();
  }, [courseId, tab, workspaceRevision]);

  function syncLocation(nextCourseId: string, nextTab: Tab) {
    const params = new URLSearchParams(window.location.search);
    if (nextCourseId) params.set('courseId', nextCourseId);
    else params.delete('courseId');
    params.set('tab', nextTab);
    window.history.replaceState(null, '', `/studio/courses?${params.toString()}`);
  }

  function selectCourse(id: string) {
    setCourseId(id);
    syncLocation(id, tab);
  }

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    syncLocation(courseId, nextTab);
  }

  function openWorkspace(id: string) {
    setCourseId(id);
    setTab('workspace');
    syncLocation(id, 'workspace');
  }

  return (
    <div className="min-h-screen min-w-0 w-full overflow-x-clip bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <Bot className="h-4 w-4" /> Master Course Builder
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              One workspace for course authoring, standards, media sourcing, instructor production, review, and publishing.
            </p>
            {creditState ? (
              <p className="mt-2 text-sm font-bold text-amber-300">
                {creditState.operator
                  ? 'Platform operator workspace • usage metering exempt'
                  : `${Number(creditState.credits?.balance ?? 0).toLocaleString()} Course Builder credits available`}
              </p>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="master-course-selector">Selected course</label>
            <select
              id="master-course-selector"
              value={courseId}
              onChange={(event) => selectCourse(event.target.value)}
              className="min-h-10 max-w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white sm:min-w-80"
            >
              <option value="">Select a course…</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} — {course.status ?? 'draft'}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadCourses()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {selectedCourse ? (
              <button
                type="button"
                onClick={() => selectTab('workspace')}
                className="max-w-full truncate rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400"
              >
                Open workspace
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto min-w-0 max-w-[1600px] p-3 pb-24 sm:p-4 sm:pb-24">
        {health ? (
          <section
            aria-label="Course Builder health"
            className={`mb-4 rounded-xl border p-4 ${health.status === 'healthy' ? 'border-emerald-700 bg-emerald-950/40' : 'border-amber-700 bg-amber-950/40'}`}
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <h2 className="min-w-0 break-words font-bold text-white">Course Builder health: {health.status}</h2>
              <span className="text-xs text-slate-400">Checked {new Date(health.checkedAt).toLocaleString()}</span>
            </div>
            <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {health.checks.map((check) => (
                <li key={check.name} className="rounded-lg bg-slate-950/60 p-3 text-sm">
                  <div
                    className={
                      check.state === 'paused'
                        ? 'font-bold text-amber-300'
                        : check.passed
                          ? 'font-bold text-emerald-300'
                          : 'font-bold text-amber-300'
                    }
                  >
                    {check.state === 'paused'
                      ? 'Paused'
                      : check.passed
                        ? 'Ready'
                        : 'Needs attention'}{' '}
                    · {check.name}
                  </div>
                  <p className="mt-1 text-slate-300">{check.message}</p>
                  {check.issues?.length ? (
                    <ul className="mt-2 space-y-2 border-t border-slate-800 pt-2">
                      {check.issues.map((issue) => (
                        <li key={issue.courseId}>
                          <button
                            type="button"
                            onClick={() => openWorkspace(issue.courseId)}
                            className="font-semibold text-cyan-300 hover:text-cyan-200"
                          >
                            Open {issue.title}
                          </button>
                          <span className="block text-xs text-slate-400">
                            {issue.issues.join(' · ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {tab === 'courses' && (
          <CourseCatalog
            courses={courses}
            programs={programs}
            loading={inventoryLoading}
            inventoryError={inventoryError}
            programError={programError}
            onChanged={loadCourses}
            onOpen={openWorkspace}
            onCreated={async (id) => {
              await loadCourses();
              openWorkspace(id);
            }}
          />
        )}

        {tab === 'workspace' && (
          courseId ? (
            <section className="overflow-hidden rounded-2xl border border-slate-700 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
                <div>
                  <h2 className="font-bold">Unified course workspace</h2>
                  <p className="text-xs text-slate-600">Curriculum · quizzes · assessments · media · interactions · compliance · publish · learner preview</p>
                </div>
                {selectedCourse ? <span className="text-xs font-semibold text-slate-500">{selectedCourse.title}</span> : null}
              </div>
              {workspaceError ? (
                <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                  {workspaceError}
                  <button type="button" onClick={() => setWorkspaceRevision((value) => value + 1)} className="ml-2 font-bold underline">Retry</button>
                </div>
              ) : workspaceLoading || !courseSession ? (
                <div className="flex min-h-[32rem] items-center justify-center gap-3 text-sm font-semibold text-slate-600" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading the course workspace and LMS browser…
                </div>
              ) : (
                <CourseProvider key={courseSession.loadedAt} session={courseSession}>
                  <CourseStudioApplication embedded>
                    <StudioWorkspace />
                  </CourseStudioApplication>
                </CourseProvider>
              )}
            </section>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">Select a course to open its unified workspace.</div>
          )
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
              openWorkspace(id);
            }}
          />
        )}
        {tab === 'media' && <CourseInstructorMediaPanel courseId={courseId} />}
        {tab === 'monitor' && (
          courseId
            ? <CoursePipelineDiagram courseId={courseId} />
            : <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">Select a course to watch its live build pipeline.</div>
        )}
        {tab === 'governance' && <CourseLifecycleWorkspace selectedCourseId={courseId} embedded />}
        {tab === 'registry' && <CredentialRegistryPanel course={selectedCourse} />}
      </main>
    </div>
  );
}

function CourseCatalog({
  courses,
  programs,
  loading,
  inventoryError,
  programError,
  onChanged,
  onOpen,
  onCreated,
}: {
  courses: CourseRow[];
  programs: ProgramRow[];
  loading: boolean;
  inventoryError: string;
  programError: string;
  onChanged: () => void | Promise<void>;
  onOpen: (id: string) => void;
  onCreated: (id: string) => void | Promise<void>;
}) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const visibleCourses = courses.filter(course => (status === 'all' || (course.status ?? 'draft') === status) && course.title.toLowerCase().includes(query.toLowerCase()));

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
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26.25rem)]">
      <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <h2 className="text-lg font-bold">Course applications</h2>
        <p className="mt-1 text-sm text-slate-400">
          Every course opens the same session, state provider, mutation layer and feature workspace.
        </p>
        {error ? <p role="alert" className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        {inventoryError ? <div role="alert" className="mt-3 rounded-lg bg-red-950/60 px-3 py-3 text-sm text-red-100"><strong>Course inventory could not load.</strong> {inventoryError} <button onClick={() => void onChanged()} className="ml-2 underline">Retry</button></div> : null}
        {programError ? <p role="alert" className="mt-3 rounded-lg bg-amber-950/60 px-3 py-2 text-sm text-amber-100">Program list could not load: {programError}</p> : null}
        <div className="mt-4 flex min-w-0 flex-wrap gap-2"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses" className="min-w-0 w-full flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-56"/><select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:w-auto"><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleCourses.map((course) => (
            <article
              key={course.id}
              className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 p-4 hover:border-cyan-500"
            >
              <button type="button" onClick={() => onOpen(course.id)} className="break-words text-left font-bold text-white hover:text-cyan-300">{course.title}</button>
              <div className="mt-1 text-xs text-slate-400">
                {course.status ?? 'draft'} · {course.duration_hours ?? '—'} hours
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <button type="button" onClick={() => onOpen(course.id)} className="rounded-md bg-cyan-500 px-2.5 py-1.5 text-slate-950">Open</button>
                <button disabled={busyId === course.id} onClick={() => void mutate(course, course.status === 'published' ? 'unpublish' : 'publish')} className="rounded-md border border-slate-600 px-2.5 py-1.5 text-slate-200 disabled:opacity-50">
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button disabled={busyId === course.id} onClick={() => void mutate(course, 'clone')} className="rounded-md border border-slate-600 px-2.5 py-1.5 text-slate-200 disabled:opacity-50">Clone</button>
                <button disabled={busyId === course.id} onClick={() => void mutate(course, 'delete')} className="rounded-md border border-red-800 px-2.5 py-1.5 text-red-300 disabled:opacity-50">Archive</button>
              </div>
            </article>
          ))}
          {loading && <p className="text-sm text-slate-400">Loading course inventory…</p>}
          {!loading && !inventoryError && !visibleCourses.length && <p className="text-sm text-slate-400">{courses.length ? 'No courses match these filters.' : 'No courses exist yet.'}</p>}
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
      className="mx-auto min-w-0 max-w-3xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6"
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
          mode: selectedCourse?.id ? 'missing-only' : 'refresh',
          courseId: selectedCourse?.id,
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
  async function restoreAuthoredBlueprint(blueprint: BlueprintRow) {
    if (!selectedCourse?.program_id) {
      setError('Select a course linked to a canonical program before restoring its authored blueprint.');
      return;
    }
    setBusy(`restore:${blueprint.id}`);
    setError('');
    try {
      const res = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('restore-authored-blueprint'),
        body: JSON.stringify({
          action: 'generate-from-blueprint',
          blueprintId: blueprint.id,
          programId: selectedCourse.program_id,
          mode: 'replace',
          contentSource: 'blueprint',
          videoMode: 'off',
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.courseId)
        throw new Error(
          result.error ||
            (Array.isArray(result.errors) ? result.errors.join('; ') : '') ||
            'Authored blueprint restoration failed',
        );
      await onGenerated(result.courseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authored blueprint restoration failed');
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
          <div key={blueprint.id} className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-cyan-400">
              {blueprint.state ?? 'General'}
            </div>
            <h3 className="mt-1 break-words font-bold text-white">{blueprint.title}</h3>
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
            <button
              type="button"
              onClick={() => void restoreAuthoredBlueprint(blueprint)}
              disabled={busy === `restore:${blueprint.id}` || !selectedCourse?.program_id}
              className="ml-2 mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400 px-3 py-2 text-sm font-bold text-amber-200 disabled:opacity-40"
            >
              {busy === `restore:${blueprint.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Restore authored blueprint
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

