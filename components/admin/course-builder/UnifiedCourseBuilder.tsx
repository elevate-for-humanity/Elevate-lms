'use client';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';
import DeployPanel from '@/components/studio/DeployPanel';
import {CourseWorkspaceContext, type CourseSelection} from './CourseWorkspaceContext';

import dynamic from 'next/dynamic';
import ParisSupervisionPanel from '@/components/admin/ParisSupervisionPanel';

import { ResizableWorkspace } from '@/components/studio/ResizableWorkspace';
import { FormEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Award, BookOpen, Bot, Loader2, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';
import UltimateStageInspector from '@/components/admin/course-builder/UltimateStageInspector';
import CredentialRegistryPanel from '@/components/admin/course-builder/CredentialRegistryPanel';
import type { SyllabusPlan } from '@/lib/ultimate-course-builder/authoring/syllabus-plan';
import LicensedMediaLibrary from './LicensedMediaLibrary';
import { courseExecutionState } from '@/lib/ultimate-course-builder/core/execution-state.mjs';
import { orderCourseJobs } from '@/lib/ultimate-course-builder/core/job-observation.mjs';
import ParallelLessonAutopilots from './ParallelLessonAutopilots';

const MediaStudioPanel = dynamic(() => import('@/components/studio/MediaStudioPanel'), {
  ssr: false,
});


type Tab = 'courses' | 'ultimate' | 'registry' | 'media';
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
  owner_paused?: boolean | null;
  current_step?: string | null;
  findings?: unknown[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  ultimate_build_jobs?: Array<{
    id: string;
    available_at?: string | null;
    status: string;
    last_error?: string | null;
    created_at: string;
    updated_at?: string | null;
    heartbeat_at?: string | null;
    lease_expires_at?: string | null;
    lease_owner?: string | null;
    attempts?: number;
    max_attempts?: number;
    execution_generation?: number;
    monitor?: {
      enabled?: boolean;
      coordinator?: string;
      state?: string;
      checkedAt?: string;
      reason?: string;
      recoveries?: number;
      confirmedAssignments?: number;
      lastDispatch?: { accepted: boolean; mode?: string; requestedAt?: string };
    };
    payload?: {
      ownerPreview?: boolean;
      autopilot?: {version:string;competencyId:string;lessonTitle?:string;role:string};
      progress?: { phase: string; at: string; completed: number; total?: number | null };
    };
  }>;
};

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'ultimate', label: 'Ultimate Build', icon: Rocket },
  { id: 'media', label: 'Media library', icon: BookOpen },
  { id: 'registry', label: 'Credential Registry', icon: Award },
];

async function readJson(response: Response) {
  return response.json().catch(() => {
    throw new Error(
      response.status === 503
        ? 'Admin service unavailable (HTTP 503). Saved progress is unchanged; waiting for runtime recovery.'
        : `Course Builder returned an unreadable response (HTTP ${response.status}). Saved progress is unchanged.`,
    );
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
  syllabusPlan?: SyllabusPlan;
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
      ...(input.syllabusPlan ? { syllabusPlan: input.syllabusPlan } : {}),
      ...(input.googleModel?.trim()
        ? {
            instructionalAuthoring: {
              provider: 'google',
              model: input.googleModel.trim(),
              location: input.googleLocation || 'us',
            },
          }
        : {}),
      ...(input.acceptanceBuild ? { acceptanceBuild: true } : {}),
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
  syncLocationWithUrl = !embedded,
}: {
  initialCourseId?: string;
  initialTab?: Tab;
  embedded?: boolean;
  initialBrowserTarget?: string;
  syncLocationWithUrl?: boolean;
}) {
  const [browserOpen, setBrowserOpen] = useState(true);
  const [previewTarget,setPreviewTarget]=useState<HTMLDivElement|null>(null);
  const [lessonSelection,setLessonSelection]=useState<CourseSelection|null>(null);
  const [deployOpen,setDeployOpen]=useState(false);
  const [suggestedPrompt,setSuggestedPrompt]=useState('');
  const [currentBuildId,setCurrentBuildId]=useState('');
  const [requestedLessonId,setRequestedLessonId]=useState('');
  const [previewRevision,setPreviewRevision]=useState(0);
  const onBuild=useCallback((id:string,courseId?:string,status?:string)=>{
    setCurrentBuildId(id);
    if(courseId && status==='published')setCourses(previous=>
      previous.some(row=>row.id===courseId && row.status!=='published')
        ? previous.map(row=>row.id===courseId?{...row,status:'published'}:row) : previous);
  },[]);
  const [taskStatus,setTaskStatus]=useState('');
  const onLessonSelection=useCallback((selection:CourseSelection)=>{
    setLessonSelection(previous=>previous?.lessonKey===selection.lessonKey && previous?.lessonId===selection.lessonId
      && previous?.title===selection.title ? previous : selection);
  },[]);
  const previewContext=useMemo(()=>({previewTarget,onSelection:onLessonSelection,onBuild,requestedLessonId}),[previewTarget,onLessonSelection,onBuild,requestedLessonId]);
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
    if (!syncLocationWithUrl) return;
    const params = new URLSearchParams(window.location.search);
    if (nextCourseId) params.set('courseId', nextCourseId);
    else params.delete('courseId');
    params.set('tab', nextTab);
    window.history.replaceState(null, '', `/studio/courses?${params.toString()}`);
  }

  function selectCourse(id: string) {
    setCourseId(id);
    setLessonSelection(null);
    setCurrentBuildId('');setRequestedLessonId('');
    syncLocation(id, tab);
  }

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    syncLocation(courseId, nextTab);
  }

  function openUltimate(id: string) {
    setCurrentBuildId('');setLessonSelection(null);
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

  const workspace = (
    <div
      className={`${embedded ? 'h-full overflow-y-auto' : 'min-h-screen'} min-w-0 w-full overflow-x-clip bg-slate-950 text-slate-100`}
    >
      <div className="border-b border-slate-800 bg-slate-900 px-3 py-2 sm:px-5 sm:py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <Bot className="h-4 w-4" /> Ultimate Course Builder
            </div>
            <p className="mt-1 hidden max-w-3xl text-sm text-slate-200 sm:block">
              One durable 20-stage authority for standards, instruction, media, narration,
              assessments, QA, repair, and LMS release.
            </p>
            <p className="mt-2 hidden items-center gap-2 text-sm font-bold text-emerald-300 sm:inline-flex">
              <ShieldCheck className="h-4 w-4" /> All production builds use the same verified execution contract.
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

      <section aria-label="Course AI controls" className="space-y-3 border-b border-slate-700 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex-1 font-bold">Tell PARIS what to build or change</h2>
          <button type="button" className="min-h-11 rounded-lg border border-cyan-600 px-3"
            onClick={()=>{setTab('ultimate');setSuggestedPrompt('Help me plan a new course. Ask for its topic, learner, credential and program. Do not use tools or start a build yet.');}}>Build a course</button>
          <button type="button" aria-expanded={deployOpen} className="min-h-11 rounded-lg border border-cyan-600 px-3"
            onClick={()=>setDeployOpen(value=>!value)}>Deploy</button>
        </div>
        <p className="text-sm text-slate-300">Speak or type your instructions here. Select courses and lessons below; previews stay on the right.</p>
        <p className="text-xs text-slate-300">Deploy updates the platform. Publish course releases accepted lessons to learners.</p>
        <div className="h-[32rem] min-w-0 overflow-hidden rounded-xl border border-slate-700">
          <UnifiedEllieChat embedded restoreLatest={false}
            fileContext={JSON.stringify({workspace:'course',courseId:selectedCourse?.id,title:selectedCourse?.title,
              programSlug:selectedProgram?.slug||selectedCourse?.slug,
              lessonId:lessonSelection?.canonicalLessonId||requestedLessonId,lessonTitle:lessonSelection?.title,buildId:currentBuildId})}
            suggestedPrompt={suggestedPrompt}
            onOpenDeploy={()=>setDeployOpen(true)} onOpenPreview={()=>setBrowserOpen(true)}
            onCommandStart={()=>{setBrowserOpen(true);setTaskStatus('AI request submitted. Waiting for saved execution evidence.');}}
            onTaskCheckpoint={checkpoint=>{
              setTaskStatus(checkpoint ? (checkpoint.title||'Course task')+' · '+checkpoint.status.replaceAll('_',' ') : '');
              if(checkpoint?.status==='done')void loadCourses();
            }}
            onCourseResult={(id,lessonId)=>{setPreviewRevision(value=>value+1);setCurrentBuildId('');setRequestedLessonId(lessonId??'');void loadCourses(id);openUltimate(id);setBrowserOpen(true);}}
          />
        </div>
        {taskStatus && <p role="status" className="text-sm text-cyan-200">{taskStatus}</p>}
        {deployOpen && <div className="h-[34rem] overflow-hidden rounded-xl border border-slate-700"><DeployPanel /></div>}
      </section>
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
            <button type="button" onClick={() => void loadCourses()} className="underline">
              Retry course inventory
            </button>
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
              key={selectedCourse.id}
              course={selectedCourse}
              programSlug={selectedProgram?.slug?.trim() || selectedCourse.slug}
              compact={embedded}
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-200">
              Select a course, or create a course shell, to start an Ultimate build.
            </div>
          ))}
        {tab === 'media' && (
          <div className="space-y-4">
            <LicensedMediaLibrary key={courseId} courseId={courseId} />
            <details className="rounded-xl border border-slate-700 p-4">
              <summary className="min-h-11 cursor-pointer font-bold">
                Organization assets · images, narration, licensed media and projects
              </summary>
              <MediaStudioPanel initialTab="library" />
            </details>
          </div>
        )}
        {tab === 'registry' && <CredentialRegistryPanel course={selectedCourse} />}
      </main>
    </div>
  );
  return (
    <CourseWorkspaceContext.Provider value={previewContext}>
      <ResizableWorkspace
        className={embedded ? "h-full" : "h-[calc(100dvh-5rem)] min-h-[34rem]"}
        title="Course previews" initialPanelSize={60}
        stackedTabs primaryLabel="Courses, lessons & AI" panelLabel="Preview"
        open={browserOpen} onOpenChange={setBrowserOpen}
        panel={<section aria-label="Course preview pane" className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
          <header className="shrink-0 border-b border-slate-700 px-4 py-3">
            <h2 className="font-bold">Preview</h2>
            <p className="text-sm text-slate-300">{lessonSelection?.title || selectedCourse?.title || 'Choose a course and lesson on the left.'}</p>
          </header>
          <div ref={setPreviewTarget} className="min-h-0 flex-1 overflow-auto">
            {!currentBuildId && selectedCourse && <iframe title={selectedCourse.title+' — learner preview'}
              src={'/api/admin/course-builder/preview?'+new URLSearchParams({courseId:selectedCourse.id,revision:String(previewRevision),...(requestedLessonId?{lessonId:requestedLessonId}:{})})}
              className="h-full min-h-[36rem] w-full border-0 bg-white" allow="autoplay; fullscreen" />}
          </div>
        </section>}
      >{workspace}</ResizableWorkspace>
    </CourseWorkspaceContext.Provider>
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
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <section
      aria-label="Course integrity"
      className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Course checks</h2>
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Checking courses…' : 'Refresh course checks'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-red-200">
          {error}
        </p>
      )}
      <ul className="mt-3 space-y-3">
        {checks.map((check) => (
          <li key={check.name}>
            <p className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>
              <strong>{check.name}:</strong> {check.message}
            </p>
            {check.issues?.length ? (
              <ul className="mt-2 space-y-2">
                {check.issues.map((issue) => (
                  <li key={issue.courseId} className="rounded-lg border border-amber-900/60 p-3">
                    <button
                      type="button"
                      onClick={() => onOpen(issue.courseId)}
                      className="font-semibold text-cyan-300 underline"
                    >
                      Open {issue.title}
                    </button>
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
            Open a canonical course in Ultimate Course Builder. Publishing is available only after
            the Ultimate release gate passes.
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
  const [syllabus, setSyllabus] = useState('');
  const [syllabusPlan, setSyllabusPlan] = useState<SyllabusPlan | null>(null);
  const [syllabusBusy, setSyllabusBusy] = useState(false);
  const [planConfirmed, setPlanConfirmed] = useState(false);
  async function importSyllabus(file?: File) {
    if (!file) return;
    setSyllabusBusy(true);
    setError('');
    setSyllabusPlan(null);
    setPlanConfirmed(false);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/admin/courses/generate/parse', {
        method: 'POST',
        body: form,
      });
      const result = await readJson(response);
      if (!response.ok || !result.raw_text)
        throw new Error(result.error || 'Syllabus extraction failed');
      setSyllabus(result.raw_text);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Syllabus extraction failed');
    } finally {
      setSyllabusBusy(false);
    }
  }
  async function generateSyllabusPlan() {
    setSyllabusBusy(true);
    setError('');
    setPlanConfirmed(false);
    try {
      const response = await fetch('/api/admin/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: syllabus, input_type: 'syllabus' }),
        signal: AbortSignal.timeout(120000),
      });
      const result = await readJson(response);
      if (!response.ok || !result.course?.modules?.length)
        throw new Error(result.error || 'Curriculum generation failed');
      setSyllabusPlan({
        text: syllabus,
        modules: result.course.modules.map(
          (m: {
            title: string;
            lessons: Array<{ title: string; objectives: string[]; content: string }>;
          }) => ({
            title: m.title,
            lessons: m.lessons.map((l) => ({
              title: l.title,
              objectives: l.objectives,
              content: l.content,
            })),
          }),
        ),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Curriculum generation failed');
    } finally {
      setSyllabusBusy(false);
    }
  }
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
        ...(syllabusPlan && planConfirmed ? { syllabusPlan } : {}),
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
      <section
        aria-label="Create course from syllabus"
        className="space-y-3 rounded-lg border border-cyan-800 p-3"
      >
        <label className="block text-sm font-bold" htmlFor="new-course-syllabus">
          Upload syllabus (PDF, DOCX, TXT)
        </label>
        <input
          id="new-course-syllabus"
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={syllabusBusy || saving}
          onChange={(event) => void importSyllabus(event.target.files?.[0])}
          className="w-full text-sm"
        />
        {syllabus && (
          <>
            <textarea
              aria-label="New course syllabus text"
              value={syllabus}
              onChange={(event) => {
                setSyllabus(event.target.value);
                setSyllabusPlan(null);
                setPlanConfirmed(false);
              }}
              className="min-h-40 w-full rounded-lg bg-slate-950 p-3 text-sm"
            />
            <button
              type="button"
              disabled={syllabusBusy || saving}
              onClick={() => void generateSyllabusPlan()}
              className="min-h-11 rounded-lg border border-cyan-500 px-3"
            >
              {syllabusBusy ? 'Generating curriculum…' : 'Generate curriculum from syllabus'}
            </button>
          </>
        )}
        {syllabusPlan && (
          <>
            <ol className="space-y-3">
              {syllabusPlan.modules.map((module, mi) => (
                <li key={mi}>
                  <strong>{module.title}</strong>
                  <ol className="ml-4 list-decimal">
                    {module.lessons.map((lesson, li) => (
                      <li key={li}>
                        {lesson.title}
                        <p className="text-xs text-slate-300">{lesson.objectives.join('; ')}</p>
                        <details>
                          <summary>Review lesson instruction</summary>
                          <p className="whitespace-pre-wrap text-sm">{lesson.content}</p>
                        </details>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={planConfirmed}
                onChange={(event) => setPlanConfirmed(event.target.checked)}
              />
              Use this reviewed curriculum and syllabus for generation. Registered program
              requirements stay authoritative.
            </label>
          </>
        )}
      </section>
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
        <input
          name="googleModel"
          placeholder="Verified model ID"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <select
          name="googleLocation"
          defaultValue="us"
          aria-label="Google authoring location"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          <option value="us">United States multi-region</option>
          <option value="us-central1">Iowa region (supported models)</option>
          <option value="global">Global</option>
        </select>
        <span className="block text-slate-200">
          Use a model verified for this worker's Google region. Authorized teaching sources and all
          media acceptance checks remain required.
        </span>
      </label>
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving || syllabusBusy || Boolean(syllabus && (!syllabusPlan || !planConfirmed))}
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
  compact = false,
}: {
  course: CourseRow;
  programSlug: string;
  compact?: boolean;
}) {
  const courseWorkspace=useContext(CourseWorkspaceContext);
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
  useEffect(()=>{courseWorkspace.onBuild?.(latest?.id??'',course.id,latest?.status);},[latest?.id,latest?.status,course.id,courseWorkspace.onBuild]);
  const statusLoading = loading;
  const statusLoaded = buildsCourseId === course.id;
  const [lastStatusAt, setLastStatusAt] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [googleModel, setGoogleModel] = useState('');
  const [googleLocation, setGoogleLocation] = useState('us');
  const [syllabusText, setSyllabusText] = useState('');
  const [syllabusName, setSyllabusName] = useState('');
  const [syllabusBusy, setSyllabusBusy] = useState(false);
  const [syllabusConfirmed, setSyllabusConfirmed] = useState(false);
  const jobs: NonNullable<UltimateBuildRow['ultimate_build_jobs']> = orderCourseJobs(
    latest?.ultimate_build_jobs ?? [],
  );
  const activeJob = jobs.find((job) => courseExecutionState(job).active) ??
    jobs.find((job) => job.status === 'running') ??
    jobs.find((job) => job.status === 'queued' && job.available_at !== 'infinity');
  const savedWorkerJob = activeJob ?? jobs[0];
  const observed = courseExecutionState(savedWorkerJob);
  const workerJob =
    savedWorkerJob?.status === 'running' && !observed.active
      ? {
          ...savedWorkerJob,
          status: 'stalled',
          last_error:
            'Worker heartbeat is missing or stale. Resume preserves saved progress and respects the existing lease.',
        }
      : savedWorkerJob;
  const execution = courseExecutionState(savedWorkerJob, { paused: latest?.owner_paused === true });
  const previewReady =
    workerJob?.status === 'completed' && workerJob?.payload?.ownerPreview === true;

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
        {
          cache: 'no-store',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
        },
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
      setStatusError(
        reason instanceof Error ? reason.message : 'Unable to load Ultimate build status',
      );
    } finally {
      if (token === refreshToken.current) {
        setLoading(false);
        refreshController.current = null;
      }
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
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ultimate-course-builder/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: latest.id, enabled: !workerJob?.monitor?.enabled }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error || 'Autopilot setting could not be saved');
      setNotice(result.message);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Autopilot configuration failed');
    } finally {
      setBusy(false);
    }
  }

  async function startParallelAutopilots() {
    if (!latest) return;
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/admin/ultimate-course-builder/autopilot',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({buildId:latest.id,enabled:true,mode:'three-role-v1'}),signal:AbortSignal.timeout(25000),
      });
      const result=await readJson(response);
      if(!response.ok)throw Error(result.error || 'Parallel lesson teams could not start');
      setNotice(result.message);await refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:'Parallel lesson teams could not start');}
    finally{setBusy(false);}
  }

  async function loadSyllabus(file: File | undefined) {
    if (!file) return;
    setSyllabusBusy(true);
    setError('');
    setSyllabusConfirmed(false);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/admin/courses/generate/parse', {
        method: 'POST',
        body: form,
      });
      const result = await readJson(response);
      if (!response.ok || typeof result.raw_text !== 'string')
        throw new Error(result.error || 'Syllabus extraction failed');
      setSyllabusText(result.raw_text);
      setSyllabusName(file.name);
      setNotice('Syllabus extracted. Review the text, then attach it to this saved build.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Syllabus extraction failed');
    } finally {
      setSyllabusBusy(false);
    }
  }

  async function attachSyllabus() {
    if (!latest || !syllabusText.trim() || !syllabusConfirmed) return;
    setSyllabusBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ultimate-course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure-contract',
          buildId: latest.id,
          instructionalSources: [
            {
              id: `syllabus:${course.id}:${syllabusName || 'manual'}`,
              text: syllabusText.trim(),
            },
          ],
        }),
      });
      const result = await readJson(response);
      if (!response.ok || result.ok !== true)
        throw new Error(result.error || 'Could not save the instructional source');
      setNotice(
        'Syllabus attached to the saved Ultimate build. Review its contract and start the worker when ready.',
      );
      setSyllabusConfirmed(false);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Syllabus attachment failed');
    } finally {
      setSyllabusBusy(false);
    }
  }

  async function startBuild() {
    setBusy(true);
    setError('');
    try {
      setNotice('');
      if (latest) {
        const response = await fetch('/api/admin/ultimate-course-builder/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildId: latest.id }),
        });
        const payload = await readJson(response);
        if (!response.ok || (payload?.queued !== true && payload?.alreadyRunning !== true))
          throw new Error(payload?.error || 'The worker request could not be saved');
        if (payload.dispatched === false) {
          setError(payload.message || 'Course saved, but the Google worker has not started.');
        } else {
          setNotice(payload.message || 'Worker launch accepted. Waiting for a verified heartbeat.');
        }
      } else {
        const result = await startUltimateCourse({
          course,
          programSlug,
          googleModel,
          googleLocation,
        });
        setNotice(result.message || 'Build saved. Waiting for worker assignment.');
        if (result.dispatched === false)
          setError(
            'Build queued but the Google worker launch was not accepted. Confirm the GitHub dispatch connection in Dev Studio.',
          );
      }
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start Ultimate build');
    } finally {
      setBusy(false);
    }
  }

  async function pauseBuild() {
    if (!latest) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/ultimate-course-builder/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: latest.id }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error || 'Pause failed');
      setNotice(result.message);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pause failed');
    } finally {
      setBusy(false);
    }
  }

  async function startAcceptanceBuild() {
    setBusy(true);
    setError('');
    try {
      if (!/^gemini-[a-z0-9.-]+$/.test(googleModel.trim()))
        throw new Error('Enter a supported Google model ID');
      await startUltimateCourse({
        course,
        programSlug,
        googleModel,
        googleLocation,
        acceptanceBuild: true,
      });
      setNotice(
        'Separate acceptance build queued for this course. Previous builds and media remain preserved.',
      );
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start the acceptance build');
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

  const operations = (
    <div className="min-w-0">
      <section
        aria-label="Worker execution evidence"
        className="rounded-xl border border-cyan-800 bg-slate-950 p-4"
      >
        <h3 className="font-bold">
          Execution: {statusError ? 'unverified' : execution.phase.replaceAll('_', ' ')}
        </h3>
        <p className="mt-2 text-sm">
          Queue → dispatch request → claim → verified heartbeat → processing → completed
        </p>
        <p className="mt-2 text-xs text-slate-300">
          Only saved worker evidence confirms execution. Course lifecycle appears separately below.
        </p>
        <dl className="mt-3 space-y-2 break-all text-sm">
          <div>
            <dt>Dispatch request</dt>
            <dd>
              {workerJob?.monitor?.lastDispatch
                ? workerJob.monitor.lastDispatch.accepted
                  ? 'Accepted · awaiting worker evidence'
                  : 'Launch failed · saved queue preserved'
                : 'No dispatch acknowledgement recorded'}
            </dd>
          </div>
          <div>
            <dt>Assigned worker</dt>
            <dd>{workerJob?.lease_owner || 'No live assignment recorded'}</dd>
          </div>
          <div>
            <dt>Execution generation</dt>
            <dd>{workerJob?.execution_generation ?? 'Not assigned'}</dd>
          </div>
          <div>
            <dt>Heartbeat</dt>
            <dd>
              {statusError
                ? 'Unverified'
                : execution.active
                  ? 'Verified fresh heartbeat and lease'
                  : 'No verified live heartbeat'}
            </dd>
          </div>
        </dl>
      </section>
      {!statusLoading && latest ? (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Worker job</p>
          <p className="mt-1 text-sm font-bold text-slate-200">
            {workerJob?.status === 'queued'
              ? 'Awaiting worker assignment'
              : (workerJob?.status ?? 'Not started')}
          </p>
          {workerJob?.last_error ? (
            workerJob.status === "running" ? (
              <details className="mt-2 break-words text-sm text-slate-300">
                <summary>Previous attempt history — worker is running</summary>
                <p>{workerJob.last_error}</p>
              </details>
            ) : (
              <p
                role="alert"
                className="mt-2 break-words text-sm text-amber-200"
              >
                {workerJob.last_error}
              </p>
            )
          ) : null}
          {workerJob?.status === 'running' && !statusError && workerJob?.payload?.progress && (
            <div className="mt-3 space-y-2 text-white">
              <p>
                Worker activity:{' '}
                {workerJob.payload.progress.phase.replaceAll('_', ' ').replaceAll(':', ' · ')}
              </p>
              {typeof workerJob.payload.progress.total === 'number' &&
                workerJob.payload.progress.total > 0 && (
                  <>
                    <progress
                      aria-label="Current worker activity progress"
                      className="h-3 w-full"
                      max={workerJob.payload.progress.total}
                      value={Math.min(
                        workerJob.payload.progress.total,
                        workerJob.payload.progress.completed,
                      )}
                    />
                    <p className="text-sm">
                      {workerJob.payload.progress.completed} of {workerJob.payload.progress.total}{' '}
                      work units in this activity.
                    </p>
                  </>
                )}
            </div>
          )}
          {workerJob?.status === 'completed' && !['built', 'published'].includes(latest.status) ? (
            <p className="mt-2 hidden text-sm text-slate-200 sm:block">
              {previewReady
                ? 'The single-lesson preview finished. Full course validation and continuation have not run.'
                : 'This worker job finished. Course acceptance and release are still required.'}
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
          {statusError && lastStatusAt && (
            <span className="mt-1 block">
              Showing saved status. Live status could not be confirmed.
            </span>
          )}
        </p>
      ) : null}

      <div
        data-course-status-cards
        className="mt-5 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2 sm:gap-4"
      >
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Course lifecycle</p>
          <p className="mt-1 text-lg font-black text-white">
            {statusLoading
              ? 'loading…'
              : !statusLoaded || statusError
                ? 'Unavailable'
                : (latest?.status ?? 'not started')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Current stage</p>
          <p className="mt-1 break-words text-lg font-black text-white">
            {statusLoading
              ? 'loading…'
              : !statusLoaded || statusError
                ? 'Unavailable'
                : (latest?.current_step?.replaceAll('_', ' ') ?? 'Not started')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Saved work</p>
          <p className="mt-1 break-words text-sm font-bold text-slate-200">
            {statusLoading
              ? 'Loading course build…'
              : !statusLoaded || statusError
                ? 'Unavailable'
                : latest
                  ? 'Lesson checkpoints preserved'
                  : 'Saved when started'}
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

      {latest && <ParallelLessonAutopilots jobs={jobs} busy={busy || statusLoading} onStart={()=>void startParallelAutopilots()} />}
      {latest && workerJob && (
        <section
          aria-label="PARIS course autopilot"
          className="mt-5 rounded-xl border border-cyan-700 bg-slate-950 p-4 text-white"
        >
          <h3 className="font-bold">Automatic recovery center</h3>
          <p className="mt-2">
            The queue supervisor runs independently of this dashboard. Direct course controls do not
            require PARIS chat.
          </p>
          <p className="mt-2">
            {workerJob.monitor?.enabled ? 'Enabled' : 'Disabled'} ·{' '}
            {workerJob.monitor?.state?.replaceAll('_', ' ') || 'No supervisor observation yet'}
          </p>
          {workerJob.monitor?.enabled &&
            (!workerJob.monitor.checkedAt ||
              !Number.isFinite(Date.parse(workerJob.monitor.checkedAt)) ||
              Date.now() - Date.parse(workerJob.monitor.checkedAt) < 0 ||
              Date.now() - Date.parse(workerJob.monitor.checkedAt) > 600000) && (
              <p role="alert" className="mt-2 text-amber-200">
                Supervisor heartbeat is unconfirmed or stale. Monitoring is configured, but
                automatic execution is not verified.
              </p>
            )}
          <p className="mt-2 text-sm">
            Confirmed assignments: {workerJob.monitor?.confirmedAssignments ?? 0} · Recovery
            attempts: {workerJob.monitor?.recoveries ?? 0} · Worker attempts:{' '}
            {workerJob.attempts ?? 'Unavailable'} / {workerJob.max_attempts ?? 'Unavailable'}
          </p>
          {workerJob.monitor?.reason && (
            <p className="mt-2">
              {workerJob.monitor.reason === 'Owner pause or finished revision'
                ? 'A saved pause or finished-revision condition was reported. This does not establish who set it.'
                : workerJob.monitor.reason}
            </p>
          )}
          <p className="mt-2 text-sm text-slate-200">
            Repairs preserve saved lessons, respect active worker leases, and stop at retry limits
            or missing evidence. Publishing requires the existing quality checks.
          </p>
          <button
            type="button"
            onClick={() => void toggleAutopilot()}
            disabled={busy || statusLoading}
            className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
          >
            {workerJob.monitor?.enabled ? 'Pause PARIS autopilot' : 'Enable PARIS autopilot'}
          </button>
        </section>
      )}

      {latest && <details className="mt-4 rounded-xl border border-slate-700 p-3"><summary className="min-h-11 cursor-pointer font-bold">PARIS repair execution and production evidence</summary><ParisSupervisionPanel buildId={latest.id} /></details>}

      <details className="mt-4 rounded-xl border border-slate-700 p-3">
        <summary className="min-h-11 cursor-pointer font-bold">
          Worker logs and history ({jobs.length})
        </summary>
        <ol className="mt-3 space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="break-words rounded-lg bg-slate-950 p-3 text-sm">
              <p className="font-bold">
                {job.status} · Attempt {job.attempts ?? '—'} / {job.max_attempts ?? '—'}
              </p>
              <p className="break-all text-xs text-slate-400">{job.id}</p>
              {job.payload?.progress && <p>{job.payload.progress.phase.replaceAll('_', ' ')}</p>}
              {job.last_error && <p className="mt-2 text-amber-200">{job.last_error}</p>}
              {job.monitor?.state && (
                <p className="mt-2">
                  Recovery: {job.monitor.state.replaceAll('_', ' ')} ·{' '}
                  {job.monitor.reason || 'No recovery reason recorded'}
                </p>
              )}
            </li>
          ))}
        </ol>
      </details>
      {notice ? (
        <p role="status" className="mt-4 text-sm text-cyan-200">
          {notice}
        </p>
      ) : null}

      {statusLoaded &&
      (!latest || ['blocked', 'failed', 'built_with_findings'].includes(latest.status)) ? (
        <label className="mt-4 block space-y-2 text-sm">
          <span>Google model for source-grounded teaching (optional)</span>
          <input
            value={googleModel}
            onChange={(event) => setGoogleModel(event.target.value)}
            placeholder="Verified model ID"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <select
            value={googleLocation}
            onChange={(event) => setGoogleLocation(event.target.value)}
            aria-label="Google authoring location"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="us">United States multi-region</option>
            <option value="us-central1">Iowa region (supported models)</option>
            <option value="global">Global</option>
          </select>
          <span className="block text-slate-200">
            Set before starting this build. Authorized teaching sources and all media acceptance
            checks remain required.
          </span>
        </label>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {latest && ['blocked', 'failed', 'built_with_findings'].includes(latest.status) ? (
          <button
            type="button"
            onClick={() => void startAcceptanceBuild()}
            disabled={busy || !googleModel.trim() || execution.active}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            Start source-grounded acceptance build
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void startBuild()}
          disabled={
            busy || statusLoading || !statusLoaded || Boolean(statusError) || execution.active || latest?.status === 'published'
          }
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
        >
          {busy || statusLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {latest?.status === 'published'
            ? 'Course published'
            : statusLoading
            ? 'Loading build status…'
            : !statusLoaded
              ? 'Build status unavailable'
              : workerJob?.status === 'queued'
                ? 'Start Google worker'
                : execution.active
                  ? 'Ultimate build running'
                  : latest
                    ? 'Resume Ultimate build'
                    : 'Start Ultimate build'}
        </button>
        {latest && !['built', 'published', 'archived'].includes(latest.status) && (
          <button
            type="button"
            onClick={() => void pauseBuild()}
            disabled={busy || latest.owner_paused === true || Boolean(statusError)}
            className="min-h-11 rounded-lg border border-amber-500 px-4 py-2 font-bold disabled:opacity-50"
          >
            {latest.owner_paused ? 'Pause requested' : 'Pause at checkpoint'}
          </button>
        )}
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
  );

  return (
    <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-2 sm:rounded-2xl sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
            Ultimate Course Builder
          </p>
          <h2 className="mt-1 break-words text-lg font-black text-white sm:text-2xl">{course.title}</h2>
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={()=>void publish()} disabled={busy || latest?.status!=='built'}
          className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2 font-bold disabled:opacity-50">
          {latest?.status==='published' ? 'Published' : 'Publish course'}
        </button>
        <p className="text-sm text-slate-300">{latest?.status==='built' ? 'Ready for the release checks.' : latest?.status==='published' ? 'This course is live.' : 'Publication becomes available after build acceptance.'}</p>
      </div>
      <details
        aria-label="Syllabus instructional source"
        className="mt-5 rounded-xl border border-cyan-800 bg-slate-950 p-4 text-white"
      >
        <summary className="min-h-11 cursor-pointer font-bold">
          Upload syllabus for course production
        </summary>
        <p className="mt-1 text-sm text-slate-300">
          Extract PDF, DOCX, or TXT material and review the complete text before attaching it to the
          selected Ultimate build. This does not publish or replace lessons.
        </p>
        <label className="mt-3 block text-sm font-semibold" htmlFor={`syllabus-${course.id}`}>
          Syllabus document (10 MB maximum)
        </label>
        <input
          id={`syllabus-${course.id}`}
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={syllabusBusy}
          onChange={(event) => void loadSyllabus(event.target.files?.[0])}
          className="mt-2 block w-full rounded-lg border border-slate-700 p-2 text-sm"
        />
        {syllabusText && (
          <>
            <label
              className="mt-3 block text-sm font-semibold"
              htmlFor={`syllabus-text-${course.id}`}
            >
              Review extracted syllabus: {syllabusName}
            </label>
            <textarea
              id={`syllabus-text-${course.id}`}
              className="mt-2 min-h-40 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm"
              value={syllabusText}
              onChange={(event) => {
                setSyllabusText(event.target.value);
                setSyllabusConfirmed(false);
              }}
            />
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={syllabusConfirmed}
                onChange={(event) => setSyllabusConfirmed(event.target.checked)}
              />
              I reviewed this instructional source and authorize its use for this build.
            </label>
            <button
              type="button"
              disabled={
                !latest ||
                latest.status === 'running' ||
                syllabusBusy ||
                !syllabusConfirmed ||
                !syllabusText.trim()
              }
              onClick={() => void attachSyllabus()}
              className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
            >
              {syllabusBusy ? 'Processing…' : 'Attach approved syllabus to Ultimate build'}
            </button>
            {!latest && (
              <p className="mt-2 text-sm text-amber-200">
                Create a saved Ultimate build before attaching syllabus sources.
              </p>
            )}
          </>
        )}
      </details>
      <div className="mt-5">
        {latest ? (
          <UltimateStageInspector
            buildId={latest.id}
            updatedAt={latest.updated_at}
            operations={operations}
          />
        ) : (
          operations
        )}
      </div>
      <p className="mt-4 text-xs text-slate-300">
        Course Factory generation, blueprint execution, and standalone media queues are not
        available from this surface.
      </p>
    </section>
  );
}

