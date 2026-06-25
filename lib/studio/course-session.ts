/**
 * lib/studio/course-session.ts
 *
 * Centralized server loader for the Course Studio.
 *
 * ONE function. ONE Promise.all. ONE auth check.
 * Every panel in the studio reads from this — never fetches independently.
 *
 * Design rules:
 * - Auth is enforced here, not in each panel.
 * - Required data (course) throws on failure — page renders error boundary.
 * - Optional data (videos, automation, workflows) degrades to [] on failure.
 * - No inferred FK joins — every relationship fetched separately and merged.
 * - Column names validated against live schema (2026-05).
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface StudioCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  status: string;
  is_active: boolean;
  published_at: string | null;
  thumbnail_url: string | null;
  duration_hours: number | null;
  total_lessons: number | null;
  generation_status: string | null;
  generation_progress: number | null;
  review_status: string | null;
  program_id: string | null;
  org_id: string | null;
  version: number | null;
  compliance_profile_key: string | null;
  governing_body: string | null;
  governing_standard_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  slug: string | null;
  is_published: boolean;
  is_required: boolean;
  duration_minutes: number | null;
  target_hours: number | null;
  domain_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioLesson {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  slug: string;
  lesson_type: string;
  order_index: number;
  status: string | null;
  is_published: boolean;
  is_required: boolean;
  passing_score: number | null;
  duration_minutes: number | null;
  video_url: string | null;
  video_config: Record<string, unknown> | null;
  activities: Record<string, unknown> | null;
  quiz_questions: unknown[] | null;
  ai_generated: boolean;
  approved: boolean;
  generation_status: string | null;
  requires_instructor_signoff: boolean;
  learning_objectives: unknown[] | null;
  competency_checks: unknown[] | null;
  created_at: string;
  updated_at: string;
}

export interface StudioVideo {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published: boolean;
  category: string | null;
  created_at: string;
}

export interface StudioAutomationRule {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger_type: string;
  action_type: string;
  enabled: boolean;
  run_count: number;
  last_triggered_at: string | null;
  created_at: string;
}

export interface StudioWorkflow {
  id: string;
  name: string;
  workflow_key: string;
  category: string | null;
  status: string;
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  created_at: string;
}

export interface StudioQuiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number | null;
  question_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface StudioPublishState {
  isPublished: boolean;
  publishedAt: string | null;
  reviewStatus: string | null;
  generationStatus: string | null;
  generationProgress: number | null;
  totalLessons: number;
  publishedLessons: number;
  approvedLessons: number;
  readyToPublish: boolean;
}

export interface CourseSession {
  course: StudioCourse;
  modules: StudioModule[];
  lessons: StudioLesson[];
  quizzes: StudioQuiz[];
  videos: StudioVideo[];
  automationRules: StudioAutomationRule[];
  workflows: StudioWorkflow[];
  publishState: StudioPublishState;
  /** Warnings from optional query failures — shown in studio header */
  warnings: string[];
  loadedAt: string;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loadCourseSession(courseId: string): Promise<CourseSession> {
  const warnings: string[] = [];

  // Auth — admin, admin, or staff only
  await requireRole(['admin', 'staff']);

  const db = await createClient();
  const adminDb = await requireAdminClient();
  const queryDb = adminDb ?? db;

  // ── Required: course ──────────────────────────────────────────────────────
  const { data: course, error: courseErr } = await queryDb
    .from('courses')
    .select(`
      id, title, slug, description, short_description, status, is_active,
      published_at, thumbnail_url, duration_hours, total_lessons,
      generation_status, generation_progress, review_status,
      program_id, org_id, version, compliance_profile_key,
      governing_body, governing_standard_version, created_at, updated_at
    `)
    .eq('id', courseId)
    .maybeSingle();

  if (courseErr || !course) {
    throw Object.assign(
      new Error(`Course ${courseId} not found or inaccessible`),
      { digest: 'ERR_STUDIO_COURSE_NOT_FOUND' }
    );
  }

  // ── All optional queries in parallel ─────────────────────────────────────
  const [
    modulesRes,
    lessonsRes,
    videosRes,
    automationRes,
    workflowsRes,
    quizzesRes,
  ] = await Promise.all([
    queryDb
      .from('course_modules')
      .select(`
        id, course_id, title, description, order_index, slug,
        is_published, is_required, duration_minutes, target_hours,
        domain_key, created_at, updated_at
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),

    queryDb
      .from('course_lessons')
      .select(`
        id, course_id, module_id, title, slug, lesson_type, order_index,
        status, is_published, is_required, passing_score, duration_minutes,
        video_url, video_config, activities, quiz_questions, ai_generated,
        approved, generation_status, requires_instructor_signoff,
        learning_objectives, competency_checks, created_at, updated_at
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),

    // Videos — global pool, not course-scoped (linked via course_lessons.video_url)
    queryDb
      .from('videos')
      .select('id, title, description, url, video_url, thumbnail_url, duration_seconds, published, category, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(100),

    // Automation rules — course-scoped where possible, else recent global
    queryDb
      .from('automation_rules')
      .select('id, name, description, status, trigger_type, action_type, enabled, run_count, last_triggered_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50),

    queryDb
      .from('workflows')
      .select('id, name, workflow_key, category, status, last_run_at, last_run_status, run_count, created_at')
      .order('created_at', { ascending: false })
      .limit(50),

    // Quizzes scoped to this course
    queryDb
      .from('quizzes')
      .select('id, course_id, title, description, time_limit_minutes, passing_score, question_count, created_at, updated_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false }),
  ]);

  // ── Resolve optional results with graceful degradation ───────────────────
  if (modulesRes.error) {
    warnings.push('modules query failed');
    logger.warn('[studio] modules query failed', { message: modulesRes.error.message, courseId });
  }
  if (lessonsRes.error) {
    warnings.push('lessons query failed');
    logger.warn('[studio] lessons query failed', { message: lessonsRes.error.message, courseId });
  }
  if (videosRes.error) {
    warnings.push('videos query failed');
    logger.warn('[studio] videos query failed', { message: videosRes.error.message });
  }
  if (automationRes.error) {
    warnings.push('automation rules query failed');
    logger.warn('[studio] automation query failed', { message: automationRes.error.message });
  }
  if (workflowsRes.error) {
    warnings.push('workflows query failed');
    logger.warn('[studio] workflows query failed', { message: workflowsRes.error.message });
  }
  if (quizzesRes.error) {
    warnings.push('quizzes query failed');
    logger.warn('[studio] quizzes query failed', { message: quizzesRes.error.message, courseId });
  }

  const modules = (modulesRes.data ?? []) as StudioModule[];
  const lessons = (lessonsRes.data ?? []) as StudioLesson[];
  const videos = (videosRes.data ?? []) as StudioVideo[];
  const automationRules = (automationRes.data ?? []) as StudioAutomationRule[];
  const workflows = (workflowsRes.data ?? []) as StudioWorkflow[];
  const quizzes = (quizzesRes.data ?? []) as StudioQuiz[];

  // ── Derive publish state ──────────────────────────────────────────────────
  const publishedLessons = lessons.filter(l => l.is_published).length;
  const approvedLessons = lessons.filter(l => l.approved).length;
  const readyToPublish =
    lessons.length > 0 &&
    approvedLessons === lessons.length &&
    course.review_status !== 'rejected';

  const publishState: StudioPublishState = {
    isPublished: course.status === 'published',
    publishedAt: course.published_at,
    reviewStatus: course.review_status,
    generationStatus: course.generation_status,
    generationProgress: course.generation_progress,
    totalLessons: lessons.length,
    publishedLessons,
    approvedLessons,
    readyToPublish,
  };

  return {
    course: course as StudioCourse,
    modules,
    lessons,
    quizzes,
    videos,
    automationRules,
    workflows,
    publishState,
    warnings,
    loadedAt: new Date().toISOString(),
  };
}
