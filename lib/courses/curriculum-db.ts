/**
 * Database-backed curriculum loader.
 *
 * Reads from training_lessons (95 HVAC rows) and training_courses.
 * Falls back to TypeScript data files if DB query fails.
 * Enriches DB data with TS-file content (key terms, diagrams, etc.)
 * that isn't stored in the DB schema.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { HVAC_LESSON_CONTENT } from './hvac-lesson-content';
import './hvac-epa608-lessons'; // Side-effect import populates HVAC_LESSON_CONTENT
import { HVAC_QUICK_CHECKS } from './hvac-quick-checks';
import { HVAC_RECAPS } from './hvac-recaps';
import { HVAC_LESSON_UUID, HVAC_COURSE_ID } from './hvac-uuids';
import { HVAC_LESSON_NUMBER_TO_DEF_ID } from './hvac-lesson-number-map';

// ─── Types ───────────────────────────────────────────────

export interface CurriculumLesson {
  id: string;
  programId: string;
  courseId: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonNumber: number;
  lessonOrder: number;
  moduleOrder: number;
  moduleTitle: string;
  content: string;
  scriptText: string;
  keyTerms: { term: string; definition: string }[];
  jobApplication: string;
  watchFor: string[];
  diagramRef: string | null;
  videoUrl: string | null;
  audioFile: string | null;
  captionFile: string | null;
  contentType: string;
  durationMinutes: number;
  topics: string[];
  quizQuestions: CurriculumQuiz[];
  isPublished: boolean;
}

export interface CurriculumQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CurriculumRecap {
  title: string;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────

function lessonNumberToDefId(lessonNumber: number): string | null {
  return HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNumber] || null;
}

function defIdToModuleNum(defId: string): number {
  if (defId.startsWith('epa-')) return 17;
  const parts = defId.split('-');
  return parseInt(parts[1] || '1', 10);
}

function enrichWithTsContent(
  lessonId: string,
  defId: string | null
): { keyTerms: { term: string; definition: string }[]; jobApplication: string; watchFor: string[]; diagramRef: string | null } {
  const tsContent = defId ? HVAC_LESSON_CONTENT[defId] : null;
  return {
    keyTerms: tsContent?.keyTerms || [],
    jobApplication: tsContent?.jobApplication || '',
    watchFor: tsContent?.watchFor || [],
    diagramRef: tsContent?.diagramRef || null,
  };
}

// ─── Database Loaders ────────────────────────────────────

export async function getLessonsByCourse(courseId: string = HVAC_COURSE_ID): Promise<CurriculumLesson[]> {
  const db = createAdminClient();
  if (!db) return getFallbackLessons();

  const { data: lessons, error } = await db
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_number', { ascending: true });

  if (error || !lessons?.length) return getFallbackLessons();

  return lessons.map(mapDbLesson);
}

export async function getLessonById(lessonId: string): Promise<CurriculumLesson | null> {
  const db = createAdminClient();
  if (!db) return getFallbackLessonById(lessonId);

  const { data: lesson, error } = await db
    .from('training_lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (error || !lesson) return getFallbackLessonById(lessonId);

  return mapDbLesson(lesson);
}

export async function getLessonByNumber(
  lessonNumber: number,
  courseId: string = HVAC_COURSE_ID
): Promise<CurriculumLesson | null> {
  const db = createAdminClient();
  if (!db) return getFallbackLessonByNumber(lessonNumber);

  const { data: lesson, error } = await db
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('lesson_number', lessonNumber)
    .single();

  if (error || !lesson) return getFallbackLessonByNumber(lessonNumber);

  return mapDbLesson(lesson);
}

export async function getQuizzesByLessonId(lessonId: string): Promise<CurriculumQuiz[]> {
  const tsQuizzes = HVAC_QUICK_CHECKS[lessonId];
  if (tsQuizzes?.length) {
    return tsQuizzes.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
    }));
  }
  return [];
}

export async function getRecapsByLessonId(lessonId: string): Promise<CurriculumRecap[]> {
  const recaps = HVAC_RECAPS[lessonId];
  if (!recaps) return [];
  return recaps.map((r) => ({
    title: r.title,
    description: r.description || '',
  }));
}

export async function getLessonNavigation(
  lessonNumber: number,
  courseId: string = HVAC_COURSE_ID
): Promise<{ prevId: string | null; nextId: string | null }> {
  const db = createAdminClient();
  if (!db) return getFallbackNavigation(lessonNumber);

  const [{ data: prev }, { data: next }] = await Promise.all([
    db.from('training_lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('lesson_number', lessonNumber - 1)
      .single(),
    db.from('training_lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('lesson_number', lessonNumber + 1)
      .single(),
  ]);

  return {
    prevId: prev?.id || null,
    nextId: next?.id || null,
  };
}

// ─── Row Mapper ──────────────────────────────────────────

function mapDbLesson(row: Record<string, unknown>): CurriculumLesson {
  const lessonNumber = row.lesson_number as number;
  const lessonId = row.id as string;
  const defId = lessonNumberToDefId(lessonNumber);
  const enrichment = enrichWithTsContent(lessonId, defId);
  const moduleNum = defId ? defIdToModuleNum(defId) : Math.ceil(lessonNumber / 6);

  return {
    id: lessonId,
    programId: '',
    courseId: (row.course_id as string) || HVAC_COURSE_ID,
    lessonSlug: defId || `lesson-${lessonNumber}`,
    lessonTitle: row.title as string,
    lessonNumber,
    lessonOrder: (row.order_index as number) || lessonNumber,
    moduleOrder: moduleNum,
    moduleTitle: `Module ${moduleNum}`,
    content: (row.content as string) || '',
    scriptText: (row.content as string) || '',
    keyTerms: enrichment.keyTerms,
    jobApplication: enrichment.jobApplication,
    watchFor: enrichment.watchFor,
    diagramRef: enrichment.diagramRef,
    videoUrl: (row.video_url as string) || null,
    audioFile: `/generated/lessons/${lessonId}.mp3`,
    captionFile: null,
    contentType: (row.content_type as string) ?? 'lesson',
    durationMinutes: (row.duration_minutes as number) || 20,
    topics: (row.topics as string[]) || [],
    quizQuestions: ((row.quiz_questions as any[]) || []).map((q: any) => ({
      id: q.id || '',
      question: q.question || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || '',
    })),
    isPublished: (row.is_published as boolean) ?? true,
  };
}

// ─── Fallback to TypeScript Data Files ───────────────────

function getFallbackLessons(): CurriculumLesson[] {
  return Object.entries(HVAC_LESSON_CONTENT).map(([defId, content], index) => {
    const uuid = HVAC_LESSON_UUID[defId] || defId;
    const moduleNum = defIdToModuleNum(defId);

    return {
      id: uuid,
      programId: '',
      courseId: HVAC_COURSE_ID,
      lessonSlug: defId,
      lessonTitle: content.keyTerms?.[0]?.term || defId,
      lessonNumber: index + 1,
      lessonOrder: index + 1,
      moduleOrder: moduleNum,
      moduleTitle: `Module ${moduleNum}`,
      content: content.concept || '',
      scriptText: content.concept || '',
      keyTerms: content.keyTerms || [],
      jobApplication: content.jobApplication || '',
      watchFor: content.watchFor || [],
      diagramRef: content.diagramRef || null,
      videoUrl: `/generated/videos/${uuid}.mp4`,
      audioFile: `/generated/lessons/${uuid}.mp3`,
      captionFile: null,
      contentType: 'video',
      durationMinutes: 20,
      topics: [],
      quizQuestions: (HVAC_QUICK_CHECKS[uuid] || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      })),
      isPublished: true,
    };
  });
}

function getFallbackLessonById(lessonId: string): CurriculumLesson | null {
  const defId = Object.entries(HVAC_LESSON_UUID).find(([, uuid]) => uuid === lessonId)?.[0];
  if (!defId) return null;
  const content = HVAC_LESSON_CONTENT[defId];
  if (!content) return null;

  const moduleNum = defIdToModuleNum(defId);
  return {
    id: lessonId,
    programId: '',
    courseId: HVAC_COURSE_ID,
    lessonSlug: defId,
    lessonTitle: content.keyTerms?.[0]?.term || defId,
    lessonNumber: 0,
    lessonOrder: 0,
    moduleOrder: moduleNum,
    moduleTitle: `Module ${moduleNum}`,
    content: content.concept || '',
    scriptText: content.concept || '',
    keyTerms: content.keyTerms || [],
    jobApplication: content.jobApplication || '',
    watchFor: content.watchFor || [],
    diagramRef: content.diagramRef || null,
    videoUrl: `/generated/videos/${lessonId}.mp4`,
    audioFile: `/generated/lessons/${lessonId}.mp3`,
    captionFile: null,
    contentType: 'video',
    durationMinutes: 20,
    topics: [],
    quizQuestions: (HVAC_QUICK_CHECKS[lessonId] || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
    })),
    isPublished: true,
  };
}

function getFallbackLessonByNumber(lessonNumber: number): CurriculumLesson | null {
  const defId = lessonNumberToDefId(lessonNumber);
  if (!defId) return null;
  const uuid = HVAC_LESSON_UUID[defId];
  if (!uuid) return null;
  return getFallbackLessonById(uuid);
}

function getFallbackNavigation(lessonNumber: number): { prevId: string | null; nextId: string | null } {
  const prevDefId = lessonNumberToDefId(lessonNumber - 1);
  const nextDefId = lessonNumberToDefId(lessonNumber + 1);
  return {
    prevId: prevDefId ? (HVAC_LESSON_UUID[prevDefId] || null) : null,
    nextId: nextDefId ? (HVAC_LESSON_UUID[nextDefId] || null) : null,
  };
}
