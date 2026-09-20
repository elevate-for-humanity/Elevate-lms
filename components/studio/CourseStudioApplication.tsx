'use client';

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
} from 'lucide-react';
import { useCourse, type StudioPanel } from './CourseProvider';

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
}: {
  previewOpen: boolean;
  onTogglePreview: () => void;
}) {
  const { state, save, setPanel } = useCourse();
  const { course, publishState } = state;

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center gap-3 px-4 shrink-0">
      <Link
        href="/courses"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Courses</span>
      </Link>
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
          className="p-1 rounded hover:bg-slate-100 text-slate-400"
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
  const { state } = useCourse();
  const { totalLessons, approvedLessons } = state.publishState;
  if (totalLessons === 0) return null;
  const pct = Math.round((approvedLessons / totalLessons) * 100);
  return (
    <div className="h-1 bg-slate-100 shrink-0">
      <div
        className="h-full bg-brand-blue-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CourseStudioApplication({ children }: { children: React.ReactNode }) {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewError, setPreviewError] = useState('');
  const { state } = useCourse();
  const previewUrl = `/api/admin/course-builder/preview?courseId=${encodeURIComponent(state.course.id)}`;

  useEffect(() => {
    if (!previewOpen) return;
    const controller = new AbortController();
    setPreviewError('');
    fetch(previewUrl, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'text/html' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preview returned HTTP ${response.status}`);
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) throw new Error('Preview authentication expired');
        return response.text();
      })
      .then(setPreviewHtml)
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setPreviewError(error instanceof Error ? error.message : 'Preview unavailable');
      });
    return () => controller.abort();
  }, [previewOpen, previewUrl, state.autosave.lastSavedAt]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <StudioTopbar
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((value) => !value)}
      />
      <PublishProgress />
      <div
        className={`grid min-h-0 flex-1 overflow-hidden ${previewOpen ? 'lg:grid-cols-[minmax(0,1fr)_minmax(420px,46vw)]' : 'grid-cols-1'}`}
      >
        <main className="min-h-0 overflow-y-auto">{children}</main>
        {previewOpen && (
          <aside
            className="min-h-[45vh] overflow-hidden border-l border-slate-200 bg-white lg:min-h-0"
            aria-label="Live learner browser"
          >
            <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-slate-950 px-3 text-xs text-white">
              <span className="font-semibold">Live learner view</span>
              <span className="text-slate-300">Updates after save</span>
            </div>
            {previewError ? (
              <div
                className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                role="alert"
              >
                Learner preview could not load: {previewError}
              </div>
            ) : previewHtml ? (
              <iframe
                key={`${previewUrl}-${state.autosave.lastSavedAt ?? 'initial'}`}
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                title="Live learner course preview"
                className="h-[calc(100%-2.5rem)] min-h-[40vh] w-full bg-white"
              />
            ) : (
              <div className="p-4 text-sm text-slate-500" role="status">
                Loading learner preview…
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
