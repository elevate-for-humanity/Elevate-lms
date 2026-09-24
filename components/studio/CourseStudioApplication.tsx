'use client';

import { useState } from 'react';
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
    <header className="h-14 border-b border-slate-200 bg-white flex items-center gap-3 px-4 shrink-0">
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
  const { totalLessons } = state.publishState;
  if (totalLessons === 0) return null;
  const generatedLessons = state.lessons.filter((lesson) =>
    ['generated', 'complete', 'completed', 'verification_ready', 'certificate_ready', 'published'].includes(
      String(lesson.generation_status ?? ''),
    ),
  ).length;
  const pct = Math.round((generatedLessons / totalLessons) * 100);
  return (
    <div className="h-1 bg-slate-100 shrink-0">
      <div
        className="h-full bg-brand-blue-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
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
  const { state } = useCourse();
  const previewUrl = `/api/admin/course-builder/preview?courseId=${encodeURIComponent(state.course.id)}`;

  return (
    <div
      className={
        embedded
          ? 'flex min-h-[calc(100vh-10rem)] flex-col bg-slate-50'
          : 'flex h-screen flex-col overflow-hidden bg-slate-50'
      }
    >
      <StudioTopbar
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((value) => !value)}
        embedded={embedded}
      />
      <PublishProgress />
      <div
        className={`grid flex-1 ${embedded ? 'items-start overflow-visible' : 'min-h-0 overflow-hidden'} ${previewOpen ? 'xl:grid-cols-[minmax(0,1fr)_minmax(520px,46vw)]' : 'grid-cols-1'}`}
      >
        <main className={embedded ? 'min-w-0 overflow-visible' : 'min-h-0 overflow-y-auto'}>
          {children}
        </main>
        {previewOpen && (
          <aside
            className={
              embedded
                ? 'min-h-[42rem] overflow-hidden border-t border-slate-200 bg-white xl:sticky xl:top-0 xl:h-[calc(100vh-1rem)] xl:border-l xl:border-t-0'
                : 'min-h-[45vh] overflow-hidden border-l border-slate-200 bg-white lg:min-h-0'
            }
            aria-label="Live learner browser"
          >
            <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-slate-950 px-3 text-xs text-white">
              <div className="min-w-0">
                <span className="font-semibold">Live LMS browser</span>
                <span className="ml-2 hidden truncate text-slate-400 sm:inline">
                  Real learner course and lesson player
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRevision((value) => value + 1)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-slate-200 hover:bg-slate-800"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            <iframe
              key={`${previewUrl}-${state.autosave.lastSavedAt ?? 'initial'}-${previewRevision}`}
              src={previewUrl}
              title="Live learner course preview"
              allow="autoplay; fullscreen; microphone; camera"
              className={
                embedded
                  ? 'h-[70vh] min-h-[42rem] w-full bg-white xl:h-[calc(100vh-3.5rem)]'
                  : 'h-[calc(100%-2.5rem)] min-h-[40vh] w-full bg-white'
              }
            />
          </aside>
        )}
      </div>
    </div>
  );
}
