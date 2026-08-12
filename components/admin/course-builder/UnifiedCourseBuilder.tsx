'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Bot,
  Boxes,
  CheckCircle2,
  FileCheck2,
  FileUp,
  FlaskConical,
  GitBranch,
  Loader2,
  PackageOpen,
  RefreshCw,
  Sparkles,
  Video,
} from 'lucide-react';
import CourseInteractionStudio from './CourseInteractionStudio';
import CourseGovernancePanel from './CourseGovernancePanel';
import CourseScormPanel from './CourseScormPanel';

const LiveCourseBuilder = dynamic(() => import('./LiveCourseBuilder'), { ssr: false });
const AutomaticCourseBuilder = dynamic(() => import('@/components/course/AutomaticCourseBuilder'), { ssr: false });
const CourseIngestionWizard = dynamic(() => import('./import/CourseIngestionWizard'), { ssr: false });
const CoursePipelineClient = dynamic(() => import('./CoursePipelineClient'), { ssr: false });
const VideoStudio = dynamic(() => import('@/apps/admin/app/video-generator/VideoGeneratorClient'), { ssr: false });

type Tab = 'build' | 'ai' | 'import' | 'pipeline' | 'blueprints' | 'media' | 'interactions' | 'assessments' | 'compliance' | 'scorm';
type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  program_id?: string | null;
  status?: string;
  duration_hours?: number | null;
  passing_score?: number | null;
  review_status?: string | null;
  compliance_profile_key?: string | null;
  governing_body?: string | null;
  governing_region?: string | null;
  governing_standard_version?: string | null;
};
type ProgramRow = { id: string; title: string; slug?: string };
type WorkspacePayload = { course: CourseRow; modules: any[] };
type BlueprintRow = { id: string; title: string; slug: string; state?: string | null; modules: number; lessons: number; status?: string };

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'build', label: 'Build', icon: BookOpen },
  { id: 'ai', label: 'AI Generate', icon: Sparkles },
  { id: 'import', label: 'Import', icon: FileUp },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'blueprints', label: 'Blueprints', icon: Boxes },
  { id: 'media', label: 'Video + Audio', icon: Video },
  { id: 'interactions', label: 'Interactive', icon: FlaskConical },
  { id: 'assessments', label: 'Assessments', icon: FileCheck2 },
  { id: 'compliance', label: 'Governance', icon: CheckCircle2 },
  { id: 'scorm', label: 'SCORM', icon: PackageOpen },
];
const TAB_IDS = new Set(TABS.map((tab) => tab.id));

export default function UnifiedCourseBuilder() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as Tab | null;
  const requestedCourseId = searchParams.get('courseId') ?? '';
  const [tab, setTab] = useState<Tab>(requestedTab && TAB_IDS.has(requestedTab) ? requestedTab : 'build');
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [courseId, setCourseId] = useState(requestedCourseId);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);

  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId) ?? workspace?.course ?? null, [courses, courseId, workspace?.course]);

  async function loadCourses(preferredId?: string) {
    const response = await fetch('/api/admin/courses', { cache: 'no-store' });
    const data = await response.json().catch(() => []);
    const rows = Array.isArray(data) ? data : Array.isArray(data?.courses) ? data.courses : [];
    setCourses(rows);
    const target = preferredId || courseId || requestedCourseId || rows[0]?.id || '';
    if (target && target !== courseId) setCourseId(target);
  }

  async function loadPrograms() {
    try {
      const response = await fetch('/api/admin/programs', { cache: 'no-store' });
      const data = await response.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.programs) ? data.programs : Array.isArray(data?.data) ? data.data : [];
      setPrograms(rows.map((row: any) => ({ id: row.id, title: row.title ?? row.name ?? 'Untitled program', slug: row.slug })));
    } catch { setPrograms([]); }
  }

  async function loadWorkspace(id = courseId) {
    if (!id) { setWorkspace(null); return; }
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/course-builder/course?courseId=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to load course');
      setWorkspace({ course: data.course, modules: data.modules ?? [] });
    } catch (error) {
      setWorkspace(null);
      setMessage(error instanceof Error ? error.message : 'Unable to load course');
    } finally { setLoading(false); }
  }

  async function selectGeneratedCourse(id: string, nextTab: Tab = 'build') {
    await loadCourses(id);
    setCourseId(id);
    setTab(nextTab);
    await loadWorkspace(id);
  }

  useEffect(() => { void Promise.all([loadCourses(requestedCourseId), loadPrograms()]); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (courseId) void loadWorkspace(courseId); }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (requestedTab && TAB_IDS.has(requestedTab)) setTab(requestedTab);
    if (requestedCourseId && requestedCourseId !== courseId) setCourseId(requestedCourseId);
  }, [requestedTab, requestedCourseId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab !== 'blueprints' || blueprints.length) return;
    fetch('/api/admin/course-builder/load-blueprint')
      .then((response) => response.json())
      .then((data) => setBlueprints(Array.isArray(data.blueprints) ? data.blueprints : []))
      .catch(() => setBlueprints([]));
  }, [tab, blueprints.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400"><Bot className="h-4 w-4" />Unified Course Factory</div>
            <h1 className="mt-1 text-2xl font-black text-white">Course Builder</h1>
            <p className="text-sm text-slate-400">One authoring surface for manual editing, AI generation, document ingestion, pipeline builds, media, interactions, assessments, governance and SCORM.</p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="min-h-10 min-w-[300px] rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <option value="">Select a course…</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title} — {course.status ?? 'draft'}</option>)}
            </select>
            <button onClick={() => void loadWorkspace()} disabled={!courseId || loading} className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 disabled:opacity-50" title="Refresh course"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-slate-800 bg-slate-900/70 px-4 py-2">
        <div className="mx-auto flex max-w-[1600px] gap-2">
          {TABS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
      </div>

      {message && <div className="mx-auto mt-4 max-w-[1600px] rounded-lg border border-amber-700 bg-amber-950/50 px-4 py-3 text-sm text-amber-200">{message}</div>}

      <main className="mx-auto max-w-[1600px] p-4">
        {tab === 'build' && (!courseId ? <CreateCoursePanel onCreated={(id) => selectGeneratedCourse(id, 'build')} /> : loading ? <Loading /> : workspace ? <LiveCourseBuilder courseId={workspace.course.id} courseTitle={workspace.course.title} initialModules={workspace.modules} lmsBaseUrl="https://app.elevateforhumanity.org" /> : <CreateCoursePanel onCreated={(id) => selectGeneratedCourse(id, 'build')} />)}
        {tab === 'ai' && <div className="rounded-2xl bg-white p-6 text-slate-900"><AutomaticCourseBuilder /></div>}
        {tab === 'import' && <div className="rounded-2xl bg-slate-50 p-5"><CourseIngestionWizard programs={programs} /></div>}
        {tab === 'pipeline' && <CoursePipelineClient programs={programs} onCourseCreated={(id) => void selectGeneratedCourse(id, 'build')} />}
        {tab === 'blueprints' && <BlueprintPanel blueprints={blueprints} selectedCourse={selectedCourse} onGenerated={(id) => selectGeneratedCourse(id, 'build')} />}
        {tab === 'media' && <div className="overflow-hidden rounded-2xl bg-white text-slate-900"><VideoStudio /></div>}
        {tab === 'interactions' && (workspace ? <CourseInteractionStudio courseTitle={workspace.course.title} modules={workspace.modules} /> : <SelectCourseNotice />)}
        {tab === 'assessments' && <AssessmentPanel workspace={workspace} onChanged={() => void loadWorkspace()} />}
        {tab === 'compliance' && (workspace ? <CourseGovernancePanel course={workspace.course} modules={workspace.modules} programs={programs} onChanged={() => void loadWorkspace()} /> : <SelectCourseNotice />)}
        {tab === 'scorm' && (workspace ? <CourseScormPanel courseId={workspace.course.id} courseTitle={workspace.course.title} /> : <SelectCourseNotice />)}
      </main>
    </div>
  );
}

function Loading() { return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>; }
function SelectCourseNotice() { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Select a course first.</div>; }

function CreateCoursePanel({ onCreated }: { onCreated: (id: string) => void | Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.get('title'), slug: form.get('slug'), description: form.get('description'), programId: form.get('programId') || undefined, status: 'draft' }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to create course');
      const row = Array.isArray(body) ? body[0] : body;
      if (!row?.id) throw new Error('Course created but no ID was returned');
      await onCreated(row.id);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create course'); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-bold">Create course</h2><input name="title" required placeholder="Course title" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /><input name="slug" required placeholder="course-slug" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /><textarea name="description" required rows={5} placeholder="Description" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /><input name="programId" placeholder="Program UUID (optional)" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />{error && <p className="text-sm text-red-300">{error}</p>}<button disabled={saving} className="rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{saving ? 'Creating…' : 'Create and open'}</button></form>;
}

function BlueprintPanel({ blueprints, selectedCourse, onGenerated }: { blueprints: BlueprintRow[]; selectedCourse: CourseRow | null; onGenerated: (id: string) => void | Promise<void> }) {
  const [blueprintId, setBlueprintId] = useState('');
  const [programId, setProgramId] = useState(selectedCourse?.program_id ?? '');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');
  useEffect(() => { if (selectedCourse?.program_id) setProgramId(selectedCourse.program_id); }, [selectedCourse?.program_id]);
  async function generate() {
    if (!blueprintId || !programId) return setResult('Select a blueprint and link a program first.');
    setRunning(true); setResult('');
    try {
      const response = await fetch('/api/admin/course-builder/generate-from-blueprint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blueprintId, programId, mode: 'missing-only', contentSource: 'ai', videoMode: 'queue' }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error((data.errors ?? [data.error ?? 'Generation failed']).join('; '));
      setResult(`Generated ${data.moduleCount ?? 0} modules and ${data.lessonCount ?? 0} lessons.`);
      if (data.courseId) await onGenerated(data.courseId);
    } catch (error) { setResult(error instanceof Error ? error.message : 'Generation failed'); } finally { setRunning(false); }
  }
  return <div className="grid gap-4 lg:grid-cols-[1fr_360px]"><div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-bold">Blueprint library</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{blueprints.map((blueprint) => <button key={blueprint.id} onClick={() => setBlueprintId(blueprint.id)} className={`rounded-xl border p-4 text-left ${blueprintId === blueprint.id ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}><div className="font-bold">{blueprint.title}</div><div className="mt-1 text-xs text-slate-400">{blueprint.state ?? 'Multi-state'} · {blueprint.modules} modules · {blueprint.lessons} lessons</div><div className="mt-2 font-mono text-[11px] text-slate-500">{blueprint.id}</div></button>)}</div></div><aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-bold">Build from blueprint</h3><input value={programId} onChange={(event) => setProgramId(event.target.value)} placeholder="Program UUID" className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /><button onClick={generate} disabled={running || !blueprintId} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generate + enrich + media</button>{result && <p className="mt-3 text-sm text-slate-300">{result}</p>}</aside></div>;
}

function AssessmentPanel({ workspace, onChanged }: { workspace: WorkspacePayload | null; onChanged: () => void }) {
  const assessments = workspace?.modules.flatMap((module: any) => (module.lessons ?? []).map((lesson: any) => ({ ...lesson, moduleTitle: module.title }))).filter((lesson: any) => ['quiz','checkpoint','exam'].includes(lesson.step_type)) ?? [];
  const [runningId, setRunningId] = useState('');
  async function hydrate(lesson: any) {
    setRunningId(lesson.id);
    try { await fetch('/api/admin/course-builder/hydrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id, lessonType: lesson.step_type === 'exam' ? 'exam' : 'checkpoint', moduleTitle: lesson.moduleTitle, courseTitle: workspace?.course.title, passingScore: lesson.passing_score ?? 70 }) }); onChanged(); } finally { setRunningId(''); }
  }
  if (!workspace) return <SelectCourseNotice />;
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-bold">Assessment studio</h2><div className="mt-4 space-y-2">{assessments.length ? assessments.map((lesson: any) => <div key={lesson.id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 p-3"><div><div className="font-semibold">{lesson.title}</div><div className="text-xs text-slate-500">{lesson.step_type} · pass {lesson.passing_score ?? 70}%</div></div><button onClick={() => void hydrate(lesson)} disabled={runningId === lesson.id} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">{runningId === lesson.id ? 'Generating…' : 'Generate / refresh questions'}</button></div>) : <p className="text-sm text-slate-400">No quiz, checkpoint or exam lessons found.</p>}</div></div>;
}
