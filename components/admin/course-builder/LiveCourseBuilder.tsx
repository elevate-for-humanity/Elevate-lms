'use client';

/**
 * LiveCourseBuilder — Durable-style three-panel course editor.
 *
 * Left:   Module/lesson tree (drag to reorder, click to select)
 * Center: Live student-view preview of the selected lesson
 * Right:  Inline edit panel for the selected lesson's fields
 *
 * All saves go to /api/admin/course-builder/lesson (PATCH) without
 * leaving the page. The preview iframe refreshes after each save.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  RefreshCw,
  Eye,
  Edit3,
  GripVertical,
  Video,
  FileText,
  CheckSquare,
  FlaskConical,
  BookOpen,
  Award,
  Loader2,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  slug: string;
  lesson_order: number;
  step_type: 'lesson' | 'quiz' | 'checkpoint' | 'lab' | 'assignment' | 'exam' | 'certification';
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  passing_score?: number;
  status: 'draft' | 'published';
}

interface Module {
  id: string;
  title: string;
  slug: string;
  module_order: number;
  lessons: Lesson[];
}

interface Props {
  courseId: string;
  courseTitle: string;
  initialModules: Module[];
  lmsBaseUrl?: string;
}

// ── Step type config ─────────────────────────────────────────────────────────

const STEP_TYPES = [
  { value: 'lesson', label: 'Lesson', icon: BookOpen, color: 'text-blue-500' },
  { value: 'quiz', label: 'Quiz', icon: CheckSquare, color: 'text-purple-500' },
  { value: 'checkpoint', label: 'Checkpoint', icon: CheckSquare, color: 'text-orange-500' },
  { value: 'lab', label: 'Lab', icon: FlaskConical, color: 'text-brand-green-500' },
  { value: 'assignment', label: 'Assignment', icon: FileText, color: 'text-yellow-500' },
  { value: 'exam', label: 'Exam', icon: Award, color: 'text-red-500' },
  { value: 'certification', label: 'Certification', icon: Award, color: 'text-brand-red-500' },
] as const;

function stepIcon(type: Lesson['step_type']) {
  const cfg = STEP_TYPES.find((s) => s.value === type);
  if (!cfg) return <BookOpen className="w-3.5 h-3.5" />;
  const Icon = cfg.icon;
  return <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function LiveCourseBuilder({
  courseId,
  courseTitle,
  initialModules,
  lmsBaseUrl = '',
}: Props) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    initialModules[0]?.id ?? null,
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    initialModules[0]?.lessons[0]?.id ?? null,
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(initialModules.map((m) => m.id)),
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editPanelOpen, setEditPanelOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [previewKey, setPreviewKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editStepType, setEditStepType] = useState<Lesson['step_type']>('lesson');
  const [editDuration, setEditDuration] = useState('');
  const [editPassingScore, setEditPassingScore] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');

  // Add module / lesson state
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Derived: selected lesson
  const selectedLesson =
    modules.flatMap((m) => m.lessons).find((l) => l.id === selectedLessonId) ?? null;

  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;

  // Populate edit form when selection changes
  useEffect(() => {
    if (!selectedLesson) return;
    setEditTitle(selectedLesson.title);
    setEditContent(selectedLesson.content ?? '');
    setEditVideoUrl(selectedLesson.video_url ?? '');
    setEditStepType(selectedLesson.step_type);
    setEditDuration(String(selectedLesson.duration_minutes ?? ''));
    setEditPassingScore(String(selectedLesson.passing_score ?? ''));
    setEditStatus(selectedLesson.status);
  }, [selectedLessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preview URL for the selected lesson
  const previewUrl = selectedLessonId
    ? `${lmsBaseUrl}/lms/courses/${courseId}/lessons/${selectedLessonId}?preview=1`
    : null;

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectLesson(moduleId: string, lessonId: string) {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    setSaveStatus('idle');
  }

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setQuickAddLoading(true);
    try {
      const res = await fetch('/api/admin/course-builder/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'module', courseId, title: newModuleTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      const newMod: Module = {
        id: data.module.id,
        title: data.module.title,
        slug: data.module.slug,
        module_order: data.module.module_order,
        lessons: [],
      };
      setModules((prev) => [...prev, newMod]);
      setExpandedModules((prev) => new Set([...prev, newMod.id]));
      setSelectedModuleId(newMod.id);
      setNewModuleTitle('');
      setAddingModule(false);
    } catch (err: any) {
      alert(`Failed to add module: ${err.message}`);
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    setQuickAddLoading(true);
    try {
      const res = await fetch('/api/admin/course-builder/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lesson', courseId, moduleId, title: newLessonTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, data.lesson] } : m)),
      );
      setSelectedModuleId(moduleId);
      setSelectedLessonId(data.lesson.id);
      setNewLessonTitle('');
      setAddingLessonToModule(null);
    } catch (err: any) {
      alert(`Failed to add lesson: ${err.message}`);
    } finally {
      setQuickAddLoading(false);
    }
  };

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  async function saveLesson() {
    if (!selectedLessonId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/admin/course-builder/lesson-patch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          title: editTitle,
          content: editContent,
          video_url: editVideoUrl || null,
          step_type: editStepType,
          duration_minutes: editDuration ? parseInt(editDuration) : null,
          passing_score: editPassingScore ? parseInt(editPassingScore) : null,
          status: editStatus,
        }),
      });
      if (!res.ok) throw new Error('Save failed');

      // Update local state
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l.id === selectedLessonId
              ? {
                  ...l,
                  title: editTitle,
                  content: editContent,
                  video_url: editVideoUrl || undefined,
                  step_type: editStepType,
                  duration_minutes: editDuration ? parseInt(editDuration) : undefined,
                  passing_score: editPassingScore ? parseInt(editPassingScore) : undefined,
                  status: editStatus,
                }
              : l,
          ),
        })),
      );

      setSaveStatus('saved');
      refreshPreview();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-100 overflow-hidden">
      {/* ── LEFT SIDEBAR: Module/Lesson Tree ─────────────────────────── */}
      <aside
        className={`flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Course</p>
            <p className="text-sm font-bold text-slate-800 truncate">{courseTitle}</p>
          </div>
        </div>

        {/* Module/lesson tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {modules.map((mod, mi) => (
            <div key={mod.id}>
              {/* Module row */}
              <div className="group flex items-center gap-1 px-3 py-2 hover:bg-slate-50">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0"
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                  {expandedModules.has(mod.id) ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-600 truncate flex-1">
                    {mi + 1}. {mod.title}
                  </span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 mr-1">
                    {mod.lessons.length}
                  </span>
                </button>
                {/* Add lesson to this module */}
                <button
                  onClick={() => {
                    setAddingLessonToModule(mod.id);
                    setNewLessonTitle('');
                    setExpandedModules((prev) => new Set([...prev, mod.id]));
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex-shrink-0 transition-opacity"
                  title="Add lesson"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Lesson rows */}
              {expandedModules.has(mod.id) && (
                <>
                  {mod.lessons.map((les, li) => (
                    <button
                      key={les.id}
                      onClick={() => selectLesson(mod.id, les.id)}
                      className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left transition-colors ${
                        selectedLessonId === les.id
                          ? 'bg-brand-red-50 border-r-2 border-brand-red-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <GripVertical className="w-3 h-3 text-slate-200 flex-shrink-0" />
                      {stepIcon(les.step_type)}
                      <span
                        className={`text-xs truncate flex-1 ${
                          selectedLessonId === les.id
                            ? 'text-brand-red-700 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {li + 1}. {les.title}
                      </span>
                      {les.status === 'draft' && (
                        <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                          DRAFT
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Inline add-lesson input */}
                  {addingLessonToModule === mod.id && (
                    <div className="pl-8 pr-3 py-2 flex items-center gap-1.5">
                      <input
                        autoFocus
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddLesson(mod.id);
                          if (e.key === 'Escape') {
                            setAddingLessonToModule(null);
                            setNewLessonTitle('');
                          }
                        }}
                        placeholder="Lesson title…"
                        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-red-400"
                      />
                      <button
                        onClick={() => handleAddLesson(mod.id)}
                        disabled={quickAddLoading || !newLessonTitle.trim()}
                        className="p-1 bg-brand-red-600 text-white rounded hover:bg-brand-red-700 disabled:opacity-40"
                      >
                        {quickAddLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAddingLessonToModule(null);
                          setNewLessonTitle('');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Inline add-module input */}
          {addingModule && (
            <div className="px-3 py-2 flex items-center gap-1.5 border-t border-slate-100 mt-1">
              <input
                autoFocus
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddModule();
                  if (e.key === 'Escape') {
                    setAddingModule(false);
                    setNewModuleTitle('');
                  }
                }}
                placeholder="Module title…"
                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-red-400"
              />
              <button
                onClick={handleAddModule}
                disabled={quickAddLoading || !newModuleTitle.trim()}
                className="p-1 bg-brand-red-600 text-white rounded hover:bg-brand-red-700 disabled:opacity-40"
              >
                {quickAddLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => {
                  setAddingModule(false);
                  setNewModuleTitle('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar footer — Add Module */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-2">
          <button
            onClick={() => {
              setAddingModule(true);
              setNewModuleTitle('');
            }}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 rounded-lg hover:bg-slate-50 border border-dashed border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Module
          </button>
        </div>
      </aside>

      {/* ── CENTER: Preview ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 flex-1">
            {selectedModule && (
              <>
                <span className="font-medium text-slate-700 truncate">{selectedModule.title}</span>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              </>
            )}
            {selectedLesson && (
              <span className="font-semibold text-slate-900 truncate">{selectedLesson.title}</span>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={refreshPreview}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open in new tab */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Preview iframe / Edit panel */}
        <div className="flex-1 overflow-hidden flex">
          {/* Preview */}
          <div className={`flex-1 ${activeTab === 'preview' ? 'flex' : 'hidden'} flex-col items-center justify-center bg-slate-50`}>
            {previewUrl ? (
              <div className="text-center space-y-4 p-8 max-w-sm">
                <Eye className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">{selectedLesson?.title}</p>
                <p className="text-xs text-slate-400">
                  Live preview opens in the LMS — you must be logged in as a student or use an incognito session.
                </p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open Lesson Preview
                </a>
                <p className="text-[10px] text-slate-400">
                  {previewUrl}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Eye className="w-8 h-8 opacity-30" />
                <p className="text-sm">Select a lesson to preview</p>
              </div>
            )}
          </div>

          {/* Edit panel (mobile / no right panel) */}
          {activeTab === 'edit' && (
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <EditPanel
                lesson={selectedLesson}
                courseId={courseId}
                courseTitle={courseTitle}
                moduleTitle={selectedModule?.title}
                title={editTitle}
                setTitle={setEditTitle}
                content={editContent}
                setContent={setEditContent}
                videoUrl={editVideoUrl}
                setVideoUrl={setEditVideoUrl}
                stepType={editStepType}
                setStepType={setEditStepType}
                duration={editDuration}
                setDuration={setEditDuration}
                passingScore={editPassingScore}
                setPassingScore={setEditPassingScore}
                status={editStatus}
                setStatus={setEditStatus}
                saving={saving}
                saveStatus={saveStatus}
                onSave={saveLesson}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Edit (desktop) ───────────────────────────────── */}
      {editPanelOpen && (
        <aside className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden hidden lg:flex">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Edit Lesson
            </p>
            <button
              onClick={() => setEditPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <EditPanel
              lesson={selectedLesson}
              courseId={courseId}
              courseTitle={courseTitle}
              moduleTitle={selectedModule?.title}
              title={editTitle}
              setTitle={setEditTitle}
              content={editContent}
              setContent={setEditContent}
              videoUrl={editVideoUrl}
              setVideoUrl={setEditVideoUrl}
              stepType={editStepType}
              setStepType={setEditStepType}
              duration={editDuration}
              setDuration={setEditDuration}
              passingScore={editPassingScore}
              setPassingScore={setEditPassingScore}
              status={editStatus}
              setStatus={setEditStatus}
              saving={saving}
              saveStatus={saveStatus}
              onSave={saveLesson}
            />
          </div>
        </aside>
      )}

      {/* Re-open right panel button */}
      {!editPanelOpen && (
        <button
          onClick={() => setEditPanelOpen(true)}
          className="fixed right-4 bottom-4 bg-brand-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 hover:bg-brand-red-700 transition-colors z-50"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Panel
        </button>
      )}
    </div>
  );
}

// ── Edit Panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
  lesson: Lesson | null;
  courseId: string;
  courseTitle: string;
  moduleTitle?: string;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  stepType: Lesson['step_type'];
  setStepType: (v: Lesson['step_type']) => void;
  duration: string;
  setDuration: (v: string) => void;
  passingScore: string;
  setPassingScore: (v: string) => void;
  status: 'draft' | 'published';
  setStatus: (v: 'draft' | 'published') => void;
  saving: boolean;
  saveStatus: 'idle' | 'saved' | 'error';
  onSave: () => void;
}

function EditPanel({
  lesson,
  courseId,
  courseTitle,
  moduleTitle,
  title,
  setTitle,
  content,
  setContent,
  videoUrl,
  setVideoUrl,
  stepType,
  setStepType,
  duration,
  setDuration,
  passingScore,
  setPassingScore,
  status,
  setStatus,
  saving,
  saveStatus,
  onSave,
}: EditPanelProps) {
  const [aiWriting, setAiWriting] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  const handleAiWrite = async () => {
    setAiWriting(true);
    try {
      const res = await fetch('/api/admin/course-builder/ai-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: title || lesson?.title,
          courseTitle,
          moduleTitle,
          existingContent: content || undefined,
          instruction: aiInstruction || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI write failed');
      setContent(data.content);
      setShowAiInput(false);
      setAiInstruction('');
    } catch (err: any) {
      alert(`AI write failed: ${err.message}`);
    } finally {
      setAiWriting(false);
    }
  };

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
        <BookOpen className="w-8 h-8 opacity-30" />
        <p>Select a lesson to edit</p>
      </div>
    );
  }

  const needsPassingScore = ['quiz', 'checkpoint', 'exam'].includes(stepType);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
          placeholder="Lesson title"
        />
      </div>

      {/* Step type */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
          Type
        </label>
        <select
          value={stepType}
          onChange={(e) => setStepType(e.target.value as Lesson['step_type'])}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
        >
          {STEP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" /> Video URL
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
          placeholder="https://..."
        />
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Content
          </label>
          <button
            onClick={() => setShowAiInput((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            {content ? 'Rewrite with AI' : 'Write with AI'}
          </button>
        </div>

        {/* AI instruction input */}
        {showAiInput && (
          <div className="mb-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
            <p className="text-[10px] text-purple-700 font-semibold">
              {content ? 'Rewriting existing content' : 'Generating new content'} for:{' '}
              <em>{title || lesson.title}</em>
            </p>
            <input
              type="text"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAiWrite();
                if (e.key === 'Escape') setShowAiInput(false);
              }}
              placeholder="Optional: any specific focus or instruction…"
              className="w-full text-xs border border-purple-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAiWrite}
                disabled={aiWriting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {aiWriting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Writing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> Generate
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAiInput(false)}
                className="px-3 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400 font-mono resize-y"
          placeholder="Lesson content (markdown)… or click 'Write with AI' above"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
          placeholder="30"
          min={1}
        />
      </div>

      {/* Passing score — only for quiz/checkpoint/exam */}
      {needsPassingScore && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Passing Score (%)
          </label>
          <input
            type="number"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
            placeholder="70"
            min={1}
            max={100}
          />
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
          Status
        </label>
        <div className="flex gap-2">
          {(['draft', 'published'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                status === s
                  ? s === 'published'
                    ? 'bg-brand-green-600 text-white border-brand-green-600'
                    : 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
          saveStatus === 'saved'
            ? 'bg-brand-green-600 text-white'
            : saveStatus === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
        }`}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : saveStatus === 'saved' ? (
          '✓ Saved'
        ) : saveStatus === 'error' ? (
          '✗ Error — try again'
        ) : (
          <>
            <Save className="w-4 h-4" /> Save Changes
          </>
        )}
      </button>

      {/* Quick links */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Quick Links
        </p>
        <a
          href="/studio/courses"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 py-1"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Manage Quiz Questions
        </a>
        <a
          href="/studio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 py-1"
        >
          <Video className="w-3.5 h-3.5" /> Video Manager
        </a>
      </div>
    </div>
  );
}
