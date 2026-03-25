/**
 * Deterministic activity map for the LMS lesson page.
 *
 * Maps step_type → ordered activity list with completion requirements.
 * This is the single source of truth for what activities appear in a lesson
 * and what must be completed before the checkpoint/exam tab unlocks.
 *
 * The lesson page reads this map to:
 *   1. Render the activity menu (LessonActivityMenu)
 *   2. Determine which activities gate the checkpoint tab
 *   3. Decide which component to render per activity
 */

export type ActivityId =
  | 'video'
  | 'reading'
  | 'flashcards'
  | 'lab'
  | 'scenario'
  | 'practice'
  | 'checkpoint'
  | 'notes'
  | 'resources';

export interface ActivityDef {
  id: ActivityId;
  label: string;
  /** Gates the checkpoint tab — must be attempted before checkpoint unlocks */
  gatesCheckpoint: boolean;
  /** Shown in the menu even when no content is available (renders empty state) */
  alwaysShow: boolean;
}

/** Activities available per step_type */
const ACTIVITY_MAP: Record<string, ActivityDef[]> = {
  lesson: [
    { id: 'video',       label: 'Watch Video',         gatesCheckpoint: false, alwaysShow: true  },
    { id: 'reading',     label: 'Reading',             gatesCheckpoint: false, alwaysShow: true  },
    { id: 'flashcards',  label: 'Flashcards',          gatesCheckpoint: false, alwaysShow: true  },
    { id: 'practice',    label: 'Practice Questions',  gatesCheckpoint: false, alwaysShow: true  },
    { id: 'notes',       label: 'My Notes',            gatesCheckpoint: false, alwaysShow: false },
    { id: 'resources',   label: 'Resources',           gatesCheckpoint: false, alwaysShow: false },
  ],
  checkpoint: [
    { id: 'video',       label: 'Watch Video',         gatesCheckpoint: true,  alwaysShow: true  },
    { id: 'reading',     label: 'Reading',             gatesCheckpoint: true,  alwaysShow: true  },
    { id: 'flashcards',  label: 'Flashcards',          gatesCheckpoint: false, alwaysShow: true  },
    { id: 'practice',    label: 'Practice Questions',  gatesCheckpoint: true,  alwaysShow: true  },
    { id: 'checkpoint',  label: 'Checkpoint Quiz',     gatesCheckpoint: false, alwaysShow: true  },
  ],
  quiz: [
    { id: 'video',       label: 'Watch Video',         gatesCheckpoint: false, alwaysShow: true  },
    { id: 'flashcards',  label: 'Flashcards',          gatesCheckpoint: false, alwaysShow: true  },
    { id: 'practice',    label: 'Practice Questions',  gatesCheckpoint: false, alwaysShow: true  },
    { id: 'checkpoint',  label: 'Quiz',                gatesCheckpoint: false, alwaysShow: true  },
  ],
  exam: [
    { id: 'video',       label: 'Watch Video',         gatesCheckpoint: false, alwaysShow: true  },
    { id: 'flashcards',  label: 'Flashcards',          gatesCheckpoint: false, alwaysShow: true  },
    { id: 'practice',    label: 'Practice Questions',  gatesCheckpoint: false, alwaysShow: true  },
    { id: 'checkpoint',  label: 'Final Exam',          gatesCheckpoint: false, alwaysShow: true  },
  ],
  lab: [
    { id: 'video',       label: 'Watch Video',         gatesCheckpoint: true,  alwaysShow: true  },
    { id: 'reading',     label: 'Reading',             gatesCheckpoint: false, alwaysShow: true  },
    { id: 'lab',         label: 'Hands-On Lab',        gatesCheckpoint: false, alwaysShow: true  },
    { id: 'notes',       label: 'My Notes',            gatesCheckpoint: false, alwaysShow: false },
  ],
  assignment: [
    { id: 'reading',     label: 'Reading',             gatesCheckpoint: false, alwaysShow: true  },
    { id: 'lab',         label: 'Assignment',          gatesCheckpoint: false, alwaysShow: true  },
    { id: 'notes',       label: 'My Notes',            gatesCheckpoint: false, alwaysShow: false },
  ],
};

const DEFAULT_ACTIVITIES: ActivityDef[] = ACTIVITY_MAP.lesson;

/**
 * Returns the ordered activity list for a given step_type.
 *
 * If the lesson has a stored `activities` JSONB array (from the DB), that
 * takes priority — the map is used as a fallback for legacy/unset lessons.
 */
export function getActivitiesForLesson(
  stepType: string,
  storedActivities?: Array<{ type: string; label: string; order: number; required: boolean }> | null
): ActivityDef[] {
  // DB-stored activities take priority
  if (storedActivities && storedActivities.length > 0) {
    return storedActivities
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(a => ({
        id: a.type as ActivityId,
        label: a.label,
        gatesCheckpoint: a.required && a.type !== 'checkpoint',
        alwaysShow: true,
      }));
  }

  return ACTIVITY_MAP[stepType] ?? DEFAULT_ACTIVITIES;
}

/**
 * Returns the IDs of activities that must be attempted before the
 * checkpoint/exam tab unlocks.
 */
export function getCheckpointGates(activities: ActivityDef[]): ActivityId[] {
  return activities.filter(a => a.gatesCheckpoint).map(a => a.id);
}

/**
 * Returns the default (first) activity for a step_type.
 * Used when no ?activity= param is present in the URL.
 */
export function getDefaultActivity(stepType: string): ActivityId {
  const activities = ACTIVITY_MAP[stepType] ?? DEFAULT_ACTIVITIES;
  return activities[0]?.id ?? 'video';
}
