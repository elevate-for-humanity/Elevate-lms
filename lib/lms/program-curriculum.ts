/**
 * Program-generic curriculum loader.
 *
 * Loads curriculum from training_lessons / training_courses / modules
 * for ANY program. No HVAC-specific imports.
 *
 * For HVAC enrichment (key terms, diagrams, etc.), use the HVAC-specific
 * enrichment layer in lib/courses/hvac-enrichment.ts.
 */

import { getAdminClient } from '@/lib/supabase/admin';

// ─── Types ───────────────────────────────────────────────

export interface ProgramLesson {
  id: string;
  courseId: string;
  moduleId: string | null;
  programId: string | null;
  title: string;
  lessonNumber: number;
  orderIndex: number;
  content: string;
  contentType: string;
  videoUrl: string | null;
  durationMinutes: number;
  topics: string[];
  quizQuestions: QuizQuestion[];
  isPublished: boolean;
  isRequired: boolean;
  description: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ProgramCourse {
  id: string;
  programId: string | null;
  courseName: string;
  title: string;
  description: string | null;
  slug: string | null;
  isActive: boolean;
  lessonCount: number;
}

export interface ProgramModule {
  id: string;
  programId: string | null;
  courseId: string | null;
  title: string;
  summary: string | null;
  orderIndex: number;
}

// ─── Loaders ─────────────────────────────────────────────

/**
 * Get all courses for a program.
 */
export async function getCoursesByProgram(programId: string): Promise<ProgramCourse[]> {
  const db = await getAdminClient();

  const { data, error } = await db
    .from('training_courses')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((c: any) => ({
    id: c.id,
    programId: c.program_id,
    courseName: c.course_name || c.title,
    title: c.title || c.course_name,
    description: c.description,
    slug: c.slug,
    isActive: c.is_active ?? true,
    lessonCount: 0,
  }));
}

/**
 * Get all modules for a course.
 */
export async function getModulesByCourse(courseId: string): Promise<ProgramModule[]> {
  const db = await getAdminClient();

  const { data, error } = await db
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error || !data) return [];

  return data.map((m: any) => ({
    id: m.id,
    programId: m.program_id,
    courseId: m.course_id,
    title: m.title,
    summary: m.summary,
    orderIndex: m.order_index,
  }));
}

/**
 * Get all lessons for a course, ordered by lesson_number.
 */
export async function getLessonsByCourse(courseId: string): Promise<ProgramLesson[]> {
  const db = await getAdminClient();

  const { data, error } = await db
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_number', { ascending: true });

  if (error || !data) return [];

  return data.map(mapLesson);
}

/**
 * Get a single lesson by ID.
 */
export async function getLessonById(lessonId: string): Promise<ProgramLesson | null> {
  const db = await getAdminClient();

  const { data, error } = await db
    .from('training_lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (error || !data) return null;

  return mapLesson(data);
}

/**
 * Get prev/next lesson for navigation.
 */
export async function getLessonNav(
  courseId: string,
  lessonNumber: number
): Promise<{ prev: ProgramLesson | null; next: ProgramLesson | null }> {
  const db = await getAdminClient();

  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    db.from('training_lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('lesson_number', lessonNumber - 1)
      .single(),
    db.from('training_lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('lesson_number', lessonNumber + 1)
      .single(),
  ]);

  return {
    prev: prevData ? mapLesson(prevData) : null,
    next: nextData ? mapLesson(nextData) : null,
  };
}

/**
 * Get course info by ID.
 */
export async function getCourseById(courseId: string): Promise<ProgramCourse | null> {
  const db = await getAdminClient();

  const { data, error } = await db
    .from('training_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    programId: data.program_id,
    courseName: data.course_name || data.title,
    title: data.title || data.course_name,
    description: data.description,
    slug: data.slug,
    isActive: data.is_active ?? true,
    lessonCount: 0,
  };
}

/**
 * Get program info by slug.
 */
export async function getProgramBySlug(slug: string) {
  const db = await getAdminClient();

  const { data, error } = await db
    .from('programs')
    .select('id, slug, title, category, description, completion_criteria')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Row Mapper ──────────────────────────────────────────

function mapLesson(row: any): ProgramLesson {
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id || null,
    programId: row.program_id || null,
    title: row.title,
    lessonNumber: row.lesson_number,
    orderIndex: row.order_index || row.lesson_number,
    content: row.content || '',
    contentType: row.content_type ?? 'lesson',
    videoUrl: row.video_url || null,
    durationMinutes: row.duration_minutes || 20,
    topics: row.topics || [],
    quizQuestions: (row.quiz_questions || []).map((q: any) => ({
      id: q.id || '',
      question: q.question || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || '',
    })),
    isPublished: row.is_published ?? true,
    isRequired: row.is_required ?? true,
    description: row.description || null,
  };
}
