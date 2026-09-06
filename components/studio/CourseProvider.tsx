'use client';

/**
 * CourseProvider.tsx
 *
 * The nervous system of the Course Studio.
 *
 * ONE source of truth for:
 *   course · modules · lessons · videos · automation · workflows ·
 *   publish state · AI memory · autosave state · loading state
 *
 * Every panel reads from this context — never fetches independently.
 * Mutations go through the actions exposed here, which update local state
 * optimistically and sync to the server in the background.
 *
 * AI memory is a rolling window of context messages that every panel
 * can append to — so the AI panel always knows what the user was doing.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  CourseSession,
  StudioCourse,
  StudioModule,
  StudioLesson,
  StudioQuiz,
  StudioVideo,
  StudioAutomationRule,
  StudioWorkflow,
  StudioPublishState,
} from '@/lib/studio/course-session';
import { emitStudioEvent, STUDIO_EVENTS } from '@/lib/studio/events';

// ─── AI Memory ────────────────────────────────────────────────────────────────

export interface AIMemoryEntry {
  role: 'system' | 'user' | 'assistant' | 'action';
  content: string;
  timestamp: string;
  /** Which panel generated this entry */
  source?: 'blueprint' | 'curriculum' | 'quiz' | 'media' | 'publish' | 'user';
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface CourseState {
  course: StudioCourse;
  modules: StudioModule[];
  lessons: StudioLesson[];
  quizzes: StudioQuiz[];
  videos: StudioVideo[];
  automationRules: StudioAutomationRule[];
  workflows: StudioWorkflow[];
  publishState: StudioPublishState;
  warnings: string[];
  loadedAt: string;

  /** Which panel is currently active */
  activePanel: StudioPanel;

  /** AI memory — rolling context window shared across all panels */
  aiMemory: AIMemoryEntry[];

  /** Autosave state */
  autosave: {
    isDirty: boolean;
    isSaving: boolean;
    lastSavedAt: string | null;
    error: string | null;
  };

  /** Per-panel loading states */
  loading: {
    lessons: boolean;
    modules: boolean;
    quizzes: boolean;
    media: boolean;
    publish: boolean;
  };
}

export type StudioPanel =
  | 'blueprint'
  | 'curriculum'
  | 'quiz'
  | 'media'
  | 'ai'
  | 'publish'
  | 'automation'
  | 'interactions'
  | 'assessments'
  | 'compliance';

// ─── Actions ──────────────────────────────────────────────────────────────────

type CourseAction =
  | { type: 'SET_PANEL'; panel: StudioPanel }
  | { type: 'UPDATE_COURSE'; patch: Partial<StudioCourse> }
  | { type: 'SET_MODULES'; modules: StudioModule[] }
  | { type: 'UPSERT_MODULE'; module: StudioModule }
  | { type: 'DELETE_MODULE'; moduleId: string }
  | { type: 'SET_LESSONS'; lessons: StudioLesson[] }
  | { type: 'UPSERT_LESSON'; lesson: StudioLesson }
  | { type: 'DELETE_LESSON'; lessonId: string }
  | { type: 'SET_VIDEOS'; videos: StudioVideo[] }
  | { type: 'APPEND_AI_MEMORY'; entry: AIMemoryEntry }
  | { type: 'CLEAR_AI_MEMORY' }
  | { type: 'SET_DIRTY' }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_SAVED'; at: string }
  | { type: 'SET_SAVE_ERROR'; error: string }
  | { type: 'SET_LOADING'; key: keyof CourseState['loading']; value: boolean }
  | { type: 'UPDATE_PUBLISH_STATE'; patch: Partial<StudioPublishState> };

// ─── Reducer ──────────────────────────────────────────────────────────────────

const MAX_AI_MEMORY = 40; // rolling window

function reducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'SET_PANEL':
      return { ...state, activePanel: action.panel };

    case 'UPDATE_COURSE':
      return {
        ...state,
        course: { ...state.course, ...action.patch },
        autosave: { ...state.autosave, isDirty: true },
      };

    case 'SET_MODULES':
      return { ...state, modules: action.modules };

    case 'UPSERT_MODULE': {
      const exists = state.modules.find(m => m.id === action.module.id);
      return {
        ...state,
        modules: exists
          ? state.modules.map(m => m.id === action.module.id ? action.module : m)
          : [...state.modules, action.module].sort((a, b) => a.order_index - b.order_index),
        // Module mutations have their own API calls — do not mark course metadata dirty
      };
    }

    case 'DELETE_MODULE':
      return {
        ...state,
        modules: state.modules.filter(m => m.id !== action.moduleId),
        // Module mutations have their own API calls — do not mark course metadata dirty
      };

    case 'SET_LESSONS':
      return { ...state, lessons: action.lessons };

    case 'UPSERT_LESSON': {
      const exists = state.lessons.find(l => l.id === action.lesson.id);
      return {
        ...state,
        lessons: exists
          ? state.lessons.map(l => l.id === action.lesson.id ? action.lesson : l)
          : [...state.lessons, action.lesson].sort((a, b) => a.order_index - b.order_index),
        // Lesson mutations have their own API calls — do not mark course metadata dirty
      };
    }

    case 'DELETE_LESSON':
      return {
        ...state,
        lessons: state.lessons.filter(l => l.id !== action.lessonId),
        // Lesson mutations have their own API calls — do not mark course metadata dirty
      };

    case 'SET_VIDEOS':
      return { ...state, videos: action.videos };

    case 'APPEND_AI_MEMORY': {
      const updated = [...state.aiMemory, action.entry];
      return {
        ...state,
        aiMemory: updated.length > MAX_AI_MEMORY
          ? updated.slice(updated.length - MAX_AI_MEMORY)
          : updated,
      };
    }

    case 'CLEAR_AI_MEMORY':
      return { ...state, aiMemory: [] };

    case 'SET_DIRTY':
      return { ...state, autosave: { ...state.autosave, isDirty: true } };

    case 'SET_SAVING':
      return { ...state, autosave: { ...state.autosave, isSaving: action.saving } };

    case 'SET_SAVED':
      return {
        ...state,
        autosave: { isDirty: false, isSaving: false, lastSavedAt: action.at, error: null },
      };

    case 'SET_SAVE_ERROR':
      return {
        ...state,
        autosave: { ...state.autosave, isSaving: false, error: action.error },
      };

    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };

    case 'UPDATE_PUBLISH_STATE':
      return { ...state, publishState: { ...state.publishState, ...action.patch } };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CourseContextValue {
  state: CourseState;

  // Panel navigation
  setPanel: (panel: StudioPanel) => void;

  // Course mutations
  updateCourse: (patch: Partial<StudioCourse>) => void;

  // Module mutations
  upsertModule: (module: StudioModule) => void;
  deleteModule: (moduleId: string) => void;

  // Lesson mutations
  upsertLesson: (lesson: StudioLesson) => void;
  deleteLesson: (lessonId: string) => void;

  // AI memory
  appendAIMemory: (entry: Omit<AIMemoryEntry, 'timestamp'>) => void;
  clearAIMemory: () => void;
  /** Build a context string for the AI from current state */
  buildAIContext: () => string;

  // Publish
  updatePublishState: (patch: Partial<StudioPublishState>) => void;

  // Manual save trigger
  save: () => Promise<void>;
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function useCourse(): CourseContextValue {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourse must be used inside CourseProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CourseProviderProps {
  session: CourseSession;
  children: ReactNode;
}

export function CourseProvider({ session, children }: CourseProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    ...session,
    activePanel: 'blueprint',
    aiMemory: [
      {
        role: 'system',
        content: buildSystemPrompt(session),
        timestamp: new Date().toISOString(),
        source: 'blueprint',
      },
    ],
    autosave: {
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      error: null,
    },
    loading: {
      lessons: false,
      modules: false,
      quizzes: false,
      media: false,
      publish: false,
    },
  });

  // ── Autosave — debounced 2s after any dirty change ───────────────────────
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!state.autosave.isDirty || state.autosave.isSaving) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void performSave(stateRef.current, dispatch);
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [state.autosave.isDirty, state.autosave.isSaving]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const setPanel = useCallback((panel: StudioPanel) => {
    dispatch({ type: 'SET_PANEL', panel });
  }, []);

  const updateCourse = useCallback((patch: Partial<StudioCourse>) => {
    dispatch({ type: 'UPDATE_COURSE', patch });
  }, []);

  const upsertModule = useCallback((module: StudioModule) => {
    dispatch({ type: 'UPSERT_MODULE', module });
    emitStudioEvent(STUDIO_EVENTS.MODULE_UPDATED, {
      courseId: module.course_id,
      moduleId: module.id,
    });
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    dispatch({ type: 'DELETE_MODULE', moduleId });
    emitStudioEvent(STUDIO_EVENTS.MODULE_DELETED, {
      courseId: stateRef.current.course.id,
      moduleId,
    });
  }, []);

  const upsertLesson = useCallback((lesson: StudioLesson) => {
    dispatch({ type: 'UPSERT_LESSON', lesson });
    emitStudioEvent(STUDIO_EVENTS.LESSON_UPDATED, {
      courseId: lesson.course_id,
      lessonId: lesson.id,
      lessonType: lesson.lesson_type,
    });
  }, []);

  const deleteLesson = useCallback((lessonId: string) => {
    dispatch({ type: 'DELETE_LESSON', lessonId });
  }, []);

  const appendAIMemory = useCallback((entry: Omit<AIMemoryEntry, 'timestamp'>) => {
    dispatch({
      type: 'APPEND_AI_MEMORY',
      entry: { ...entry, timestamp: new Date().toISOString() },
    });
  }, []);

  const clearAIMemory = useCallback(() => {
    dispatch({ type: 'CLEAR_AI_MEMORY' });
  }, []);

  const buildAIContext = useCallback((): string => {
    const s = stateRef.current;

    // Module list with IDs (needed for createLesson tool calls)
    const moduleLines = s.modules
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map(m => `  - [${m.id}] "${m.title}" (order ${m.order_index ?? '?'}, ${
        s.lessons.filter(l => l.module_id === m.id).length
      } lessons)`);

    // Lesson list with IDs and types (needed for generateQuiz, attachVideo)
    const lessonLines = s.lessons
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .slice(0, 30) // cap at 30 to avoid token overflow
      .map(l => `  - [${l.id}] "${l.title}" (${l.lesson_type ?? 'lesson'}${l.quiz_questions ? ', has quiz' : ''})`);

    // Quiz summary
    const quizLines = s.quizzes.slice(0, 10).map(q =>
      `  - [${q.id}] "${q.title}" (${q.question_count ?? 0} questions)`
    );

    // Video summary
    const videoLines = s.videos.slice(0, 10).map(v =>
      `  - [${v.id}] "${v.title}" — ${v.url ?? 'no url'}`
    );

    return [
      `COURSE: "${s.course.title}" [id: ${s.course.id}]`,
      `Status: ${s.course.status} | Active panel: ${s.activePanel}`,
      s.course.governing_body
        ? `Standard: ${s.course.governing_body} ${s.course.governing_standard_version ?? ''}`
        : '',
      s.course.compliance_profile_key
        ? `Compliance: ${s.course.compliance_profile_key}`
        : '',
      '',
      `MODULES (${s.modules.length}):`,
      ...moduleLines,
      '',
      `LESSONS (${s.lessons.length}${s.lessons.length > 30 ? ', showing first 30' : ''}):`,
      ...lessonLines,
      '',
      s.quizzes.length > 0 ? `QUIZZES (${s.quizzes.length}):` : '',
      ...quizLines,
      '',
      s.videos.length > 0 ? `VIDEOS (${s.videos.length}):` : '',
      ...videoLines,
      '',
      `PUBLISH STATE: ${s.publishState.publishedLessons}/${s.publishState.totalLessons} lessons published, ${s.publishState.approvedLessons} approved`,
      s.publishState.readyToPublish ? 'Ready to publish: YES' : 'Ready to publish: NO',
    ].filter(l => l !== undefined && l !== null).join('\n');
  }, []);

  const updatePublishState = useCallback((patch: Partial<StudioPublishState>) => {
    dispatch({ type: 'UPDATE_PUBLISH_STATE', patch });
  }, []);

  const save = useCallback(async () => {
    await performSave(stateRef.current, dispatch);
  }, []);

  return (
    <CourseContext.Provider
      value={{
        state,
        setPanel,
        updateCourse,
        upsertModule,
        deleteModule,
        upsertLesson,
        deleteLesson,
        appendAIMemory,
        clearAIMemory,
        buildAIContext,
        updatePublishState,
        save,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

// ─── Autosave implementation ──────────────────────────────────────────────────

async function performSave(
  state: CourseState,
  dispatch: React.Dispatch<CourseAction>,
): Promise<void> {
  if (!state.autosave.isDirty) return;
  dispatch({ type: 'SET_SAVING', saving: true });
  try {
    const res = await fetch(`/api/admin/courses/${state.course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: state.course.title,
        description: state.course.description,
        subtitle: state.course.short_description,
        thumbnail_url: state.course.thumbnail_url,
        duration_hours: state.course.duration_hours,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Save failed' }));
      dispatch({ type: 'SET_SAVE_ERROR', error: err.error ?? 'Save failed' });
    } else {
      dispatch({ type: 'SET_SAVED', at: new Date().toISOString() });
    }
  } catch (err) {
    dispatch({ type: 'SET_SAVE_ERROR', error: err instanceof Error ? err.message : 'Save failed' });
  }
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(session: CourseSession): string {
  return [
    'You are the AI assistant for the Elevate LMS Course Studio.',
    `You are working on: "${session.course.title}"`,
    `Status: ${session.course.status} | Modules: ${session.modules.length} | Lessons: ${session.lessons.length}`,
    session.course.governing_body
      ? `Governing standard: ${session.course.governing_body} ${session.course.governing_standard_version ?? ''}`
      : '',
    session.course.compliance_profile_key
      ? `Compliance profile: ${session.course.compliance_profile_key}`
      : '',
    'You can help create lessons, generate quizzes, suggest improvements, and guide publishing.',
    'Always respond with awareness of the current course structure.',
  ].filter(Boolean).join('\n');
}
