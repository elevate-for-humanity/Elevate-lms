/**
 * GET /api/learner/progress
 * Canonical learner dashboard API.
 */
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import {
  blueprintToDashboard,
  type LearnerContext,
  type CourseProgress,
  type ModuleProgress,
  type LessonProgress,
  type CompetencyProgress,
  type CertificationReadiness,
  type PracticeExam,
  type ApprenticeshipProgress,
} from '@/lib/course-factory/integration/types';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';

export const dynamic = 'force-dynamic';
interface RouteContext { params: Promise<{ courseId?: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = await context.params;
    const programSlug = request.nextUrl.searchParams.get('programSlug');
    const supabase = await createClient();

    let query = supabase.from('enrollments').select('*, courses(*)').eq('user_id', user!.id);
    if (courseId) query = query.eq('course_id', courseId);
    else if (programSlug) query = query.eq('courses.program_slug', programSlug).eq('status', 'active');

    const { data: enrollment, error } = await query.single();
    if (error || !enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });

    const course = enrollment.courses;
    const loaded = await loadBlueprintWithProgram(supabase, { programId: course.program_id });
    if (!loaded) return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    const blueprint = loaded.blueprint;

    const learnerContext: LearnerContext = {
      learnerId: user!.id,
      enrollmentId: enrollment.id,
      programSlug: course.program_slug,
      courseId: enrollment.course_id,
      enrollmentType: enrollment.enrollment_type || 'standard',
      startedAt: new Date(enrollment.created_at),
      lastActiveAt: new Date(),
    };

    const [moduleRows, lessonRows, competencyRows, certificationRow, exams, apprenticeshipRow] = await Promise.all([
      supabase.from('module_progress').select('*').eq('learner_id', user!.id).eq('course_id', enrollment.course_id),
      supabase.from('lesson_progress').select('*').eq('learner_id', user!.id).eq('course_id', enrollment.course_id),
      supabase.from('competency_progress').select('*').eq('learner_id', user!.id).eq('course_id', enrollment.course_id),
      blueprint.certificationPathway
        ? supabase.from('certification_readiness').select('*').eq('learner_id', user!.id).eq('certification_id', blueprint.certificationPathway.certificationBodyId).single()
        : Promise.resolve({ data: null }),
      supabase.from('practice_exams').select('*').eq('program_id', course.program_id).eq('is_active', true),
      enrollment.enrollment_type === 'apprentice'
        ? supabase.from('apprenticeship_progress').select('*').eq('learner_id', user!.id).eq('enrollment_id', enrollment.id).single()
        : Promise.resolve({ data: null }),
    ]);

    const courseProgress = buildCourseProgress(enrollment, blueprint, lessonRows.data || []);
    const dashboard = blueprintToDashboard(
      blueprint,
      learnerContext,
      courseProgress,
      buildModuleProgress(blueprint, moduleRows.data || []),
      buildLessonProgress(blueprint, lessonRows.data || []),
      buildCompetencyProgress(blueprint, competencyRows.data || []),
      certificationRow.data as CertificationReadiness | undefined,
      (exams.data || []) as PracticeExam[],
      apprenticeshipRow.data as ApprenticeshipProgress | undefined,
    );

    dashboard.notifications = await getNotificationSummary(supabase, user!.id);
    return NextResponse.json({ success: true, dashboard });
  } catch (error) {
    console.error('[Learner Dashboard] Error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

function buildCourseProgress(
  enrollment: Record<string, unknown>,
  blueprint: CredentialBlueprint,
  rows: Array<{ completed: boolean }>,
): CourseProgress {
  const total = blueprint.modules.reduce((sum, blueprintModule) => sum + (blueprintModule.lessons?.length || 0), 0);
  const done = rows.filter((row) => row.completed).length;
  return {
    courseId: enrollment.course_id as string,
    learnerId: enrollment.user_id as string,
    percentComplete: total ? Math.round((done / total) * 100) : 0,
    currentModuleSlug: '',
    currentLessonSlug: '',
    totalTimeSpent: 0,
    completedLessons: done,
    totalLessons: total,
    completedModules: 0,
    totalModules: blueprint.modules.length,
    status: done ? 'in-progress' : 'not-started',
    lastActiveAt: new Date(),
  };
}

function buildModuleProgress(blueprint: CredentialBlueprint, data: Record<string, unknown>[]): ModuleProgress[] {
  const stored = new Map(data.map((row) => [row.module_slug, row]));
  return blueprint.modules.map((blueprintModule) => {
    const row = stored.get(blueprintModule.slug);
    const total = blueprintModule.lessons?.length || 0;
    const completed = (row?.lessons_completed as number) || 0;
    return {
      moduleSlug: blueprintModule.slug,
      moduleTitle: blueprintModule.title,
      orderIndex: blueprintModule.orderIndex,
      percentComplete: total ? Math.round((completed / total) * 100) : 0,
      lessonsCompleted: completed,
      totalLessons: total,
      quizScores: [],
      competencyProgress: {},
      startedAt: new Date((row?.started_at as string) || Date.now()),
      completedAt: row?.completed_at ? new Date(row.completed_at as string) : undefined,
    };
  });
}

function buildLessonProgress(blueprint: CredentialBlueprint, data: Record<string, unknown>[]): LessonProgress[] {
  const stored = new Map(data.map((row) => [row.lesson_slug, row]));
  const result: LessonProgress[] = [];
  for (const blueprintModule of blueprint.modules) {
    for (const lesson of blueprintModule.lessons || []) {
      const row = stored.get(lesson.slug);
      result.push({
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        order: lesson.order,
        percentComplete: (row?.percent_complete as number) || 0,
        timeSpent: (row?.time_spent as number) || 0,
        completed: Boolean(row?.completed),
        completedAt: row?.completed_at ? new Date(row.completed_at as string) : undefined,
        interactionsCompleted: (row?.interactions_completed as string[]) || [],
        interactionsTotal: 0,
        knowledgeCheckScore: row?.quiz_score as number | undefined,
        flashcardMastery: row?.flashcard_mastery as number | undefined,
      });
    }
  }
  return result;
}

function buildCompetencyProgress(blueprint: CredentialBlueprint, data: Record<string, unknown>[]): CompetencyProgress[] {
  const result = new Map<string, CompetencyProgress>();
  for (const blueprintModule of blueprint.modules) {
    for (const competency of blueprintModule.competencies || []) {
      if (!result.has(competency.competencyKey)) {
        result.set(competency.competencyKey, {
          competencyKey: competency.competencyKey,
          competencyName: competency.competencyKey.replace(/_/g, ' '),
          currentLevel: 0,
          targetLevel: 100,
          touchpoints: [],
          verified: false,
          requiredSkills: competency.minimumTouchpoints,
          completedSkills: 0,
        });
      }
    }
  }
  for (const row of data) {
    const competency = result.get(row.competency_key as string);
    if (competency) {
      competency.currentLevel = (row.current_level as number) || 0;
      competency.verified = Boolean(row.verified);
    }
  }
  return [...result.values()];
}

async function getNotificationSummary(supabase: SupabaseClient<any>, userId: string) {
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  return {
    unread: data?.filter((notification) => !notification.read_at).length || 0,
    recent: (data || []).map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: '',
      createdAt: notification.created_at,
      read: Boolean(notification.read_at),
      priority: 'medium' as const,
    })),
  };
}
