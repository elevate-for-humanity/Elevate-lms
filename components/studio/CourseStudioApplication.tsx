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
  { id: 'interactions', label: 'Interactive', icon: MousePointer2, description: 'Lesson interactions' },
  { id: 'assessments', label: 'Assessments', icon: ClipboardCheck, description: 'Questions & exams' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, description: 'Readiness & evidence' },
  { id: 'publish', label: 'Publish', icon: Rocket, description: 'Review & publish' },
];

function AutosaveIndicator() {
  const { state } = useCourse();
  const { isDirty, isSaving, lastSavedAt, error } = state.autosave;

  if (error) return <span className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" />Save failed</span>;
  if (isSaving) return <span className="flex items-center gap-1.5 text-xs text-slate-500 animate-pulse"><Clock className="w-3.5 h-3.5" />Saving…</span>;
  if (isDirty) return <span className="flex items-center gap-1.5 text-xs text-amber-600"><Save className="w-3.5 h-3.5" />Unsaved changes</span>;
  if (lastSavedAt) return <span className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle className="w-3.5 h-3.5" />Saved</span>;
  return null;
}

function StudioTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { state, save, setPanel } = useCourse();
  const { course, publishState } = state;

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center gap-3 px-4 shrink-0">
      <button onClick={onToggleSidebar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden" aria-label="Toggle sidebar"><Menu className="w-5 h-5" /></button>
      <Link href="/courses" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition shrink-0">
        <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Courses</span>
      </Link>
      <div className="w-px h-5 bg-slate-200 shrink-0" />
      <h1 className="text-sm font-semibold text-slate-900 truncate flex-1 min-w-0">{course.title}</h1>
      <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700' : course.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{course.status}</span>
      <AutosaveIndicator />
      {state.warnings.length > 0 && <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600"><AlertCircle className="w-3.5 h-3.5" />{state.warnings.length} warning{state.warnings.length > 1 ? 's' : ''}</span>}
      <button onClick={() => void save()} disabled={!state.autosave.isDirty} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"><Save className="w-3.5 h-3.5" />Save</button>
      <button onClick={() => setPanel('publish')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${publishState.isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'}`}><Rocket className="w-3.5 h-3.5" /><span className="hidden sm:inline">{publishState.isPublished ? 'Published' : 'Publish'}</span></button>
    </header>
  );
}

function StudioSidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: (v: boolean) => void }) {
  const { state, setPanel } = useCourse();
  return (
    <aside className={`flex flex-col border-r border-slate-200 bg-white shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
      <div className="h-10 flex items-center justify-end px-2 border-b border-slate-100">
        <button onClick={() => onCollapse(!collapsed)} className="p-1 rounded hover:bg-slate-100 text-slate-400" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}</button>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {PANELS.map(panel => {
          const Icon = panel.icon;
          const isActive = state.activePanel === panel.id;
          return <button key={panel.id} onClick={() => setPanel(panel.id)} title={collapsed ? panel.label : undefined} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${isActive ? 'bg-brand-blue-50 text-brand-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-blue-600' : ''}`} />{!collapsed && <span className="text-sm truncate">{panel.label}</span>}</button>;
        })}
      </nav>
      <div className="border-t border-slate-100 py-2">
        <button onClick={() => setPanel('ai')} title={collapsed ? 'AI Assistant' : undefined} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${state.activePanel === 'ai' ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Bot className={`w-5 h-5 shrink-0 ${state.activePanel === 'ai' ? 'text-violet-600' : ''}`} />{!collapsed && <span className="text-sm">AI Assistant</span>}</button>
      </div>
    </aside>
  );
}

function PublishProgress() {
  const { state } = useCourse();
  const { totalLessons, approvedLessons } = state.publishState;
  if (totalLessons === 0) return null;
  const pct = Math.round((approvedLessons / totalLessons) * 100);
  return <div className="h-1 bg-slate-100 shrink-0"><div className="h-full bg-brand-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} /></div>;
}

export function CourseStudioApplication({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <StudioTopbar onToggleSidebar={() => setMobileSidebarOpen(v => !v)} />
      <PublishProgress />
      <div className="flex flex-1 overflow-hidden">
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-52 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200"><span className="text-sm font-semibold text-slate-800">Studio</span><button onClick={() => setMobileSidebarOpen(false)}><X className="w-5 h-5 text-slate-500" /></button></div>
              <StudioSidebar collapsed={false} onCollapse={() => {}} />
            </div>
          </div>
        )}
        <div className="hidden lg:flex"><StudioSidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} /></div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
