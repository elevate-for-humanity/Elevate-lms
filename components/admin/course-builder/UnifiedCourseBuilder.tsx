'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Award, BookOpen, Bot, Loader2, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';
import UltimateStageInspector from '@/components/admin/course-builder/UltimateStageInspector';
import CredentialRegistryPanel from '@/components/admin/course-builder/CredentialRegistryPanel';

type Tab = 'courses' | 'ultimate' | 'registry';
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
    lease_expires_at?: string | null;
    monitor?: {enabled?: boolean; coordinator?: string; state?: string; checkedAt?: string; reason?: string; recoveries?: number};
    payload?: { progress?: { phase: string; at: string; completed: number; total?: number | null } };
  }>;
};

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'ultimate', label: 'Ultimate Build', icon: Rocket },
  { id: 'registry', label: 'Credential Registry', icon: Award },
];

async function readJson(response: Response) {
  return response.json().catch(() => {
    throw new Error(response.status === 503
      ? 'Admin service unavailable (HTTP 503). Saved progress is unchanged; waiting for runtime recovery.'
      : `Course Builder returned an unreadable response (HTTP ${response.status}). Saved progress is unchanged.`);
  });
}

async function startUltimateCourse(input: {
  course: CourseRow;
  programSlug: string;
  topic?: string;
  audience?: string;
  googleModel?: string;
  googleLocation?: string;
  acceptanceBuild?: boolean;
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
      ...(input.googleModel?.trim() ? {instructionalAuthoring: {provider:'google', model:input.googleModel.trim(), location:input.googleLocation || 'us'}} : {}),
      ...(input.acceptanceBuild ? {acceptanceBuild:true} : {}),
    }),
  });
  const payload = await readJson(response);
  if (!response.ok || !payload?.buildId) {
    throw new Error(payload?.error || payload?.message || 'Ultimate build could not be started');
  }
  if (payload?.queued !== true && payload?.dispatched !== true)
    throw new Error('The worker request was not saved.');
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
            <p className="mt-1 max-w-3xl text-sm text-slate-200">
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
        {tab !== 'courses' && inventoryError ? (
          <div role="alert" className="mb-4 rounded-lg bg-red-950/60 p-3 text-red-100">
            Course inventory could not load: {inventoryError}{' '}
            <button type="button" onClick={() => void loadCourses()} className="underline">Retry course inventory</button>
          </div>
        ) : null}
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
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-200">
              Select a course, or create a course shell, to start an Ultimate build.
            </div>
          ))}
        {tab === 'registry' && <CredentialRegistryPanel course={selectedCourse} />}
      </main>
    </div>
  );
}

type CourseIntegrityCheck = {
  name: string;
  passed: boolean;
  message: string;
  issues?: Array<{ courseId: string; title: string; issues: string[] }>;
};

export function CourseIntegrityChecks({ onOpen }: { onOpen: (id: string) => void }) {
  const [checks, setChecks] = useState<CourseIntegrityCheck[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function refresh() {
    setLoading(true);
    setError('');
    setChecks([]);
    try {
      const response = await fetch('/api/admin/courses/health', { cache: 'no-store' });
      const payload = await readJson(response);
      // An unavailable capability can still include actionable failed checks.
      if ((!response.ok && response.status !== 503) || !Array.isArray(payload?.checks)) {
        throw new Error(payload?.error || `Course checks failed (${response.status})`);
      }
      setChecks(payload.checks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Course checks are unavailable');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);
  return (
    <section aria-label="Course integrity" className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Course checks</h2>
        <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50">
          {loading ? 'Checking courses…' : 'Refresh course checks'}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-red-200">{error}</p>}
      <ul className="mt-3 space-y-3">
        {checks.map(check => (
          <li key={check.name}>
            <p className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>
              <strong>{check.name}:</strong> {check.message}
            </p>
            {check.issues?.length ? (
              <ul className="mt-2 space-y-2">
                {check.issues.map(issue => (
                  <li key={issue.courseId} className="rounded-lg border border-amber-900/60 p-3">
                    <button type="button" onClick={() => onOpen(issue.courseId)} className="font-semibold text-cyan-300 underline">Open {issue.title}</button>
                    <p className="mt-1 text-sm text-slate-300">{issue.issues.join('; ')}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
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
    <>
    <CourseIntegrityChecks onOpen={onOpen} />
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26.25rem)]">
      <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <h2 className="text-lg font-bold">Course inventory</h2>
        <p className="mt-1 text-sm text-slate-200">
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
              <div className="mt-1 text-xs text-slate-200">
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
          {loading && <p className="text-sm text-slate-200">Loading course inventory…</p>}
          {!loading && !inventoryError && !visibleCourses.length && (
            <p className="text-sm text-slate-200">
              {courses.length ? 'No courses match these filters.' : 'No courses exist yet.'}
            </p>
          )}
        </div>
      </section>
      <CreateCoursePanel programs={programs} onCreated={onCreated} />
    </div>
    </>
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
      const googleModel = String(data.get('googleModel') ?? '').trim();
      const googleLocation = String(data.get('googleLocation') || 'us');
      if (googleModel && !/^gemini-[a-z0-9.-]+$/.test(googleModel))
        throw new Error('Enter a supported Google model ID for source-grounded teaching');
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
      await startUltimateCourse({
        course,
        programSlug: selectedProgram.slug,
        topic,
        audience,
        googleModel,
        googleLocation,
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
      <h2 className="text-xl font-bold">Create and start in Ultimate</h2>
      <p className="text-sm text-slate-200">
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
      <label className="block space-y-2 text-sm">
        <span>Google model for source-grounded teaching (optional)</span>
        <input name="googleModel" placeholder="Verified model ID" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
        <select name="googleLocation" defaultValue="us" aria-label="Google authoring location" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><option value="us">United States multi-region</option><option value="us-central1">Iowa region (supported models)</option><option value="global">Global</option></select>
        <span className="block text-slate-200">Use a model verified for this worker's Google region. Authorized teaching sources and all media acceptance checks remain required.</span>
      </label>
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
        {saving ? 'Starting Ultimate build…' : 'Create and start Ultimate build'}
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
  const [statusError, setStatusError] = useState('');
  const refreshToken = useRef(0);
  const refreshController = useRef<AbortController | null>(null);
  const latest = buildsCourseId === course.id ? (builds[0] ?? null) : null;
  const statusLoading = loading;
  const statusLoaded = buildsCourseId === course.id;
  const [lastStatusAt, setLastStatusAt] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [googleModel, setGoogleModel] = useState('');
  const [googleLocation,setGoogleLocation]=useState('us');
  const [mobileSplitView, setMobileSplitView] = useState(false);
  const jobs = [...(latest?.ultimate_build_jobs ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const observedJobs = jobs.map(job => {
    if (job.status !== 'running') return job;
    const heartbeat = Date.parse(job.heartbeat_at ?? '');
    const leaseEnd = Date.parse(job.lease_expires_at ?? '');
    const active = Number.isFinite(heartbeat) && Date.now() - heartbeat < 90_000 &&
      Number.isFinite(leaseEnd) && leaseEnd > Date.now();
    return active ? job : {...job, status: 'stalled', last_error: 'Worker heartbeat is missing or stale. Resume the saved build; Google prevents overlapping executions.'};
  });
  const activeJob = observedJobs.find((job) => ['queued', 'running'].includes(job.status));
  const workerJob = activeJob ?? observedJobs[0];

  async function refresh(requestedCourseId = course.id, background = false) {
    if (background && refreshController.current) return;
    refreshController.current?.abort();
    const controller = new AbortController();
    refreshController.current = controller;
    const token = ++refreshToken.current;
    if (!background) setLoading(true);
    setStatusError('');
    try {
      const response = await fetch(
        `/api/admin/ultimate-course-builder?courseId=${encodeURIComponent(requestedCourseId)}`,
        { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) },
      );
      const payload = await readJson(response);
      if (token !== refreshToken.current) return;
      if (!response.ok) throw new Error(payload?.error || 'Unable to load Ultimate build status');
      setBuilds(Array.isArray(payload?.builds) ? payload.builds : []);
      setAcquisitions(Array.isArray(payload?.acquisitions) ? payload.acquisitions : []);
      setBuildsCourseId(requestedCourseId);
      setLastStatusAt(new Date().toISOString());
    } catch (reason) {
      if (token !== refreshToken.current) return;
      setStatusError(reason instanceof Error ? reason.message : 'Unable to load Ultimate build status');
    } finally {
      if (token === refreshToken.current) { setLoading(false); refreshController.current = null; }
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
    // Keep retrying read-only status even after a failed initial load or blocked build.
    // Queue writes and worker dispatch belong to the server coordinator, not polling.
    const timer = window.setInterval(() => void refresh(course.id, true), 15000);
    return () => window.clearInterval(timer);
  }, [course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleAutopilot() {
    if (!latest) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/ultimate-course-builder/autopilot', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({buildId:latest.id,enabled:!workerJob?.monitor?.enabled}), signal:AbortSignal.timeout(25000),
      });
      const result=await readJson(response);
      if(!response.ok)throw new Error(result.error || 'Autopilot setting could not be saved');
      setNotice(result.message); await refresh();
    } catch(reason) {setError(reason instanceof Error?reason.message:'Autopilot configuration failed');}
    finally {setBusy(false);}
  }

  async function startBuild() {
    setBusy(true);
    setError('');
    try {
      setNotice('');
      if (latest) {
        const response = await fetch('/api/admin/ultimate-course-builder/run', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildId: latest.id }),
        });
        const payload = await readJson(response);
        if (!response.ok || (payload?.queued !== true && payload?.alreadyRunning !== true)) throw new Error(payload?.error || 'The worker request could not be saved');
        if (payload.dispatched === false) {
          setError(payload.message || 'Course saved, but the Google worker has not started.');
        } else {
          setNotice(payload.message || 'Worker launch accepted. Waiting for a verified heartbeat.');
        }
      } else {
        const result = await startUltimateCourse({ course, programSlug, googleModel, googleLocation });
        setNotice(result.message || 'Build saved. Waiting for worker assignment.');
      }
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start Ultimate build');
    } finally {
      setBusy(false);
    }
  }

  async function startAcceptanceBuild() {
    setBusy(true);
    setError('');
    try {
      if (!/^gemini-[a-z0-9.-]+$/.test(googleModel.trim())) throw new Error('Enter a supported Google model ID');
      await startUltimateCourse({course,programSlug,googleModel,googleLocation,acceptanceBuild:true});
      setNotice('Separate acceptance build queued for this course. Previous builds and media remain preserved.');
      await refresh();
    } catch(reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start the acceptance build');
    } finally {setBusy(false);}
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
          <p className="mt-2 text-sm text-slate-200">
            Program authority: {programSlug || 'course-defined'} · Google Course Builder worker · 20
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

      <div className="mt-4 flex items-center justify-between gap-2 2xl:hidden">
        <span className="text-xs font-semibold text-slate-300">Workspace layout</span>
        <button type="button" aria-pressed={mobileSplitView} onClick={() => setMobileSplitView(value => !value)} className="rounded-lg border border-cyan-600 px-3 py-2 text-xs font-bold text-cyan-200">{mobileSplitView ? "Use stacked view" : "Show builder + preview together"}</button>
      </div>
      <div data-course-workspace-layout className={`mt-5 grid min-w-0 items-start gap-2 sm:gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(28rem,1fr)] ${mobileSplitView ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="min-w-0">
      {!statusLoading && latest ? (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Worker job</p>
          <p className="mt-1 text-sm font-bold text-slate-200">
            {workerJob?.status === 'queued' ? 'Awaiting worker assignment' : (workerJob?.status ?? 'Not started')}
          </p>
          {workerJob?.last_error ? (
            <p role="alert" className="mt-2 break-words text-sm text-amber-200">
              {workerJob.status === 'running' ? 'Previous attempt: ' : ''}{workerJob.last_error}
            </p>
          ) : null}
          {workerJob?.status === 'running' && !statusError && workerJob?.payload?.progress && <div className="mt-3 space-y-2 text-white">
            <p>Worker activity: {workerJob.payload.progress.phase.replaceAll('_', ' ').replaceAll(':', ' · ')}</p>
            <p className="text-sm">Last progress: {new Date(workerJob.payload.progress.at).toLocaleString()}</p>
            {typeof workerJob.payload.progress.total === 'number' && workerJob.payload.progress.total > 0 && <>
              <progress aria-label="Current worker activity progress" className="h-3 w-full" max={workerJob.payload.progress.total}
                value={Math.min(workerJob.payload.progress.total, workerJob.payload.progress.completed)} />
              <p className="text-sm">{workerJob.payload.progress.completed} of {workerJob.payload.progress.total} work units in this activity.</p>
            </>}
          </div>}
          {workerJob?.status === 'completed' && !['built', 'published'].includes(latest.status) ? (
            <p className="mt-2 text-sm text-slate-200">
              This worker job finished. Course acceptance and release are still required.
            </p>
          ) : null}
        </div>
      ) : null}

      {error || statusError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-100"
        >
          {error || statusError}
          {statusError && lastStatusAt && <span className="mt-1 block">Showing saved status from {new Date(lastStatusAt).toLocaleTimeString()}. It is not live confirmation.</span>}
        </p>
      ) : null}

      <div className="mt-5 grid min-w-0 gap-2 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Status</p>
          <p className="mt-1 text-lg font-black text-white">
            {statusLoading ? 'loading…' : (!statusLoaded || statusError) ? 'Unavailable' : (latest?.status === 'queued' ? 'Awaiting worker assignment' : (workerJob?.status === 'stalled' ? 'Worker stalled' : (latest?.status ?? 'not started')))}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Current stage</p>
          <p className="mt-1 break-words text-lg font-black text-white">
            {statusLoading ? 'loading…' : (!statusLoaded || statusError) ? 'Unavailable' : (latest?.current_step?.replaceAll('_', ' ') ?? 'Not started')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Saved work</p>
          <p className="mt-1 break-all text-sm font-bold text-slate-200">
            {statusLoading ? 'Loading course build…' : (!statusLoaded || statusError) ? 'Unavailable' : (latest ? 'Lesson checkpoints preserved' : 'Saved when started')}
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

      {latest && workerJob && <section aria-label="PARIS course autopilot" className="mt-5 rounded-xl border border-cyan-700 bg-slate-950 p-4 text-white">
        <h3 className="font-bold">PARIS course autopilot</h3>
        <p className="mt-2">PARIS combines admissions, instruction, production, quality checks, and supervision in one system.</p>
        <p className="mt-2">{workerJob.monitor?.enabled ? 'Enabled' : 'Disabled'} · {workerJob.monitor?.state?.replaceAll('_',' ') || 'No supervisor observation yet'}</p>
        {workerJob.monitor?.checkedAt && <p>Last supervisor check: {new Date(workerJob.monitor.checkedAt).toLocaleString()}</p>}
        {workerJob.monitor?.enabled && (!workerJob.monitor.checkedAt || Date.now()-Date.parse(workerJob.monitor.checkedAt)>600000) &&
          <p role="alert" className="mt-2 text-amber-200">Supervisor heartbeat is unconfirmed or stale. Monitoring is configured, but automatic execution is not verified.</p>}
        {workerJob.monitor?.reason && <p className="mt-2">{workerJob.monitor.reason}</p>}
        <p className="mt-2 text-sm text-slate-200">Repairs preserve saved lessons, respect active worker leases, and stop at retry limits or missing evidence. Publishing requires the existing quality checks.</p>
        <button type="button" onClick={()=>void toggleAutopilot()} disabled={busy || statusLoading}
          className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">
          {workerJob.monitor?.enabled ? 'Pause PARIS autopilot' : 'Enable PARIS autopilot'}
        </button>
      </section>}

      {notice ? <p role="status" className="mt-4 text-sm text-cyan-200">{notice}</p> : null}

      {statusLoaded && (!latest || ['blocked','failed','built_with_findings'].includes(latest.status)) ? (
        <label className="mt-4 block space-y-2 text-sm">
          <span>Google model for source-grounded teaching (optional)</span>
          <input value={googleModel} onChange={(event) => setGoogleModel(event.target.value)} placeholder="Verified model ID" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          <select value={googleLocation} onChange={event=>setGoogleLocation(event.target.value)} aria-label="Google authoring location" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><option value="us">United States multi-region</option><option value="us-central1">Iowa region (supported models)</option><option value="global">Global</option></select>
          <span className="block text-slate-200">Set before starting this build. Authorized teaching sources and all media acceptance checks remain required.</span>
        </label>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {latest && ['blocked','failed','built_with_findings'].includes(latest.status) ? (
          <button type="button" onClick={()=>void startAcceptanceBuild()} disabled={busy || !googleModel.trim() || activeJob?.status === 'running'} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            Start source-grounded acceptance build
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void startBuild()}
          disabled={busy || statusLoading || !statusLoaded || activeJob?.status === 'running'}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
        >
          {busy || statusLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {statusLoading
            ? 'Loading build status…'
            : !statusLoaded
              ? 'Build status unavailable'
            : workerJob?.status === 'queued'
              ? 'Start Google worker'
              : workerJob?.status === 'running'
                ? 'Ultimate build running'
                : latest
                  ? 'Resume Ultimate build'
                  : 'Start Ultimate build'}
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
        </div>
        <aside aria-label="Live course lesson preview" className="min-w-0 overflow-x-hidden 2xl:sticky 2xl:top-4">
          <div className="mb-3 rounded-xl border border-cyan-700/60 bg-slate-950 p-3">
            <h3 className="font-bold text-cyan-200">Live lesson preview</h3>
            <p className="mt-1 text-xs text-slate-300">Saved lessons and checkpoints refresh alongside the builder. Video appears as soon as a playable render is saved.</p>
          </div>
          {latest ? <UltimateStageInspector buildId={latest.id} updatedAt={latest.updated_at} /> :
            <p className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">Select or start a build to preview its lessons.</p>}
        </aside>
      </div>
      <p className="mt-4 text-xs text-slate-300">
        Course Factory generation, blueprint execution, and standalone media queues are not
        available from this surface.
      </p>
    </section>
  );
}
