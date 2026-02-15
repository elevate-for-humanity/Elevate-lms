/**
 * Database operations for LMS resources using Supabase
 * Standardized CRUD with soft delete support
 */

import { createClient } from '@/lib/supabase/server';
import type { 
  CourseCreate, CourseUpdate,
  LessonCreate, LessonUpdate,
  QuizCreate, QuizUpdate,
  QuestionCreate, QuestionUpdate,
  EnrollmentCreate, EnrollmentUpdate 
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
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: input.title,
      description: input.description || null,
      program_id: input.program_id || null,
      duration_hours: input.duration_hours || null,
      is_published: input.is_published ?? false,
    })
    .select()
    .single();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listCourses() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('courses')
    .select('*, programs(id, title)')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getCourse(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('courses')
    .select('*, programs(id, title)')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateCourse(id: string, patch: CourseUpdate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('courses')
    .update({ ...patch, updated_at: new Date().toISOString() })
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
export async function createLesson(input: LessonCreate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: input.course_id,
      title: input.title,
      content: input.content || null,
      video_url: input.video_url || null,
      duration_minutes: input.duration_minutes || null,
      order_index: input.order_index ?? 0,
    })
    .select()
    .single();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listLessons(courseId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getLesson(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateLesson(id: string, patch: LessonUpdate) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lessons')
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
  const { error } = await supabase.from('lessons').delete().eq('id', id);
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
    .single();
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
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single();
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
    .single();
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
    .single();
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
    .from('enrollments')
    .insert({
      user_id: input.user_id,
      course_id: input.course_id,
      status: input.status || 'active',
      progress: input.progress ?? 0,
      at_risk: input.at_risk ?? false,
      enrolled_at: new Date().toISOString(),
    })
    .select('*, student:profiles!enrollments_user_id_fkey(id, full_name, email), course:courses(id, title)')
    .single();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listEnrollments(filters?: { courseId?: string; userId?: string; status?: string }) {
  const supabase = await getSupabase();
  let query = supabase
    .from('enrollments')
    .select('*, student:profiles!enrollments_user_id_fkey(id, full_name, email), course:courses(id, title)')
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
    .from('enrollments')
    .select('*, student:profiles!enrollments_user_id_fkey(id, full_name, email), course:courses(id, title)')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateEnrollment(id: string, patch: EnrollmentUpdate) {
  const supabase = await getSupabase();
  const updateData: any = { ...patch, updated_at: new Date().toISOString() };
  if (patch.status === 'completed') updateData.completed_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('enrollments')
    .update(updateData)
    .eq('id', id)
    .select('*, student:profiles!enrollments_user_id_fkey(id, full_name, email), course:courses(id, title)')
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteEnrollment(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('enrollments').delete().eq('id', id);
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
    .single();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listPrograms(filters?: { status?: string }) {
  const supabase = await getSupabase();
  let query = supabase
    .from('programs')
    .select('*')
    .order('title', { ascending: true });
  
  if (filters?.status) query = query.eq('status', filters.status);
  
  const { data, error } = await query;
  if (error) throw new Error('Database operation failed');
  return data || [];
}

export async function getProgram(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();
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
    .single();
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function listApplications(filters?: { status?: string; programId?: string }) {
  const supabase = await getSupabase();
  let query = supabase
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
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('applications')
    .select('*, program:programs(id, title, code)')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function updateApplication(id: string, patch: ApplicationUpdate) {
  const supabase = await getSupabase();
  const updateData: any = { ...patch, updated_at: new Date().toISOString() };
  if (patch.status === 'approved' || patch.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .select('*, program:programs(id, title, code)')
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error('Database operation failed');
  return data;
}

export async function deleteApplication(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw new Error('Database operation failed');
  return { ok: true };
}
