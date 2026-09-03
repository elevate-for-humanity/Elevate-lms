'use client';

/**
 * LessonActivityMenu
 *
 * Renders the activity tab bar for a lesson page. Drives which activity
 * component is active and enforces checkpoint gating.
 *
 * Gating rule: the checkpoint/exam tab is locked until every activity
 * marked gatesCheckpoint=true has been attempted at least once.
 *
 * Props:
 *   activities     — ordered list from getActivitiesForLesson()
 *   activeId       — currently selected activity id
 *   attempted      — set of activity ids the learner has interacted with
 *   isCompleted    — whether the lesson is already marked complete
 *   onChange       — called when the learner selects a tab
 */

import React from 'react';
import {
  Video,
  FileText,
  Brain,
  FlaskConical,
  Zap,
  Shield,
  MessageSquare,
  Download,
  Lock,
  MessageCircle,
} from 'lucide-react';
import type { ActivityId, ActivityDef } from '@/lib/lms/activity-map';
import { getCheckpointGates } from '@/lib/lms/activity-map';

const ACTIVITY_ICONS: Record<ActivityId, React.ElementType> = {
  video: Video,
  reading: FileText,
  flashcards: Brain,
  lab: FlaskConical,
  scenario: FlaskConical,
  practice: Zap,
  checkpoint: Shield,
  notes: MessageSquare,
  resources: Download,
  ask: MessageCircle,
};

const ACTIVITY_COLORS: Record<ActivityId, string> = {
  video: 'text-blue-600',
  reading: 'text-slate-600',
  flashcards: 'text-purple-600',
  lab: 'text-brand-green-600',
  scenario: 'text-teal-600',
  practice: 'text-amber-600',
  checkpoint: 'text-red-600',
  notes: 'text-slate-500',
  resources: 'text-slate-500',
  ask: 'text-brand-blue-600',
};

interface Props {
  activities: ActivityDef[];
  activeId: ActivityId;
  attempted: Set<ActivityId>;
  /** Activities truly completed — video watched ≥80%, reading scrolled to bottom, etc. */
  completedActivities?: Set<ActivityId>;
  isCompleted: boolean;
  onChange: (id: ActivityId) => void;
}

export default function LessonActivityMenu({
  activities,
  activeId,
  attempted,
  completedActivities,
  isCompleted,
  onChange,
}: Props) {
  const gateIds = new Set(getCheckpointGates(activities));

  function isLocked(act: ActivityDef): boolean {
    // Checkpoint/exam tab locked until all gating activities are truly completed
    if (act.id !== 'checkpoint') return false;
    if (isCompleted) return false;
    // Use completedActivities if available, fall back to attempted
    const doneSet = completedActivities ?? attempted;
    return [...gateIds].some((id) => !doneSet.has(id));
  }

  function statusIcon(act: ActivityDef) {
    const done = completedActivities ?? attempted;
    if (isLocked(act)) {
      return <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" aria-hidden />;
    }
    if (done.has(act.id)) {
      return (
        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block flex-shrink-0" aria-hidden="true" />
      );
    }
    if (act.gatesCheckpoint) {
      // Required but not yet completed — amber dot
      return (
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
          aria-label="Required"
        />
      );
    }
    return null;
  }

  return (
    <div className="border-b border-slate-200 mb-6">
      <div
        role="tablist"
        aria-label="Lesson activities"
        className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-hide"
      >
        {activities.map((act) => {
          const Icon = (ACTIVITY_ICONS[act.id] ?? FileText) as React.ComponentType<{className?: string}>;
          const color = ACTIVITY_COLORS[act.id] ?? 'text-slate-600';
          const active = activeId === act.id;
          const locked = isLocked(act);

          return (
            <button
              key={act.id}
              role="tab"
              aria-selected={active}
              aria-disabled={locked}
              aria-controls={`activity-panel-${act.id}`}
              id={`activity-tab-${act.id}`}
              onClick={() => !locked && onChange(act.id)}
              onKeyDown={(e) => {
                // Arrow key navigation between tabs
                const ids = activities.filter((a) => !isLocked(a)).map((a) => a.id);
                const idx = ids.indexOf(act.id);
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const next = ids[(idx + 1) % ids.length];
                  onChange(next);
                  document.getElementById(`activity-tab-${next}`)?.focus();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prev = ids[(idx - 1 + ids.length) % ids.length];
                  onChange(prev);
                  document.getElementById(`activity-tab-${prev}`)?.focus();
                }
              }}
              tabIndex={active ? 0 : -1}
              disabled={locked}
              aria-label={locked ? `${act.label} — complete required activities first` : act.label}
              className={[
                'flex items-center gap-1.5 px-3 py-3 text-sm font-semibold whitespace-nowrap',
                'border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                active
                  ? 'border-blue-600 text-blue-600'
                  : locked
                    ? 'border-transparent text-slate-300 cursor-not-allowed'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
              ].join(' ')}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? color : locked ? 'text-slate-300' : 'text-slate-400'}`}
                aria-hidden
              />
              <span className="hidden sm:inline">{act.label}</span>
              {statusIcon(act)}
            </button>
          );
        })}
      </div>

      {/* Gating hint — shown when checkpoint is locked */}
      {activities.some((a) => a.id === 'checkpoint' && isLocked(a)) && (
        <div
          role="status"
          aria-live="polite"
          className="px-3 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-1.5"
        >
          <Lock className="w-3 h-3 flex-shrink-0" aria-hidden />
          Complete{' '}
          {[...gateIds]
            .filter((id) => !(completedActivities ?? attempted).has(id))
            .map((id) => activities.find((a) => a.id === id)?.label ?? id)
            .join(' and ')}{' '}
          to unlock the checkpoint.
        </div>
      )}
    </div>
  );
}
