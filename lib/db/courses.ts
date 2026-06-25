/**
 * Database operations for LMS resources using Supabase
 * Standardized CRUD with soft delete support
 */

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { setAuditContext } from '@/lib/audit-context';
import type {
  CourseCreate,
  CourseUpdate,
  LessonCreate,
  LessonUpdate,
  QuizCreate,
  QuizUpdate,
  QuestionCreate,
  QuestionUpdate,
  EnrollmentCreate,
  EnrollmentUpdate,
} from '@/lib/validators/course';

// ============ GENERIC HELPERS ============
async function getSupabase() {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');
  return supabase;
}

// ============ COURSES ============
export async function createCourse(input: CourseCreate) {
  const supabase = await getSupabase();
  const slug = input.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: input.title,
      description: input.description || null,
      program_id: input.program_id || null,
      duration_hours: input.duration_hours || null,
      is_active: input.is_published ?? false,
      slug,
      status: input.is_published ? 'published' : 'draft',
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Database operation failed: ${error.message}`);
  return data;
}

export async function listCourses() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lms_courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getCourse(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateCourse(id: string, patch: CourseUpdate) {
  const supabase = await getSupabase();
  const updateData: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteCourse(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ LESSONS ============
// All lesson CRUD targets course_lessons (canonical).
// training_lessons is the active HVAC lesson store — writable via admin CurriculumLessonManager.
export async function createLesson(input: LessonCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('course_lessons')
    .insert({
      course_id: input.course_id,
      title: input.title,
      content: input.content || null,
      video_url: input.video_url || null,
      duration_minutes: input.duration_minutes || null,
      order_index: input.order_index ?? 0,
      lesson_type: (input as any).lesson_type ?? 'lesson',
      is_published: false,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listLessons(courseId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getLesson(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateLesson(id: string, patch: LessonUpdate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('course_lessons')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteLesson(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('course_lessons').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ QUIZZES ============
export async function createQuiz(input: QuizCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      course_id: input.course_id,
      title: input.title,
      description: input.description || null,
      time_limit_minutes: input.time_limit_minutes || null,
      passing_score: input.passing_score ?? 70,
      max_attempts: input.max_attempts ?? 3,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listQuizzes(courseId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getQuiz(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('quizzes').select('*').eq('id', id).maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateQuiz(id: string, patch: QuizUpdate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('quizzes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteQuiz(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ QUIZ QUESTIONS ============
export async function createQuestion(input: QuestionCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: input.quiz_id,
      question_text: input.question_text,
      question_type: input.question_type || 'multiple_choice',
      options: input.options ? JSON.stringify(input.options) : null,
      correct_answer: input.correct_answer,
      points: input.points ?? 1,
      order_index: input.order_index ?? 0,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listQuestions(quizId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getQuestion(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateQuestion(id: string, patch: QuestionUpdate) {
  const supabase = await getSupabase();
  const updateData: any = { ...patch };
  if (patch.options) updateData.options = JSON.stringify(patch.options);
  const { data, error } = await supabase
    .from('quiz_questions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteQuestion(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ ENROLLMENTS ============
export async function createEnrollment(input: EnrollmentCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('program_enrollments')
    .insert({
      user_id: input.user_id,
      course_id: input.course_id,
      status: input.status || 'active',
      progress: input.progress ?? 0,
      at_risk: input.at_risk ?? false,
      enrolled_at: new Date().toISOString(),
    })
    .select('*, student:profiles(id, full_name, email), course:training_courses(id, course_name)')
    .maybeSingle();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listEnrollments(filters?: {
  courseId?: string;
  userId?: string;
  status?: string;
}) {
  const supabase = await getSupabase();
  let query = supabase
    .from('program_enrollments')
    .select('*, student:profiles(id, full_name, email), course:training_courses(id, course_name)')
    .order('enrolled_at', { ascending: false });

  if (filters?.courseId) query = query.eq('course_id', filters.courseId);
  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getEnrollment(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('program_enrollments')
    .select('*, student:profiles(id, full_name, email), course:training_courses(id, course_name)')
    .eq('id', id)
    .maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateEnrollment(id: string, patch: EnrollmentUpdate) {
  const supabase = await getSupabase();
  const updateData: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (patch.status === 'completed') updateData.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('program_enrollments')
    .update(updateData)
    .eq('id', id)
    .select('*, student:profiles(id, full_name, email), course:training_courses(id, course_name)')
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteEnrollment(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('program_enrollments').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ PROGRAMS ============
import type { ProgramCreate, ProgramUpdate } from '@/lib/validators/course';

export async function createProgram(input: ProgramCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .insert({
      code: input.code,
      title: input.title,
      description: input.description || null,
      duration_weeks: input.duration_weeks || null,
      total_hours: input.total_hours || null,
      tuition: input.tuition || null,
      funding_eligible: input.funding_eligible ?? true,
      status: input.status || 'draft',
      category: input.category || null,
      requirements: input.requirements || null,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listPrograms(filters?: { status?: string }) {
  const supabase = await getSupabase();
  let query = supabase.from('programs').select('*').order('title', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getProgram(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('programs').select('*').eq('id', id).maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateProgram(id: string, patch: ProgramUpdate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteProgram(id: string) {
  const supabase = await getSupabase();
  // Soft delete by setting status to archived
  const { error } = await supabase
    .from('programs')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ APPLICATIONS ============
import type { ApplicationCreate, ApplicationUpdate } from '@/lib/validators/course';

export async function createApplication(input: ApplicationCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: input.user_id || null,
      program_id: input.program_id,
      intake_id: input.intake_id || null,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      status: input.status || 'submitted',
      eligibility_data: input.eligibility_data || null,
      submitted_at: new Date().toISOString(),
    })
    .select('*, program:programs(id, title, code)')
    .maybeSingle();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listApplications(filters?: { status?: string; programId?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'staff', 'org_admin'].includes(profile.role)) {
    throw new Error('Forbidden');
  }

  // Use admin client — applications table is admin-managed and should bypass RLS
  // after route-level role checks.
  const db = await requireAdminClient();
  await setAuditContext(db, { systemActor: 'admin_applications_api' });

  let query = db
    .from('applications')
    .select('*, program:programs(id, title, code)')
    .order('submitted_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.programId) query = query.eq('program_id', filters.programId);

  const { data, error } = await query;
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getApplication(id: string) {
  // Use admin client — applications table RLS blocks session-based reads.
  // Callers are admin API routes that have already verified the caller's role.
  const db = await requireAdminClient();
  await setAuditContext(db, { systemActor: 'admin_applications_api' });
  const { data, error } = await db
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateApplication(id: string, patch: ApplicationUpdate) {
  // Use admin client — applications table RLS blocks session-based updates.
  const db = await requireAdminClient();
  await setAuditContext(db, { systemActor: 'admin_applications_api' });
  const updateData: any = { ...patch, updated_at: new Date().toISOString() };
  if (patch.status === 'approved' || patch.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await db
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .select('*, program:programs(id, title, code)')
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`DB update failed: ${error.message} (code: ${error.code})`);
  return data;
}

export async function deleteApplication(id: string) {
  const db = await requireAdminClient();
  await setAuditContext(db, { systemActor: 'admin_applications_api' });
  const { error } = await db.from('applications').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}

// ============ COURSE BLUEPRINT PERSISTENCE ============
import type { CourseBlueprint } from '@/lib/ai/course-ingestion';

/**
 * Persist a full AI-generated course blueprint as a draft.
 *
 * Schema alignment (verified 2025-03):
 *   courses           → canonical course record
 *   course_modules    → UUID PK, course_id UUID
 *   course_lessons    → UUID PK, course_id UUID, module_id UUID
 */
export async function saveCourseBlueprint(
  blueprint: CourseBlueprint,
  options: { program_id?: string | null; created_by?: string | null } = {},
): Promise<{ courseId: string; moduleCount: number; lessonCount: number; questionCount: number }> {
  const supabase = await getSupabase();

  // 1. Create course record — quiz stored in metadata JSONB
  const quizMetadata = blueprint.quiz_questions?.length
    ? {
        quiz_title: blueprint.quiz_title || 'Course Assessment',
        quiz_passing_score: blueprint.quiz_passing_score || 70,
        quiz_questions: blueprint.quiz_questions,
      }
    : null;

  const slug = blueprint.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({
      title: blueprint.title,
      slug,
      description: blueprint.description || null,
      short_description: blueprint.subtitle || null,
      duration_hours: blueprint.estimated_duration_hours
        ? Math.round(blueprint.estimated_duration_hours)
        : null,
      program_id: options.program_id || null,
      is_active: false,
      status: 'draft',
    })
    .select('id')
    .maybeSingle();

  if (courseErr || !course) throw new Error('Failed to create course record');
  const courseId = course.id;

  let lessonCount = 0;

  // 2. Create modules + lessons
  for (const mod of blueprint.modules ?? []) {
    const { data: moduleRow, error: modErr } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: mod.title,
        description: mod.description || null,
        order_index: mod.order_index ?? 0,
      })
      .select('id')
      .maybeSingle();

    if (modErr || !moduleRow) continue;

    const lessons = (mod.lessons ?? []).map((lesson, li) => {
      const compiled = lesson.compiled;
      // Merge compiled narration into content field; store full compiled package
      // (slide_outline, examples, quiz_questions) in quiz_questions JSONB column
      const compiledContent = compiled?.narration_script
        ? compiled.narration_script
        : lesson.content || null;

      const lessonQuizData = compiled
        ? {
            learning_objectives: compiled.learning_objectives,
            slide_outline: compiled.slide_outline,
            examples: compiled.examples,
            quiz_questions: compiled.quiz_questions,
          }
        : null;

      return {
        course_id: courseId,
        module_id: moduleRow.id,
        title: lesson.title,
        content: compiledContent,
        order_index: lesson.order_index ?? li,
        duration_minutes: lesson.duration_minutes || null,
        lesson_type: (lesson as any).lesson_type ?? 'lesson',
        is_published: false,
        // Store compiled slide/quiz/example assets in quiz_questions JSONB
        ...(lessonQuizData ? { quiz_questions: lessonQuizData } : {}),
      };
    });

    if (lessons.length) {
      const { error: lessonErr } = await supabase.from('course_lessons').insert(lessons);
      if (!lessonErr) lessonCount += lessons.length;
    }
  }

  return {
    courseId,
    moduleCount: blueprint.modules?.length ?? 0,
    lessonCount,
    questionCount: blueprint.quiz_questions?.length ?? 0,
  };
}
