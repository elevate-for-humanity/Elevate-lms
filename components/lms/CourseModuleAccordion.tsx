'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronUp, Play, CheckCircle, Lock,
  Video, FileText, Brain, FlaskConical, Zap, Shield,
  Clock, ChevronRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

type ActivityType = 'video' | 'reading' | 'flashcards' | 'lab' | 'practice' | 'checkpoint';

interface Activity {
  type: ActivityType;
  label: string;
  order: number;
  required: boolean;
}

interface Lesson {
  id: string;
  title: string;
  duration_minutes?: number | null;
  step_type?: string | null;
  content_type?: string | null;
  activities?: Activity[] | null;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Props {
  modules: Module[];
  courseId: string;
  /** lesson_id → { completed: boolean } */
  progressMap: Record<string, { completed?: boolean } | undefined>;
  isEnrolled: boolean;
  isPendingApproval: boolean;
  /** When set, wraps modules in a collapsible phase header */
  phaseLabel?: string;
  phaseName?: string;
  /** 'current' = open by default, 'completed' = collapsed, 'locked' = collapsed + locked icon */
  phaseStatus?: 'current' | 'completed' | 'locked';
}

// ── Activity icon map ──────────────────────────────────────────────────

const ACTIVITY_ICON: Record<ActivityType, React.ElementType> = {
  video:      Video,
  reading:    FileText,
  flashcards: Brain,
  lab:        FlaskConical,
  practice:   Zap,
  checkpoint: Shield,
};

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  video:      'text-brand-blue-600',
  reading:    'text-slate-500',
  flashcards: 'text-purple-600',
  lab:        'text-green-600',
  practice:   'text-amber-600',
  checkpoint: 'text-brand-red-600',
};

// Default activities when a lesson has none stored (legacy rows)
const DEFAULT_LESSON_ACTIVITIES: Activity[] = [
  { type: 'video',   label: 'Watch Lesson Video',  order: 1, required: true  },
  { type: 'reading', label: 'Reading',              order: 2, required: true  },
];

// ── Module row ─────────────────────────────────────────────────────────

function ModuleRow({
  module,
  courseId,
  progressMap,
  isEnrolled,
  isPendingApproval,
  defaultOpen,
}: {
  module: Module;
  courseId: string;
  progressMap: Record<string, { completed?: boolean } | undefined>;
  isEnrolled: boolean;
  isPendingApproval: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const completedInModule = module.lessons.filter(l => progressMap[l.id]?.completed).length;
  const totalInModule = module.lessons.length;
  const modulePct = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0;
  const moduleComplete = completedInModule === totalInModule && totalInModule > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Module header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition text-left"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold ${
          moduleComplete ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
        }`}>
          {moduleComplete ? <CheckCircle className="w-4 h-4" /> : module.order_index}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-snug">{module.title}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500">{totalInModule} lessons</span>
            {isEnrolled && (
              <>
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-blue-600 rounded-full transition-all" style={{ width: `${modulePct}%` }} />
                </div>
                <span className="text-xs text-slate-500">{completedInModule}/{totalInModule}</span>
              </>
            )}
          </div>
        </div>

        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {/* Lesson list */}
      {open && (
        <div className="border-t border-slate-100">
          {module.lessons.map((lesson, idx) => {
            const isCompleted = progressMap[lesson.id]?.completed;
            const prevLesson = module.lessons[idx - 1];
            const prevDone = idx === 0 || progressMap[prevLesson?.id]?.completed;
            const isLocked = isPendingApproval || (!isEnrolled && idx > 0) || (isEnrolled && !isCompleted && !prevDone);
            const isCheckpoint = lesson.step_type === 'checkpoint' || lesson.content_type === 'quiz';
            const activities: Activity[] = lesson.activities?.length
              ? [...lesson.activities].sort((a, b) => a.order - b.order)
              : DEFAULT_LESSON_ACTIVITIES;

            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                isCompleted={!!isCompleted}
                isLocked={isLocked}
                isCheckpoint={isCheckpoint}
                activities={activities}
                isEnrolled={isEnrolled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Lesson row with expandable activity menu ───────────────────────────

function LessonRow({
  lesson,
  courseId,
  isCompleted,
  isLocked,
  isCheckpoint,
  activities,
  isEnrolled,
}: {
  lesson: Lesson;
  courseId: string;
  isCompleted: boolean;
  isLocked: boolean;
  isCheckpoint: boolean;
  activities: Activity[];
  isEnrolled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isLocked) {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-b-0 opacity-40">
        <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{lesson.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-50 last:border-b-0">
      {/* Lesson title row */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition cursor-pointer group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-green-500' : 'bg-slate-100 group-hover:bg-slate-200'
        }`}>
          {isCompleted
            ? <CheckCircle className="w-3.5 h-3.5 text-white" />
            : <Play className="w-2.5 h-2.5 text-slate-500" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-green-800' : 'text-slate-900'}`}>
            {lesson.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {isCheckpoint && (
              <span className="text-[10px] font-bold text-brand-orange-600 bg-brand-orange-50 border border-brand-orange-200 px-1.5 py-0.5 rounded">
                CHECKPOINT
              </span>
            )}
            {lesson.duration_minutes && (
              <span className="flex items-center gap-0.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />{lesson.duration_minutes}m
              </span>
            )}
            <span className="text-xs text-slate-400">{activities.length} activities</span>
          </div>
        </div>

        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        }
      </div>

      {/* Activity menu — NHA style */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 space-y-1">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICON[activity.type] ?? Play;
            const color = ACTIVITY_COLOR[activity.type] ?? 'text-slate-500';
            const isGated = activity.type === 'checkpoint' && !isCompleted;

            return (
              <Link
                key={activity.type}
                href={`/lms/courses/${courseId}/lessons/${lesson.id}?activity=${activity.type}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group/act ${
                  isGated
                    ? 'opacity-50 pointer-events-none bg-white border border-slate-200'
                    : 'bg-white border border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                <span className="text-sm font-medium text-slate-800 flex-1">{activity.label}</span>
                {activity.required && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Required</span>
                )}
                {isGated && (
                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </Link>
            );
          })}

          {/* Jump straight into lesson */}
          <Link
            href={`/lms/courses/${courseId}/lessons/${lesson.id}`}
            className="flex items-center justify-center gap-2 mt-2 py-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-bold transition"
          >
            <Play className="w-3.5 h-3.5" />
            {isCompleted ? 'Review Lesson' : 'Start Lesson'}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────

export function CourseModuleAccordion({
  modules,
  courseId,
  progressMap,
  isEnrolled,
  isPendingApproval,
}: Props) {
  // Open the first incomplete module by default
  const firstIncompleteIdx = modules.findIndex(mod =>
    mod.lessons.some(l => !progressMap[l.id]?.completed)
  );

  // Phase-level collapse: non-current phases start closed
  const [phaseOpen, setPhaseOpen] = useState(phaseStatus === 'current' || !phaseStatus);

  const moduleList = (
    <div className="space-y-3">
      {modules.map((mod, idx) => (
        <ModuleRow
          key={mod.id}
          module={mod}
          courseId={courseId}
          progressMap={progressMap}
          isEnrolled={isEnrolled}
          isPendingApproval={isPendingApproval}
          defaultOpen={
            phaseStatus === 'current'
              ? idx === (firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0)
              : false
          }
        />
      ))}
    </div>
  );

  // No phase wrapper — render modules directly
  if (!phaseLabel) return moduleList;

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (s, m) => s + m.lessons.filter(l => progressMap[l.id]?.completed).length,
    0
  );

  const statusColors = {
    current:   { badge: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500',   header: 'border-blue-200 bg-blue-50/50' },
    completed: { badge: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500',  header: 'border-slate-200 bg-white' },
    locked:    { badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300',  header: 'border-slate-200 bg-slate-50' },
  };
  const colors = statusColors[phaseStatus ?? 'locked'];

  return (
    <div className={`rounded-xl border overflow-hidden ${colors.header}`}>
      {/* Phase header — always visible, click to expand/collapse */}
      <button
        onClick={() => phaseStatus !== 'locked' && setPhaseOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
          phaseStatus === 'locked' ? 'cursor-default' : 'hover:bg-black/5'
        }`}
        disabled={phaseStatus === 'locked'}
      >
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {phaseLabel}
            </span>
            <span className="text-sm font-bold text-slate-900">{phaseName}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
              {phaseStatus === 'current' ? 'Current' : phaseStatus === 'completed' ? 'Complete' : 'Locked'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {modules.length} module{modules.length !== 1 ? 's' : ''} · {totalLessons} lessons
            {phaseStatus !== 'locked' && ` · ${completedLessons}/${totalLessons} done`}
          </p>
        </div>

        {/* Progress bar (current/completed only) */}
        {phaseStatus !== 'locked' && totalLessons > 0 && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${phaseStatus === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.round((completedLessons / totalLessons) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 tabular-nums w-8 text-right">
              {Math.round((completedLessons / totalLessons) * 100)}%
            </span>
          </div>
        )}

        {/* Expand/collapse icon */}
        {phaseStatus === 'locked'
          ? <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
          : phaseOpen
            ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        }
      </button>

      {/* Module list — only shown when phase is open */}
      {phaseOpen && phaseStatus !== 'locked' && (
        <div className="border-t border-slate-200 p-4">
          {moduleList}
        </div>
      )}
    </div>
  );
}
