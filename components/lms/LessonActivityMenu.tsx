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
  CheckCircle2,
} from 'lucide-react';
import type { ActivityId, ActivityDef } from '@/lib/lms/activity-map';
import { getCheckpointGates } from '@/lib/lms/activity-map';

const ACTIVITY_ICONS: Record<ActivityId, React.ElementType> = {
  video:       Video,
  reading:     FileText,
  flashcards:  Brain,
  lab:         FlaskConical,
  scenario:    FlaskConical,
  practice:    Zap,
  checkpoint:  Shield,
  notes:       MessageSquare,
  resources:   Download,
};

const ACTIVITY_COLORS: Record<ActivityId, string> = {
  video:       'text-blue-600',
  reading:     'text-slate-600',
  flashcards:  'text-purple-600',
  lab:         'text-green-600',
  scenario:    'text-teal-600',
  practice:    'text-amber-600',
  checkpoint:  'text-red-600',
  notes:       'text-slate-500',
  resources:   'text-slate-500',
};

interface Props {
  activities:  ActivityDef[];
  activeId:    ActivityId;
  attempted:   Set<ActivityId>;
  isCompleted: boolean;
  onChange:    (id: ActivityId) => void;
}

export default function LessonActivityMenu({
  activities,
  activeId,
  attempted,
  isCompleted,
  onChange,
}: Props) {
  const gateIds = new Set(getCheckpointGates(activities));

  function isLocked(act: ActivityDef): boolean {
    // Checkpoint/exam tab locked until all gating activities attempted
    if (act.id !== 'checkpoint') return false;
    if (isCompleted) return false;
    return [...gateIds].some(id => !attempted.has(id));
  }

  function statusIcon(act: ActivityDef) {
    if (isLocked(act)) {
      return <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    }
    if (attempted.has(act.id)) {
      return <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />;
    }
    if (act.gatesCheckpoint) {
      // Required but not yet attempted — red dot
      return <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />;
    }
    return null;
  }

  return (
    <div className="border-b border-slate-200 mb-6">
      <div className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-hide">
        {activities.map((act) => {
          const Icon    = ACTIVITY_ICONS[act.id] ?? FileText;
          const color   = ACTIVITY_COLORS[act.id] ?? 'text-slate-600';
          const active  = activeId === act.id;
          const locked  = isLocked(act);

          return (
            <button
              key={act.id}
              onClick={() => !locked && onChange(act.id)}
              disabled={locked}
              aria-selected={active}
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
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? color : locked ? 'text-slate-300' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{act.label}</span>
              {statusIcon(act)}
            </button>
          );
        })}
      </div>

      {/* Gating hint — shown when checkpoint is locked */}
      {activities.some(a => a.id === 'checkpoint' && isLocked(a)) && (
        <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-1.5">
          <Lock className="w-3 h-3 flex-shrink-0" />
          Complete{' '}
          {[...gateIds]
            .filter(id => !attempted.has(id))
            .map(id => activities.find(a => a.id === id)?.label ?? id)
            .join(', ')}{' '}
          to unlock the checkpoint.
        </div>
      )}
    </div>
  );
}
