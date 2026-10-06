'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Award, BookOpen, Bot, Loader2, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';
import CredentialRegistryPanel from '@/components/admin/course-builder/CredentialRegistryPanel';

type Tab = 'courses' | 'ultimate' | 'registry' | 'health';
type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  program_id?: string | null;
  status?: string;
  duration_hours?: number | null;
};
type ProgramRow = {
  id: string;
  title: string;
  slug?: string | null;
  status?: string | null;
  is_active?: boolean | null;
};
type UltimateBuildRow = {
  id: string;
  course_id: string;
  status: string;
  current_step?: string | null;
  findings?: unknown[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  ultimate_build_jobs?: Array<{
    id: string;
    status: string;
    last_error?: string | null;
    created_at: string;
    heartbeat_at?: string | null;
  }>;
};

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'ultimate', label: 'Ultimate Build', icon: Rocket },
  { id: 'registry', label: 'Credential Registry', icon: Award },
  { id: 'health', label: 'Health', icon: ShieldCheck },
];

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

async function queueUltimateCourse(input: {
  course: CourseRow;
  programSlug: string;
  topic?: string;
  audience?: string;
}) {
  const response = await fetch('/api/admin/ultimate-course-builder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'queue-course',
      courseId: input.course.id,
      programSlug: input.programSlug,
      title: input.course.title,
      topic: input.topic ?? input.course.description ?? '',
      audience: input.audience ?? '',
    }),
  });
  const payload = await readJson(response);
  if (!response.ok || !payload?.buildId) {
    throw new Error(payload?.error || payload?.message || 'Ultimate build could not be queued');
  }
  return payload;
}

export default function UnifiedCourseBuilder({
  initialCourseId = '',
  initialTab = 'ultimate',
  embedded = false,
}: {
  initialCourseId?: string;
  initialTab?: Tab;
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [programError, setProgramError] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId],
  );

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedCourse?.program_id) ?? null,
    [programs, selectedCourse?.program_id],
  );

  function syncLocation(nextCourseId: string, nextTab: Tab) {
    if (embedded) return;
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

  function openUltimate(id: string) {
    setCourseId(id);
    setTab('ultimate');
    syncLocation(id, 'ultimate');
  }

  async function loadCourses(preferredCourseId?: string) {
    setInventoryLoading(true);
    setInventoryError('');
    try {
      const response = await fetch('/api/admin/courses', { cache: 'no-store' });
      const payload = await readJson(response);
      if (!response.ok)
        throw new Error(payload?.error ?? `Course inventory failed (${response.status})`);
      const rows: CourseRow[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.courses)
          ? payload.courses
          : [];
      setCourses(rows);
      const requested = preferredCourseId || courseId;
      const matched = requested
        ? rows.find((course) => course.id === requested || course.slug === requested)
        : null;
      if (matched?.id) setCourseId(matched.id);
      else if (!selectedCourse && rows[0]?.id) setCourseId(rows[0].id);
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Unable to load course inventory');
    } finally {
      setInventoryLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
    fetch('/api/admin/dev-studio/programs', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await readJson(response);
        if (!response.ok) throw new Error(payload?.error ?? `Programs failed (${response.status})`);
        return payload;
      })
      .then((payload) => setPrograms(Array.isArray(payload?.data) ? payload.data : []))
      .catch((error) =>
        setProgramError(error instanceof Error ? error.message : 'Unable to load programs'),
      );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`${embedded ? 'h-full overflow-y-auto' : 'min-h-screen'} min-w-0 w-full overflow-x-clip bg-slate-950 text-slate-100`}
    >
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <Bot className="h-4 w-4" /> Ultimate Course Builder
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              One durable 20-stage authority for standards, instruction, media, narration,
              assessments, QA, repair, and LMS release.
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Legacy Course Factory is archived and cannot start
              production builds.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="ultimate-course-selector">
              Selected course
            </label>
            <select
              id="ultimate-course-selector"
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
                onClick={() => selectTab('ultimate')}
                className="max-w-full truncate rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400"
              >
                Open Ultimate build
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
        {tab === 'courses' && (
          <CourseCatalog
            courses={courses}
            programs={programs}
            loading={inventoryLoading}
            inventoryError={inventoryError}
            programError={programError}
            onChanged={loadCourses}
            onOpen={openUltimate}
            onCreated={async (id) => {
              await loadCourses(id);
              openUltimate(id);
            }}
          />
        )}

        {tab === 'ultimate' &&
          (selectedCourse ? (
            <UltimateBuildPanel
              course={selectedCourse}
              programSlug={selectedProgram?.slug?.trim() || selectedCourse.slug}
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
              Select a course, or create a course shell, to start an Ultimate build.
            </div>
          ))}
        {tab === 'registry' && <CredentialRegistryPanel course={selectedCourse} />}
        {tab === 'health' && <CourseBuilderHealthPanel onOpen={openUltimate} />}
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
  onChanged: (preferredCourseId?: string) => void | Promise<void>;
  onOpen: (id: string) => void;
  onCreated: (id: string) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const visibleCourses = courses.filter(
    (course) =>
      (status === 'all' || (course.status ?? 'draft') === status) &&
      course.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26.25rem)]">
      <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <h2 className="text-lg font-bold">Course inventory</h2>
        <p className="mt-1 text-sm text-slate-400">
          Open a canonical course in Ultimate Course Builder. Publishing is available only after the
          Ultimate release gate passes.
        </p>
        {inventoryError ? (
          <div
            role="alert"
            className="mt-3 rounded-lg bg-red-950/60 px-3 py-3 text-sm text-red-100"
          >
            <strong>Course inventory could not load.</strong> {inventoryError}{' '}
            <button onClick={() => void onChanged()} className="underline">
              Retry
            </button>
          </div>
        ) : null}
        {programError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
          >
            Program list could not load: {programError}
          </p>
        ) : null}
        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses"
            className="min-w-0 w-full flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-56"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:w-auto"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleCourses.map((course) => (
            <article
              key={course.id}
              className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 p-4 hover:border-cyan-500"
            >
              <button
                type="button"
                onClick={() => onOpen(course.id)}
                className="break-words text-left font-bold text-white hover:text-cyan-300"
              >
                {course.title}
              </button>
              <div className="mt-1 text-xs text-slate-400">
                {course.status ?? 'draft'} · {course.duration_hours ?? '—'} hours
              </div>
              <button
                type="button"
                onClick={() => onOpen(course.id)}
                className="mt-4 rounded-md bg-cyan-500 px-2.5 py-1.5 text-xs font-bold text-slate-950"
              >
                Open Ultimate build
              </button>
            </article>
          ))}
          {loading && <p className="text-sm text-slate-400">Loading course inventory…</p>}
          {!loading && !inventoryError && !visibleCourses.length && (
            <p className="text-sm text-slate-400">
              {courses.length ? 'No courses match these filters.' : 'No courses exist yet.'}
            </p>
          )}
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
      const selectedProgram = programs.find((program) => program.id === programId);
      if (!selectedProgram?.slug) throw new Error('The selected program needs a canonical slug');
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
      const createResponse = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description: topic,
          programId,
          status: 'draft',
        }),
      });
      const course = await readJson(createResponse);
      if (!createResponse.ok || !course?.id) {
        throw new Error(course?.error || 'Unable to create the canonical course shell');
      }
      await queueUltimateCourse({
        course,
        programSlug: selectedProgram.slug,
        topic,
        audience,
      });
      await onCreated(course.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create course');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto min-w-0 max-w-3xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6"
    >
      <h2 className="text-xl font-bold">Create and queue in Ultimate</h2>
      <p className="text-sm text-slate-400">
        Creates only the canonical course shell, then hands all generation to Ultimate Course
        Builder.
      </p>
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
        placeholder="Specific scope, standards, practical skills, and outcomes"
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
        <option value="" disabled>
          Select a canonical program
        </option>
        {programs
          .filter((program) => program.is_active !== false && program.status !== 'archived')
          .map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
      </select>
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        {saving ? 'Queuing Ultimate build…' : 'Create and queue Ultimate build'}
      </button>
    </form>
  );
}

export function UltimateBuildPanel({
  course,
  programSlug,
}: {
  course: CourseRow;
  programSlug: string;
}) {
  const [builds, setBuilds] = useState<UltimateBuildRow[]>([]);
  const [acquisitions, setAcquisitions] = useState<Array<{ id: string; goal: string | null }>>([]);
  const [buildsCourseId, setBuildsCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refreshToken = useRef(0);
  const latest = buildsCourseId === course.id ? (builds[0] ?? null) : null;
  const statusLoading = loading || buildsCourseId !== course.id;
  const jobs = [...(latest?.ultimate_build_jobs ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const activeJob = jobs.find((job) => ['queued', 'running'].includes(job.status));
  const workerJob = activeJob ?? jobs[0];

  async function refresh(requestedCourseId = course.id) {
    const token = ++refreshToken.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/ultimate-course-builder?courseId=${encodeURIComponent(requestedCourseId)}`,
        { cache: 'no-store' },
      );
      const payload = await readJson(response);
      if (token !== refreshToken.current) return;
      if (!response.ok) throw new Error(payload?.error || 'Unable to load Ultimate build status');
      setBuilds(Array.isArray(payload?.builds) ? payload.builds : []);
      setAcquisitions(Array.isArray(payload?.acquisitions) ? payload.acquisitions : []);
      setBuildsCourseId(requestedCourseId);
    } catch (reason) {
      if (token !== refreshToken.current) return;
      setError(reason instanceof Error ? reason.message : 'Unable to load Ultimate build status');
    } finally {
      if (token === refreshToken.current) setLoading(false);
    }
  }

  useEffect(() => {
    setBuilds([]);
    setAcquisitions([]);
    setBuildsCourseId('');
    setError('');
    void refresh(course.id);
  }, [course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!latest || !['initializing', 'queued', 'running'].includes(latest.status)) return;
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [latest?.id, latest?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function queue() {
    setBusy(true);
    setError('');
    try {
      await queueUltimateCourse({ course, programSlug });
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to queue Ultimate build');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!latest) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ultimate-course-builder/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: latest.id }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(payload?.error || 'Ultimate release failed');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ultimate release failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
            Ultimate Course Builder
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">{course.title}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Program authority: {programSlug || 'course-defined'} · durable Northflank worker · 20
            checkpointed stages
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={statusLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!statusLoading && latest ? (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Worker job</p>
          <p className="mt-1 text-sm font-bold text-slate-200">
            {workerJob?.status ?? 'not queued'} · {workerJob?.id ?? 'No persisted job'}
          </p>
          {workerJob?.last_error ? (
            <p role="alert" className="mt-2 break-words text-sm text-amber-200">
              {workerJob.last_error}
            </p>
          ) : null}
          {workerJob?.status === 'completed' && !['built', 'published'].includes(latest.status) ? (
            <p className="mt-2 text-sm text-slate-400">
              This worker job finished. Course acceptance and release are still required.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-100"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-1 text-lg font-black text-white">
            {statusLoading ? 'loading…' : (latest?.status ?? 'not queued')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current stage</p>
          <p className="mt-1 break-words text-lg font-black text-white">
            {statusLoading ? 'loading…' : (latest?.current_step ?? 'standards_lock')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Build ID</p>
          <p className="mt-1 break-all text-sm font-bold text-slate-200">
            {statusLoading ? 'Loading course build…' : (latest?.id ?? 'Created when queued')}
          </p>
        </div>
      </div>

      {!statusLoading && acquisitions.length > 0 && (
        <div className="mt-5 space-y-2">
          {acquisitions.map((request) => (
            <a
              key={request.id}
              href={`/studio/browser?acquisitionRunId=${encodeURIComponent(request.id)}`}
              className="block rounded-lg border border-cyan-700 bg-slate-950 p-3 text-cyan-300"
            >
              {request.goal || 'Complete lesson scene media'} · Open existing Studio browser
            </a>
          ))}
        </div>
      )}

      <ol className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        {[
          'Standards lock',
          'Instruction design',
          'Media + narration',
          'Assessment alignment',
          'Finished-media QA',
          'Learner run-through',
          'Selective repair',
          'Credential release',
        ].map((step) => (
          <li key={step} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void queue()}
          disabled={busy || statusLoading || Boolean(activeJob)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
        >
          {busy || statusLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {statusLoading
            ? 'Loading build status…'
            : workerJob?.status === 'queued'
              ? 'Ultimate build queued'
              : workerJob?.status === 'running'
                ? 'Ultimate build running'
                : latest
                  ? 'Resume Ultimate build'
                  : 'Queue Ultimate build'}
        </button>
        {latest?.status === 'built' ? (
          <button
            type="button"
            onClick={() => void publish()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" /> Publish Ultimate release
          </button>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Course Factory generation, blueprint execution, and standalone media queues are not
        available from this surface.
      </p>
    </section>
  );
}


type CourseHealthCheck = {
  name: string;
  passed: boolean;
  message: string;
  state?: 'ready' | 'paused' | 'attention';
  issues?: Array<{ courseId: string; title: string; issues: string[] }>;
};

export function CourseBuilderHealthPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const [checks, setChecks] = useState<CourseHealthCheck[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  async function refresh() {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/courses/health', { cache: 'no-store' });
      const payload = await readJson(response);
      if (!response.ok || !Array.isArray(payload.checks)) throw new Error('Course health could not be verified');
      if (id === requestId.current) setChecks(payload.checks);
    } catch (reason) {
      if (id === requestId.current) setError(reason instanceof Error ? reason.message : 'Health check failed');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    return () => { requestId.current++; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Course health</h2>
        <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50">Refresh health</button>
      </div>
      {loading && <p role="status">Checking course health…</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {!loading && !error && checks.map((check) => (
        <article key={check.name} className="rounded-lg border border-slate-700 p-3">
          <h3 className="font-bold">{check.name} — {check.state === 'paused' ? 'Paused' : check.passed ? 'Ready' : 'Needs attention'}</h3>
          <p className="mt-1 text-sm text-slate-300">{check.message}</p>
          {!!check.issues?.length && <ul className="mt-3 space-y-3">{check.issues.map((issue) => (
            <li key={issue.courseId}>
              <button type="button" onClick={() => onOpen(issue.courseId)} className="text-cyan-300 underline">Open {issue.title}</button>
              <p className="text-sm text-slate-300">{issue.issues.join('; ')}</p>
            </li>
          ))}</ul>}
        </article>
      ))}
    </section>
  );
}
