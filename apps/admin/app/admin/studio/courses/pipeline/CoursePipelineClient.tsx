'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen, CheckCircle, ChevronRight, Loader2,
  Play, RotateCcw, Sparkles, XCircle, Zap, Save,
} from 'lucide-react';

const DRAFT_KEY = 'course_pipeline_draft';

type Program = { id: string; title: string; slug: string };

type PipelineStage = 'blueprint' | 'lessons' | 'quizzes' | 'validate' | 'publish' | 'videos' | 'complete' | 'error';

type ProgressEvent = {
  stage: PipelineStage;
  message: string;
  result?: {
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
};

const STAGE_ORDER: PipelineStage[] = ['blueprint', 'lessons', 'quizzes', 'validate', 'publish', 'videos', 'complete'];

const STAGE_LABELS: Record<PipelineStage, string> = {
  blueprint: 'Generate Blueprint',
  lessons:   'Generate Lessons',
  quizzes:   'Generate Quizzes',
  validate:  'Validate Structure',
  publish:   'Publish to DB',
  videos:    'Queue Videos',
  complete:  'Complete',
  error:     'Error',
};

const STAGE_ICONS: Record<PipelineStage, React.ElementType> = {
  blueprint: Sparkles,
  lessons:   BookOpen,
  quizzes:   CheckCircle,
  validate:  CheckCircle,
  publish:   Zap,
  videos:    Play,
  complete:  CheckCircle,
  error:     XCircle,
};

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

function loadDraft(): DraftConfig | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(cfg: DraftConfig) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg));
  } catch { /* storage full — non-fatal */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export default function CoursePipelineClient({ programs }: { programs: Program[] }) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [programId, setProgramId] = useState('');
  const [moduleCount, setModuleCount] = useState(6);
  const [lessonsPerModule, setLessonsPerModule] = useState(5);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<ProgressEvent['result'] | null>(null);
  const [error, setError] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setTopic(draft.topic);
      setDifficulty(draft.difficulty);
      setProgramId(draft.programId);
      setModuleCount(draft.moduleCount);
      setLessonsPerModule(draft.lessonsPerModule);
      setIncludeVideos(draft.includeVideos);
      setDryRun(draft.dryRun);
      setDraftRestored(true);
    }
  }, []);

  // Autosave draft whenever config changes (debounced 1s)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAutosave = useCallback((cfg: DraftConfig) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraft(cfg);
      setLastSaved(new Date());
    }, 1000);
  }, []);

  const currentConfig = useCallback((): DraftConfig => ({
    title, topic, difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun,
  }), [title, topic, difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun]);

  useEffect(() => {
    // Don't autosave empty forms
    if (!title && !topic) return;
    triggerAutosave(currentConfig());
  }, [title, topic, difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun, triggerAutosave, currentConfig]);

  const addEvent = (evt: ProgressEvent) => {
    setEvents(prev => [...prev, evt]);
    setCurrentStage(evt.stage);
    setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleRun = async () => {
    if (!title || !topic || !programId) {
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
      const res = await fetch('/api/admin/courses/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, difficulty, programId, moduleCount, lessonsPerModule, includeVideos, dryRun }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Pipeline request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt: ProgressEvent = JSON.parse(line.slice(6));
            addEvent(evt);
            if (evt.stage === 'complete' && evt.result) {
              setResult(evt.result);
              if (evt.result.success && !evt.result.dryRun) clearDraft();
            }
            if (evt.stage === 'error') setError(evt.message);
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline failed');
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setEvents([]);
    setResult(null);
    setError('');
    setCurrentStage(null);
    setDraftRestored(false);
  };

  const discardDraft = () => {
    clearDraft();
    setTitle('');
    setTopic('');
    setDifficulty('intermediate');
    setProgramId('');
    setModuleCount(6);
    setLessonsPerModule(5);
    setIncludeVideos(false);
    setDryRun(false);
    setDraftRestored(false);
    setLastSaved(null);
  };

  const stageStatus = (stage: PipelineStage): 'pending' | 'active' | 'done' | 'error' => {
    if (!currentStage) return 'pending';
    if (currentStage === 'error') return stage === 'error' ? 'error' : 'pending';
    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    const stageIdx = STAGE_ORDER.indexOf(stage);
    if (stageIdx < currentIdx) return 'done';
    if (stageIdx === currentIdx) return running ? 'active' : 'done';
    return 'pending';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Course Generation Pipeline</h1>
          <p className="text-slate-400 text-sm mt-0.5">Blueprint → Lessons → Quizzes → Publish in one flow</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin/courses" className="hover:text-slate-300 transition-colors">All Courses</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/studio" className="hover:text-slate-300 transition-colors">Blueprint Builder</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300">Pipeline</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Course Configuration</h2>
              {lastSaved && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Save className="w-3 h-3" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {draftRestored && (
              <div className="bg-brand-blue-950/40 border border-brand-blue-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <p className="text-brand-blue-300 text-xs">Draft restored from your last session.</p>
                <button
                  onClick={discardDraft}
                  className="text-xs text-brand-blue-400 hover:text-brand-blue-200 underline flex-shrink-0"
                >
                  Discard
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={running}
                placeholder="EPA 608 Certification"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Topic / Description</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={running}
                rows={3}
                placeholder="HVAC refrigerant handling, EPA regulations, and certification requirements"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 disabled:opacity-50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Program</label>
              <select
                value={programId}
                onChange={e => setProgramId(e.target.value)}
                disabled={running}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500 disabled:opacity-50"
              >
                <option value="">Select program…</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Difficulty</label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    disabled={running}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize disabled:opacity-50 ${
                      difficulty === d
                        ? 'bg-brand-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Modules</label>
                <input
                  type="number"
                  min={2} max={12}
                  value={moduleCount}
                  onChange={e => setModuleCount(Number(e.target.value))}
                  disabled={running}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Lessons / Module</label>
                <input
                  type="number"
                  min={2} max={10}
                  value={lessonsPerModule}
                  onChange={e => setLessonsPerModule(Number(e.target.value))}
                  disabled={running}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVideos}
                  onChange={e => setIncludeVideos(e.target.checked)}
                  disabled={running}
                  className="rounded border-slate-600 bg-slate-800 text-brand-blue-600"
                />
                <span className="text-xs text-slate-300">Queue video generation after publish</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={e => setDryRun(e.target.checked)}
                  disabled={running}
                  className="rounded border-slate-600 bg-slate-800 text-brand-blue-600"
                />
                <span className="text-xs text-slate-300">Dry run (validate without writing to DB)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleRun}
                disabled={running || !title || !topic || !programId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {running ? 'Running…' : dryRun ? 'Dry Run' : 'Generate Course'}
              </button>
              {(events.length > 0 || result) && !running && (
                <button
                  onClick={reset}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="lg:col-span-3 space-y-4">

          {/* Stage tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Pipeline Stages</h2>
            <div className="space-y-2">
              {STAGE_ORDER.filter(s => s !== 'complete').map((stage, i) => {
                const status = stageStatus(stage);
                const Icon = STAGE_ICONS[stage];
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      status === 'done'   ? 'bg-green-900/50 text-green-400' :
                      status === 'active' ? 'bg-brand-blue-900/50 text-brand-blue-400' :
                      status === 'error'  ? 'bg-red-900/50 text-red-400' :
                      'bg-slate-800 text-slate-600'
                    }`}>
                      {status === 'active'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Icon className="w-3.5 h-3.5" />
                      }
                    </div>
                    <span className={`text-sm ${
                      status === 'done'   ? 'text-green-400' :
                      status === 'active' ? 'text-white font-medium' :
                      status === 'error'  ? 'text-red-400' :
                      'text-slate-500'
                    }`}>
                      {STAGE_LABELS[stage]}
                    </span>
                    {i < STAGE_ORDER.filter(s => s !== 'complete').length - 1 && (
                      <div className={`flex-1 h-px ${status === 'done' ? 'bg-green-800' : 'bg-slate-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live log */}
          {events.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Progress Log</h2>
              <div
                ref={logRef}
                className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs"
              >
                {events.map((evt, i) => (
                  <div key={i} className={`flex gap-2 ${
                    evt.stage === 'error' ? 'text-red-400' :
                    evt.stage === 'complete' ? 'text-green-400' :
                    'text-slate-300'
                  }`}>
                    <span className="text-slate-600 flex-shrink-0">[{evt.stage}]</span>
                    <span>{evt.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-5 ${
              result.success
                ? 'bg-green-950/30 border-green-800'
                : 'bg-red-950/30 border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {result.success
                  ? <CheckCircle className="w-5 h-5 text-green-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />
                }
                <h2 className={`font-semibold ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                  {result.dryRun ? 'Dry Run Complete' : result.success ? 'Course Published' : 'Pipeline Failed'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-slate-400 text-xs">Title</p>
                  <p className="text-white font-medium">{result.title}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Modules</p>
                  <p className="text-white font-medium">{result.modulesGenerated}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Lessons</p>
                  <p className="text-white font-medium">{result.lessonsGenerated}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">With Quizzes</p>
                  <p className="text-white font-medium">{result.lessonsWithQuizzes}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-1 mb-3">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-red-300 text-xs">{e}</p>
                  ))}
                </div>
              )}

              {result.success && result.courseId && !result.dryRun && (
                <div className="flex gap-2">
                  <Link
                    href={`/admin/courses/${result.courseId}`}
                    className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View Course →
                  </Link>
                  <Link
                    href={`/admin/studio/result.courseId`}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Edit Curriculum
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {events.length === 0 && !result && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Configure your course and click Generate to start the pipeline.</p>
              <p className="text-slate-600 text-xs mt-1">
                Estimated time: ~2–4 minutes for a 6-module course
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
