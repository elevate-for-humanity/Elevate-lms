'use client';

import { useState, type ElementType } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Trash2, GripVertical,
  Video, BookOpen, ClipboardCheck, FlaskConical, FileQuestion, GraduationCap,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import BuilderSection from './BuilderSection';
import type { ProgramBuilderState, ProgramPhase, ProgramModule, ProgramLesson, LessonType } from './types';

const LESSON_TYPE_META: Record<LessonType, { label: string; icon: ElementType; color: string }> = {
  lesson:      { label: 'Lesson',      icon: BookOpen,       color: 'text-brand-blue-600 bg-brand-blue-50' },
  quiz:        { label: 'Quiz',        icon: FileQuestion,   color: 'text-amber-600 bg-amber-50' },
  checkpoint:  { label: 'Checkpoint',  icon: ClipboardCheck, color: 'text-purple-600 bg-purple-50' },
  lab:         { label: 'Lab',         icon: FlaskConical,   color: 'text-emerald-600 bg-emerald-50' },
  exam:        { label: 'Exam',        icon: GraduationCap,  color: 'text-red-600 bg-red-50' },
  orientation: { label: 'Orientation', icon: Video,          color: 'text-slate-600 bg-slate-100' },
};

interface Props {
  state: ProgramBuilderState;
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

export default function CurriculumTreeSection({ state, onChange }: Props) {
  const phases = state.phases;
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(phases.map(p => p.id)));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const totalModules = phases.reduce((n, p) => n + p.modules.length, 0);
  const totalLessons = phases.reduce((n, p) => n + p.modules.reduce((m, mod) => m + mod.lessons.length, 0), 0);

  const updatePhases = (next: ProgramPhase[]) => onChange({ phases: next });

  // ── Phase ops ──────────────────────────────────────────────────────────────

  const addPhase = () => {
    const newPhase: ProgramPhase = {
      id: crypto.randomUUID(),
      title: `Phase ${phases.length + 1}`,
      sort_order: phases.length,
      modules: [],
    };
    const next = [...phases, newPhase];
    updatePhases(next);
    setExpandedPhases(prev => new Set([...prev, newPhase.id]));
  };

  const updatePhaseTitle = (phaseId: string, title: string) => {
    updatePhases(phases.map(p => p.id === phaseId ? { ...p, title } : p));
  };

  const removePhase = (phaseId: string) => {
    updatePhases(phases.filter(p => p.id !== phaseId).map((p, i) => ({ ...p, sort_order: i })));
  };

  // ── Module ops ─────────────────────────────────────────────────────────────

  const addModule = (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId)!;
    const newMod: ProgramModule = {
      id: crypto.randomUUID(),
      title: `Module ${phase.modules.length + 1}`,
      sort_order: phase.modules.length,
      lessons: [],
    };
    updatePhases(phases.map(p =>
      p.id === phaseId ? { ...p, modules: [...p.modules, newMod] } : p
    ));
    setExpandedModules(prev => new Set([...prev, newMod.id]));
  };

  const updateModuleTitle = (phaseId: string, moduleId: string, title: string) => {
    updatePhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, modules: p.modules.map(m => m.id === moduleId ? { ...m, title } : m) }
        : p
    ));
  };

  const removeModule = (phaseId: string, moduleId: string) => {
    updatePhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, modules: p.modules.filter(m => m.id !== moduleId).map((m, i) => ({ ...m, sort_order: i })) }
        : p
    ));
  };

  // ── Lesson ops ─────────────────────────────────────────────────────────────

  const addLesson = (phaseId: string, moduleId: string) => {
    const phase = phases.find(p => p.id === phaseId)!;
    const mod = phase.modules.find(m => m.id === moduleId)!;
    const newLesson: ProgramLesson = {
      id: crypto.randomUUID(),
      title: `Lesson ${mod.lessons.length + 1}`,
      lesson_type: 'lesson',
      sort_order: mod.lessons.length,
      duration_minutes: null,
      is_published: false,
      has_video: false,
      has_reading: false,
    };
    updatePhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, modules: p.modules.map(m =>
            m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
          )}
        : p
    ));
  };

  const updateLesson = (phaseId: string, moduleId: string, lessonId: string, patch: Partial<ProgramLesson>) => {
    updatePhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, modules: p.modules.map(m =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...patch } : l) }
              : m
          )}
        : p
    ));
  };

  const removeLesson = (phaseId: string, moduleId: string, lessonId: string) => {
    updatePhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, modules: p.modules.map(m =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId).map((l, i) => ({ ...l, sort_order: i })) }
              : m
          )}
        : p
    ));
  };

  const togglePhase = (id: string) => setExpandedPhases(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleModule = (id: string) => setExpandedModules(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const missingContent = totalModules < 3 || totalLessons < 10;

  return (
    <BuilderSection
      title="Curriculum"
      description="Structure your program into phases, modules, and lessons. Minimum: 1 phase, 3 modules, 10 lessons."
      required
      warning={
        missingContent
          ? `Current: ${phases.length} phase${phases.length !== 1 ? 's' : ''}, ${totalModules} module${totalModules !== 1 ? 's' : ''}, ${totalLessons} lesson${totalLessons !== 1 ? 's' : ''}. Minimum required: 1 phase, 3 modules, 10 lessons.`
          : undefined
      }
    >
      {/* Summary strip */}
      <div className="flex items-center gap-6 mb-4 text-sm text-slate-500">
        <span><strong className="text-slate-900">{phases.length}</strong> phases</span>
        <span><strong className="text-slate-900">{totalModules}</strong> modules</span>
        <span><strong className={totalLessons >= 10 ? 'text-emerald-600' : 'text-amber-600'}>{totalLessons}</strong> lessons</span>
      </div>

      <div className="space-y-3">
        {phases.map(phase => (
          <PhaseBlock
            key={phase.id}
            phase={phase}
            expanded={expandedPhases.has(phase.id)}
            expandedModules={expandedModules}
            onToggle={() => togglePhase(phase.id)}
            onToggleModule={toggleModule}
            onTitleChange={title => updatePhaseTitle(phase.id, title)}
            onRemove={() => removePhase(phase.id)}
            onAddModule={() => addModule(phase.id)}
            onModuleTitleChange={(mId, t) => updateModuleTitle(phase.id, mId, t)}
            onRemoveModule={mId => removeModule(phase.id, mId)}
            onAddLesson={mId => addLesson(phase.id, mId)}
            onUpdateLesson={(mId, lId, patch) => updateLesson(phase.id, mId, lId, patch)}
            onRemoveLesson={(mId, lId) => removeLesson(phase.id, mId, lId)}
          />
        ))}

        <button
          onClick={addPhase}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Phase
        </button>
      </div>
    </BuilderSection>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhaseBlock({
  phase, expanded, expandedModules, onToggle, onToggleModule,
  onTitleChange, onRemove, onAddModule,
  onModuleTitleChange, onRemoveModule,
  onAddLesson, onUpdateLesson, onRemoveLesson,
}: {
  phase: ProgramPhase;
  expanded: boolean;
  expandedModules: Set<string>;
  onToggle: () => void;
  onToggleModule: (id: string) => void;
  onTitleChange: (t: string) => void;
  onRemove: () => void;
  onAddModule: () => void;
  onModuleTitleChange: (mId: string, t: string) => void;
  onRemoveModule: (mId: string) => void;
  onAddLesson: (mId: string) => void;
  onUpdateLesson: (mId: string, lId: string, patch: Partial<ProgramLesson>) => void;
  onRemoveLesson: (mId: string, lId: string) => void;
}) {
  const lessonCount = phase.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Phase header */}
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 group">
        <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
        <button onClick={onToggle} className="flex-shrink-0 text-slate-400 hover:text-slate-700">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <input
          type="text"
          value={phase.title}
          onChange={e => onTitleChange(e.target.value)}
          className="flex-1 bg-transparent text-sm font-semibold text-slate-900 focus:outline-none focus:ring-0 border-0 p-0"
        />
        <span className="text-xs text-slate-400">{phase.modules.length} modules · {lessonCount} lessons</span>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-colors"
          title="Remove phase"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Phase body */}
      {expanded && (
        <div className="px-4 py-3 space-y-2 bg-white">
          {phase.modules.map(mod => (
            <ModuleBlock
              key={mod.id}
              module={mod}
              expanded={expandedModules.has(mod.id)}
              onToggle={() => onToggleModule(mod.id)}
              onTitleChange={t => onModuleTitleChange(mod.id, t)}
              onRemove={() => onRemoveModule(mod.id)}
              onAddLesson={() => onAddLesson(mod.id)}
              onUpdateLesson={(lId, patch) => onUpdateLesson(mod.id, lId, patch)}
              onRemoveLesson={lId => onRemoveLesson(mod.id, lId)}
            />
          ))}

          <button
            onClick={onAddModule}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Module
          </button>
        </div>
      )}
    </div>
  );
}

function ModuleBlock({
  module, expanded, onToggle, onTitleChange, onRemove,
  onAddLesson, onUpdateLesson, onRemoveLesson,
}: {
  module: ProgramModule;
  expanded: boolean;
  onToggle: () => void;
  onTitleChange: (t: string) => void;
  onRemove: () => void;
  onAddLesson: () => void;
  onUpdateLesson: (lId: string, patch: Partial<ProgramLesson>) => void;
  onRemoveLesson: (lId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-100 overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-2 bg-slate-50/60 px-3 py-2.5 group">
        <GripVertical className="h-3.5 w-3.5 text-slate-300 cursor-grab flex-shrink-0" />
        <button onClick={onToggle} className="flex-shrink-0 text-slate-400 hover:text-slate-700">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <input
          type="text"
          value={module.title}
          onChange={e => onTitleChange(e.target.value)}
          className="flex-1 bg-transparent text-sm font-medium text-slate-800 focus:outline-none focus:ring-0 border-0 p-0"
        />
        <span className="text-xs text-slate-400">{module.lessons.length} lessons</span>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="px-3 py-2 space-y-1.5 bg-white">
          {module.lessons.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onUpdate={patch => onUpdateLesson(lesson.id, patch)}
              onRemove={() => onRemoveLesson(lesson.id)}
            />
          ))}

          <button
            onClick={onAddLesson}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Lesson
          </button>
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson, onUpdate, onRemove,
}: {
  lesson: ProgramLesson;
  onUpdate: (patch: Partial<ProgramLesson>) => void;
  onRemove: () => void;
}) {
  const meta = LESSON_TYPE_META[lesson.lesson_type];
  const Icon = meta.icon;
  const hasContent = lesson.has_video || lesson.has_reading;

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 group">
      <GripVertical className="h-3 w-3 text-slate-200 cursor-grab flex-shrink-0" />

      {/* Type icon */}
      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded ${meta.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Title */}
      <input
        type="text"
        value={lesson.title}
        onChange={e => onUpdate({ title: e.target.value })}
        className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none focus:ring-0 border-0 p-0 min-w-0"
      />

      {/* Type selector */}
      <select
        value={lesson.lesson_type}
        onChange={e => onUpdate({ lesson_type: e.target.value as LessonType })}
        className="rounded border-0 bg-transparent text-xs text-slate-500 focus:outline-none focus:ring-0 cursor-pointer"
      >
        {Object.entries(LESSON_TYPE_META).map(([val, m]) => (
          <option key={val} value={val}>{m.label}</option>
        ))}
      </select>

      {/* Duration */}
      <input
        type="number"
        min={1}
        value={lesson.duration_minutes ?? ''}
        onChange={e => onUpdate({ duration_minutes: e.target.value ? Number(e.target.value) : null })}
        placeholder="min"
        className="w-12 rounded border-0 bg-transparent text-xs text-slate-400 focus:outline-none focus:ring-0 text-right"
      />

      {/* Content status */}
      {hasContent
        ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" title="Has content" />
        : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" title="No content yet" />
      }

      {/* Remove */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
