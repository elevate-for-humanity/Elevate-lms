/**
 * GET /api/learner/progress
 * 
 * Returns full learner dashboard data, built from:
 * 1. Blueprint definitions (modules, lessons, competencies)
 * 2. Learner progress data (completion, scores, time)
 * 3. Enrollment type (standard, apprentice, enterprise)
 * 
 * Blueprint → Learner Experience
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getClient } from '@/lib/supabase/client';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import { 
  blueprintToDashboard,
  type LearnerContext,
  type LearnerDashboard,
  type CourseProgress,
  type ModuleProgress,
  type LessonProgress,
  type CompetencyProgress,
  type CertificationReadiness,
  type PracticeExam,
  type ApprenticeshipProgress
} from '@/lib/course-factory/integration/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ courseId?: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Auth
    const { user, error: authError } = await requireAuth(request);
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { courseId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const programSlug = searchParams.get('programSlug');
    
    const supabase = getClient();
    
    // Get enrollment
    let enrollmentQuery = supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user!.id);
    
    if (courseId) {
      enrollmentQuery = enrollmentQuery.eq('course_id', courseId);
    } else if (programSlug) {
      enrollmentQuery = enrollmentQuery
        .eq('courses.program_slug', programSlug)
        .eq('status', 'active');
    }
    
    const { data: enrollment, error: enrollmentError } = await enrollmentQuery.single();
    
    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });
    }
    
    // Get course/program info
    const course = enrollment.courses;
    const programId = course.program_id;
    
    // Load blueprint
    const blueprint = await loadBlueprintWithProgram(supabase, { programId });
    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }
    
    // Build learner context
    const learnerContext: LearnerContext = {
      learnerId: user!.id,
      enrollmentId: enrollment.id,
      programSlug: course.program_slug,
      courseId: enrollment.course_id,
      enrollmentType: enrollment.enrollment_type || 'standard',
      startedAt: new Date(enrollment.created_at),
      lastActiveAt: new Date(),
    };
    
    // Fetch progress data in parallel
    const [
      moduleProgressData,
      lessonProgressData,
      competencyData,
      certificationData,
      practiceExamData,
      apprenticeshipData
    ] = await Promise.all([
      // Module progress
      supabase
        .from('module_progress')
        .select('*')
        .eq('learner_id', user!.id)
        .eq('course_id', enrollment.course_id),
      
      // Lesson progress
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('learner_id', user!.id)
        .eq('course_id', enrollment.course_id),
      
      // Competency progress
      supabase
        .from('competency_progress')
        .select('*')
        .eq('learner_id', user!.id)
        .eq('course_id', enrollment.course_id),
      
      // Certification readiness (if applicable)
      blueprint.certificationPathway
        ? supabase
            .from('certification_readiness')
            .select('*')
            .eq('learner_id', user!.id)
            .eq('certification_id', blueprint.certificationPathway.certificationBodyId)
            .single()
        : Promise.resolve({ data: null }),
      
      // Practice exams
      supabase
        .from('practice_exams')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true),
      
      // Apprenticeship progress (if enrolled)
      enrollment.enrollment_type === 'apprentice'
        ? supabase
            .from('apprenticeship_progress')
            .select('*')
            .eq('learner_id', user!.id)
            .eq('enrollment_id', enrollment.id)
            .single()
        : Promise.resolve({ data: null })
    ]);
    
    // Transform to typed progress
    const courseProgress = buildCourseProgress(enrollment, blueprint, lessonProgressData.data || []);
    const moduleProgress = buildModuleProgress(blueprint, moduleProgressData.data || []);
    const lessonProgress = buildLessonProgress(blueprint, lessonProgressData.data || []);
    const competencyProgress = buildCompetencyProgress(blueprint, competencyData.data || []);
    const certification = certificationData.data as CertificationReadiness | null;
    const practiceExams = (practiceExamData.data || []) as PracticeExam[];
    const apprenticeship = apprenticeshipData.data as ApprenticeshipProgress | null;
    
    // Generate dashboard from blueprint + progress
    const dashboard = blueprintToDashboard(
      blueprint,
      learnerContext,
      courseProgress,
      moduleProgress,
      lessonProgress,
      competencyProgress,
      certification,
      practiceExams,
      apprenticeship
    );
    
    // Enhance with real progress data
    dashboard.notifications = await getNotificationSummary(supabase, user!.id);
    dashboard.gamification = calculateGamification(dashboard.gamification, courseProgress);
    
    return NextResponse.json({ 
      success: true, 
      dashboard,
      meta: {
        blueprintId: blueprint.id,
        enrollmentType: learnerContext.enrollmentType,
        features: blueprint.features,
        lastSynced: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Learner Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────────

function buildCourseProgress(
  enrollment: Record<string, unknown>,
  blueprint: { modules: Array<{ lessons?: unknown[] }> },
  lessonProgress: Array<{ completed: boolean }>
): CourseProgress {
  const totalLessons = blueprint.modules.reduce(
    (sum, m) => sum + (m.lessons?.length || 0), 
    0
  );
  const completedLessons = lessonProgress.filter(l => l.completed).length;
  
  return {
    courseId: enrollment.course_id as string,
    learnerId: enrollment.user_id as string,
    percentComplete: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    currentModuleSlug: '', // Will be filled from actual progress
    currentLessonSlug: '',
    totalTimeSpent: 0,
    completedLessons,
    totalLessons,
    completedModules: 0,
    totalModules: blueprint.modules.length,
    status: completedLessons === 0 ? 'not-started' : 'in-progress',
    lastActiveAt: new Date()
  };
}

function buildModuleProgress(
  blueprint: { modules: Array<{ slug: string; title: string; orderIndex: number; lessons?: unknown[] }> },
  data: Array<Record<string, unknown>>
): ModuleProgress[] {
  const dataMap = new Map(data.map(d => [d.module_slug, d]));
  
  return blueprint.modules.map(module => {
    const stored = dataMap.get(module.slug);
    const totalLessons = module.lessons?.length || 0;
    const completedLessons = stored ? (stored.lessons_completed as number) || 0 : 0;
    
    return {
      moduleSlug: module.slug,
      moduleTitle: module.title,
      orderIndex: module.orderIndex,
      percentComplete: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      lessonsCompleted: completedLessons,
      totalLessons,
      quizScores: [],
      competencyProgress: {},
      startedAt: stored ? new Date(stored.started_at as string) : new Date(),
      completedAt: stored && stored.completed_at ? new Date(stored.completed_at as string) : undefined
    };
  });
}

function buildLessonProgress(
  blueprint: { modules: Array<{ lessons?: Array<{ slug: string; title: string; order: number }> }> },
  data: Array<Record<string, unknown>>
): LessonProgress[] {
  const dataMap = new Map(data.map(d => [d.lesson_slug, d]));
  const progress: LessonProgress[] = [];
  
  for (const module of blueprint.modules) {
    for (const lesson of module.lessons || []) {
      const stored = dataMap.get(lesson.slug);
      progress.push({
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        order: lesson.order,
        percentComplete: stored ? (stored.percent_complete as number) || 0 : 0,
        timeSpent: stored ? (stored.time_spent as number) || 0 : 0,
        completed: stored ? (stored.completed as boolean) || false : false,
        completedAt: stored && stored.completed_at ? new Date(stored.completed_at as string) : undefined,
        interactionsCompleted: stored?.interactions_completed as string[] || [],
        interactionsTotal: 0, // Will be calculated from blueprint
        knowledgeCheckScore: stored?.quiz_score as number | undefined,
        flashcardMastery: stored?.flashcard_mastery as number | undefined
      });
    }
  }
  
  return progress;
}

function buildCompetencyProgress(
  blueprint: { modules: Array<{ competencies?: Array<{ competencyKey: string; minimumTouchpoints: number }> }> },
  data: Array<Record<string, unknown>>
): CompetencyProgress[] {
  const competencyMap = new Map<string, CompetencyProgress>();
  
  // Initialize from blueprint
  for (const module of blueprint.modules) {
    for (const comp of module.competencies || []) {
      if (!competencyMap.has(comp.competencyKey)) {
        competencyMap.set(comp.competencyKey, {
          competencyKey: comp.competencyKey,
          competencyName: comp.competencyKey.replace(/_/g, ' '),
          currentLevel: 0,
          targetLevel: 100,
          touchpoints: [],
          verified: false,
          requiredSkills: comp.minimumTouchpoints,
          completedSkills: 0
        });
      }
    }
  }
  
  // Fill from data
  for (const record of data) {
    const key = record.competency_key as string;
    if (competencyMap.has(key)) {
      const existing = competencyMap.get(key)!;
      existing.currentLevel = (record.current_level as number) || 0;
      existing.verified = (record.verified as boolean) || false;
      existing.verifiedBy = record.verified_by as string | undefined;
      existing.verifiedAt = record.verified_at ? new Date(record.verified_at as string) : undefined;
    }
  }
  
  return Array.from(competencyMap.values());
}

function calculateGamification(
  base: { xp: number; level: number; skillLevel: string },
  progress: CourseProgress
): typeof base {
  const xpPerLesson = 50;
  const xpPerModule = 200;
  const xp = (progress.completedLessons * xpPerLesson) + (progress.completedModules * xpPerModule);
  const level = Math.floor(xp / 500) + 1;
  
  return { ...base, xp, level };
}

async function getNotificationSummary(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getClient>,
  userId: string
) {
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  return {
    unread: data?.filter(n => !n.read_at).length || 0,
    recent: (data || []).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: '',
      createdAt: n.created_at,
      read: !!n.read_at,
      priority: 'medium' as const
    }))
  };
}
