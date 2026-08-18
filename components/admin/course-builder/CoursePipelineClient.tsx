'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle, Loader2, Play, RotateCcw, Save, Sparkles, XCircle, Zap } from 'lucide-react';
import { runCourseFactoryPipeline } from './runCourseFactoryPipeline';

const DRAFT_KEY = 'course_pipeline_draft';
type Program = { id: string; title: string; slug?: string };
type PipelineStage = 'blueprint' | 'lessons' | 'quizzes' | 'validate' | 'publish' | 'videos' | 'complete' | 'error';
type PipelineResult = {
  success: boolean;
  courseId: string | null;
  title: string;
  modulesGenerated: number;
  lessonsGenerated: number;
  lessonsWithQuizzes: number;
  videosQueued: number;
  errors: string[];
  dryRun: boolean;
};
type ProgressEvent = { stage: PipelineStage; message: string; result?: PipelineResult };
type DraftConfig = {
  title: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  programId: string;
  moduleCount: number;
  lessonsPerModule: number;
  includeVideos: boolean;
  dryRun: boolean;
};

const STAGES: Array<{ id: PipelineStage; label: string; icon: React.ElementType }> = [
  { id: 'blueprint', label: 'Generate Blueprint', icon: Sparkles },
  { id: 'lessons', label: 'Generate Lessons', icon: BookOpen },
  { id: 'quizzes', label: 'Generate Assessments', icon: CheckCircle },
  { id: 'validate', label: 'Validate Structure', icon: CheckCircle },
  { id: 'publish', label: 'Persist Draft', icon: Zap },
  { id: 'videos', label: 'Queue Videos', icon: Play },
];

function loadDraft(): DraftConfig | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(config: DraftConfig) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
  } catch {
    return;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    return;
  }
}

export default function CoursePipelineClient({ programs, onCourseCreated }: { programs: Program[]; onCourseCreated?: (courseId: string) => void }) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DraftConfig['difficulty']>('intermediate');
  const [programId, setProgramId] = useState('');
  const [moduleCount, setModuleCount] = useState(6);
  const [lessonsPerModule, setLessonsPerModule] = useState(5);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setTitle(draft.title);
    setTopic(draft.topic);
    setDifficulty(draft.difficulty);
    setProgramId(draft.programId);
    setModuleCount(draft.moduleCount);
    setLessonsPerModule(draft.lessonsPerModule);
    setIncludeVideos(draft.includeVideos);
    setDryRun(draft.dryRun);
    setDraftRestored(true);
  }, []);

  const currentConfig = useCallback(
    (): DraftConfig => ({ title, topic, difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun }),
    [title, topic, difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun],
  );

  useEffect(() => {
    if (!title && !topic) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraft(currentConfig());
      setLastSaved(new Date());
    }, 800);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [currentConfig, title, topic]);

  function addEvent(event: ProgressEvent) {
    setEvents((prev) => [...prev, event]);
    setCurrentStage(event.stage);
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 25);
  }

  async function run() {
    if (!title.trim() || !topic.trim() || !programId) {
      setError('Title, topic, and program are required.');
      return;
    }
    setRunning(true);
    setEvents([]);
    setResult(null);
    setError('');
    setCurrentStage('blueprint');
    setDraftRestored(false);
    try {
      const completed = await runCourseFactoryPipeline(
        { title: title.trim(), topic: topic.trim(), difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun },
        (event) => addEvent(event as ProgressEvent),
      );
      setResult(completed);
      if (!completed.dryRun) {
        clearDraft();
        if (completed.courseId) onCourseCreated?.(completed.courseId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline failed');
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setEvents([]);
    setResult(null);
    setError('');
    setCurrentStage(null);
  }

  function discardDraft() {
    clearDraft();
    setTitle('');
    setTopic('');
    setDifficulty('intermediate');
    setProgramId('');
    setModuleCount(6);
    setLessonsPerModule(5);
    setIncludeVideos(false);
    setDryRun(true);
    setDraftRestored(false);
    setLastSaved(null);
  }

  const currentIndex = currentStage ? STAGES.findIndex((stage) => stage.id === currentStage) : -1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-2 text-white">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold">Course Factory Pipeline</h2>
          <p className="mt-1 text-sm text-slate-400">Blueprint → lessons → assessments → validation → persistence → media queue.</p>
        </div>
        {lastSaved && <span className="flex items-center gap-1 text-xs text-slate-500"><Save className="h-3 w-3" />Draft saved {lastSaved.toLocaleTimeString()}</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          {draftRestored && <div className="flex items-center justify-between gap-2 rounded-lg border border-brand-blue-800 bg-brand-blue-950/40 px-3 py-2 text-xs text-brand-blue-200"><span>Restored your unfinished pipeline configuration.</span><button type="button" onClick={discardDraft} className="underline">Discard</button></div>}
          {error && <div className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-300">{error}</div>}
          <Field label="Course Title"><input value={title} onChange={(e) => setTitle(e.target.value)} disabled={running} placeholder="EPA 608 Certification" className="darkInput" /></Field>
          <Field label="Topic / Description"><textarea value={topic} onChange={(e) => setTopic(e.target.value)} disabled={running} rows={4} placeholder="Scope, standards, job tasks, and credential alignment" className="darkInput resize-y" /></Field>
          <Field label="Program"><select value={programId} onChange={(e) => setProgramId(e.target.value)} disabled={running} className="darkInput"><option value="">Select program…</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></Field>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Difficulty</label><div className="flex gap-2">{(['beginner', 'intermediate', 'advanced'] as const).map((level) => <button type="button" key={level} onClick={() => setDifficulty(level)} disabled={running} className={`flex-1 rounded-lg border px-2 py-2 text-xs capitalize ${difficulty === level ? 'border-brand-blue-500 bg-brand-blue-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{level}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Modules"><input type="number" min={2} max={12} value={moduleCount} onChange={(e) => setModuleCount(Number(e.target.value))} disabled={running} className="darkInput" /></Field><Field label="Lessons / Module"><input type="number" min={2} max={10} value={lessonsPerModule} onChange={(e) => setLessonsPerModule(Number(e.target.value))} disabled={running} className="darkInput" /></Field></div>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={includeVideos} onChange={(e) => setIncludeVideos(e.target.checked)} disabled={running} />Queue video generation after persistence</label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} disabled={running} />Dry run first — validate without writing to the database</label>
          <div className="flex gap-2"><button type="button" onClick={run} disabled={running || !title.trim() || !topic.trim() || !programId} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-40">{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{running ? 'Running…' : dryRun ? 'Run Validation' : 'Generate Draft'}</button>{(events.length > 0 || result) && !running && <button type="button" onClick={reset} className="rounded-lg border border-slate-700 bg-slate-800 px-3" aria-label="Reset pipeline result"><RotateCcw className="h-4 w-4" /></button>}</div>
        </section>

        <section className="space-y-4 lg:col-span-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h3 className="mb-4 text-sm font-semibold text-slate-300">Pipeline Stages</h3><div className="space-y-2">{STAGES.map((stage, index) => { const Icon = stage.icon; const active = currentStage === stage.id; const done = currentIndex > index || Boolean(result?.success && currentIndex === index); return <div key={stage.id} className="flex items-center gap-3"><div className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-green-900/50 text-green-400' : active ? 'bg-brand-blue-900/50 text-brand-blue-400' : 'bg-slate-800 text-slate-600'}`}>{active && running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}</div><span className={`text-sm ${done ? 'text-green-400' : active ? 'font-medium text-white' : 'text-slate-500'}`}>{stage.label}</span></div>; })}</div></div>
          {events.length > 0 && <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Progress Log</h3><div ref={logRef} className="max-h-52 space-y-1.5 overflow-y-auto font-mono text-xs">{events.map((event, index) => <div key={`${event.stage}-${index}`} className={event.stage === 'error' ? 'text-red-400' : event.stage === 'complete' ? 'text-green-400' : 'text-slate-300'}><span className="mr-2 text-slate-600">[{event.stage}]</span>{event.message}</div>)}</div></div>}
          {result && <div className={`rounded-xl border p-5 ${result.success ? 'border-green-800 bg-green-950/30' : 'border-red-800 bg-red-950/30'}`}><div className="mb-3 flex items-center gap-2">{result.success ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}<h3 className="font-semibold">{result.dryRun ? 'Dry Run Complete' : result.success ? 'Draft Generated' : 'Pipeline Failed'}</h3></div><div className="grid grid-cols-2 gap-3 text-sm"><Metric label="Modules" value={result.modulesGenerated} /><Metric label="Lessons" value={result.lessonsGenerated} /><Metric label="Assessments" value={result.lessonsWithQuizzes} /><Metric label="Videos queued" value={result.videosQueued} /></div>{result.errors?.length > 0 && <div className="mt-3 space-y-1 text-xs text-red-300">{result.errors.map((item, i) => <p key={i}>{item}</p>)}</div>}{result.success && result.courseId && !result.dryRun && <button type="button" onClick={() => onCourseCreated?.(result.courseId!)} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium hover:bg-green-600">Open generated course</button>}</div>}
          {!events.length && !result && <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center"><Sparkles className="mx-auto mb-3 h-10 w-10 text-slate-700" /><p className="text-sm text-slate-400">Configure the course and run a dry validation before persisting.</p></div>}
        </section>
      </div>

      <style jsx>{`.darkInput{width:100%;border:1px solid rgb(51 65 85);border-radius:.5rem;background:rgb(30 41 59);padding:.55rem .75rem;color:white;font-size:.875rem}.darkInput:focus{outline:none;border-color:rgb(59 130 246);box-shadow:0 0 0 1px rgb(59 130 246)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>{children}</div>;
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className="font-medium text-white">{String(value ?? 0)}</p></div>;
}
