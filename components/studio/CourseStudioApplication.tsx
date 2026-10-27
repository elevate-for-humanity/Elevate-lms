'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  HelpCircle,
  Video,
  Rocket,
  MousePointer2,
  ClipboardCheck,
  ShieldCheck,
  Zap,
  Bot,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Menu,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useCourse, type StudioPanel } from './CourseProvider';
import { ResizableWorkspace } from './ResizableWorkspace';

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), { ssr: false });

const PANELS: Array<{
  id: StudioPanel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  { id: 'blueprint', label: 'Blueprint', icon: Layers, description: 'Course structure & settings' },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen, description: 'Lessons & content' },
  { id: 'quiz', label: 'Quizzes', icon: HelpCircle, description: 'Assessments & questions' },
  { id: 'media', label: 'Media', icon: Video, description: 'Videos & attachments' },
  { id: 'automation', label: 'Automation', icon: Zap, description: 'Workflows & triggers' },
  {
    id: 'interactions',
    label: 'Interactive',
    icon: MousePointer2,
    description: 'Lesson interactions',
  },
  {
    id: 'assessments',
    label: 'Assessments',
    icon: ClipboardCheck,
    description: 'Questions & exams',
  },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, description: 'Readiness & evidence' },
  { id: 'publish', label: 'Publish', icon: Rocket, description: 'Review & publish' },
];

function AutosaveIndicator() {
  const { state } = useCourse();
  const { isDirty, isSaving, lastSavedAt, error } = state.autosave;

  if (error)
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-600">
        <AlertCircle className="w-3.5 h-3.5" />
        Save failed
      </span>
    );
  if (isSaving)
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500 animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        Saving…
      </span>
    );
  if (isDirty)
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <Save className="w-3.5 h-3.5" />
        Unsaved changes
      </span>
    );
  if (lastSavedAt)
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle className="w-3.5 h-3.5" />
        Saved
      </span>
    );
  return null;
}

function StudioTopbar({
  previewOpen,
  onTogglePreview,
  embedded,
}: {
  previewOpen: boolean;
  onTogglePreview: () => void;
  embedded: boolean;
}) {
  const { state, save, setPanel } = useCourse();
  const { course, publishState } = state;

  return (
    <header className="min-h-14 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2 px-3 py-2 shrink-0">
      {embedded ? (
        <span className="hidden text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700 sm:inline">
          Course workspace
        </span>
      ) : (
        <Link
          href="/studio/courses"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Course Builder</span>
        </Link>
      )}
      <div className="w-px h-5 bg-slate-200 shrink-0" />
      <h1 className="text-sm font-semibold text-slate-900 truncate flex-1 min-w-0">
        {course.title}
      </h1>
      <span
        className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700' : course.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}
      >
        {course.status}
      </span>
      <AutosaveIndicator />
      {state.warnings.length > 0 && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {state.warnings.length} warning{state.warnings.length > 1 ? 's' : ''}
        </span>
      )}
      <button
        onClick={() => void save()}
        disabled={!state.autosave.isDirty}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <Save className="w-3.5 h-3.5" />
        Save
      </button>
      <button
        onClick={() => setPanel('ai')}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Bot className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Commands</span>
      </button>
      <button
        onClick={onTogglePreview}
        aria-pressed={previewOpen}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${previewOpen ? 'border-brand-blue-300 bg-brand-blue-50 text-brand-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {previewOpen ? 'Hide learner view' : 'Show learner view'}
        </span>
      </button>
      <button
        onClick={() => setPanel('publish')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${publishState.isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'}`}
      >
        <Rocket className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {publishState.isPublished ? 'Published' : 'Publish'}
        </span>
      </button>
    </header>
  );
}

function StudioSidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}) {
  const { state, setPanel } = useCourse();
  return (
    <aside
      className={`flex flex-col border-r border-slate-200 bg-white shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
    >
      <div className="h-10 flex items-center justify-end px-2 border-b border-slate-100">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="p-1 rounded hover:bg-slate-100 text-slate-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const isActive = state.activePanel === panel.id;
          return (
            <button
              key={panel.id}
              onClick={() => setPanel(panel.id)}
              title={collapsed ? panel.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${isActive ? 'bg-brand-blue-50 text-brand-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-blue-600' : ''}`} />
              {!collapsed && <span className="text-sm truncate">{panel.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 py-2">
        <button
          onClick={() => setPanel('ai')}
          title={collapsed ? 'AI Assistant' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${state.activePanel === 'ai' ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <Bot
            className={`w-5 h-5 shrink-0 ${state.activePanel === 'ai' ? 'text-violet-600' : ''}`}
          />
          {!collapsed && <span className="text-sm">AI Assistant</span>}
        </button>
      </div>
    </aside>
  );
}

function PublishProgress() {
  const { state, setPanel } = useCourse();
  const [readiness, setReadiness] = useState<{ pass: boolean; metrics: Record<string, unknown>; blocking_issues: string[] } | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/course-builder/audit?courseId=${encodeURIComponent(state.course.id)}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((body) => { if (active && body?.result) setReadiness(body.result); })
      .catch(() => { if (active) setReadiness(null); });
    return () => { active = false; };
  }, [state.course.id, state.autosave.lastSavedAt]);
  if (!readiness) return null;
  const metrics = readiness.metrics ?? {};
  const totalLessons = Number(metrics.lessons ?? state.lessons.length ?? 0);
  const validated = Number(metrics.validatedLessons ?? 0);
  const videoTotal = Number(metrics.lessonVideoJobs ?? 0);
  const videos = Number(metrics.completedVideoJobs ?? 0);
  const lessonPct = totalLessons ? validated / totalLessons : 0;
  const mediaPct = videoTotal ? videos / videoTotal : 1;
  const pct = readiness.pass ? 100 : Math.max(0, Math.min(99, Math.round(((lessonPct + mediaPct) / 2) * 100)));
  return (
    <button type="button" onClick={() => setPanel('compliance')} className="relative h-6 w-full shrink-0 bg-slate-100 text-left" title="Open persisted course readiness">
      <div className="absolute inset-y-0 left-0 bg-brand-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      <span className="relative z-10 flex h-full items-center justify-center text-[10px] font-bold text-slate-900">
        {readiness.pass ? 'Ready for publication' : `${pct}% readiness · ${readiness.blocking_issues.length} blocker${readiness.blocking_issues.length === 1 ? '' : 's'}`}
      </span>
    </button>
  );
}

export function CourseStudioApplication({
  children,
  embedded = false,
}: {
  children: React.ReactNode;
  embedded?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [browserMode, setBrowserMode] = useState<'learner' | 'cloud'>('learner');
  const [cloudBrowserVisited, setCloudBrowserVisited] = useState(false);
  const { state } = useCourse();
  const previewUrl = `/api/admin/course-builder/preview?courseId=${encodeURIComponent(state.course.id)}`;

  return (
    <div
      className={
        embedded
          ? 'flex h-[calc(100dvh-10rem)] min-h-[34rem] min-w-0 flex-col bg-slate-50'
          : 'flex h-dvh min-w-0 flex-col overflow-hidden bg-slate-50'
      }
    >
      <StudioTopbar
        previewOpen={previewOpen && browserMode === 'learner'}
        onTogglePreview={() => {
          setPreviewOpen(browserMode !== 'learner' || !previewOpen);
          setBrowserMode('learner');
        }}
        embedded={embedded}
      />
      <PublishProgress />
      <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 bg-slate-950 px-3 py-2 text-white">
        <button
          type="button"
          onClick={() => {
            setBrowserMode('learner');
            setPreviewOpen(true);
          }}
          aria-pressed={previewOpen && browserMode === 'learner'}
          className="min-h-11 rounded-lg border border-cyan-500/50 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10"
        >
          Learner preview
        </button>
        <button
          type="button"
          onClick={() => {
            setBrowserMode('cloud');
            setCloudBrowserVisited(true);
            setPreviewOpen(true);
          }}
          aria-pressed={previewOpen && browserMode === 'cloud'}
          className="min-h-11 rounded-lg border border-cyan-500/50 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10"
        >
          Cloud Studio browser
        </button>
      </div>
      <ResizableWorkspace
        className="min-h-0 flex-1"
        title="Course side panel"
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        panel={
          <>
            <aside
              hidden={browserMode !== 'learner'}
              className={browserMode === 'learner' ? 'flex h-full min-h-0 flex-col overflow-hidden bg-white' : 'hidden'}
              aria-label="Live learner browser"
            >
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-950 px-3 text-xs text-white">
                <span className="font-semibold">Live LMS browser</span>
                <button
                  type="button"
                  onClick={() => setPreviewRevision((value) => value + 1)}
                  className="inline-flex min-h-11 items-center gap-1 rounded px-2 py-1 font-semibold text-slate-200 hover:bg-slate-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
              <iframe
                key={`${previewUrl}-${state.autosave.lastSavedAt ?? 'initial'}-${previewRevision}`}
                src={previewUrl}
                title="Live learner course preview"
                allow="autoplay; fullscreen; microphone; camera"
                className="h-full min-h-0 w-full flex-1 bg-white"
              />
            </aside>
            <div className={browserMode === 'cloud' ? 'h-full' : 'hidden'}>
              {cloudBrowserVisited ? (
                <CloudBrowserWorkspace
                  autoStart={previewOpen && browserMode === 'cloud'}
                  initialTarget={typeof window !== 'undefined' ? window.location.href : ''}
                />
              ) : null}
            </div>
          </>
        }
      >
        <main className="min-h-0 min-w-0">{children}</main>
      </ResizableWorkspace>
    </div>
  );
}
