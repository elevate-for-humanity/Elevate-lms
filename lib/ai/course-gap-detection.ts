/**
 * Course Gap Detection System
 * 
 * Scans LMS courses, programs, and apprenticeship standards to identify
 * missing content that should be generated.
 */

import { createClient } from '@supabase/supabase-js';
import { requireAdminClient } from '@/lib/supabase/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CourseGap {
  gap_type: 'no_course' | 'no_modules' | 'no_lessons' | 'no_quiz' | 'no_assessment' | 
            'no_credential_alignment' | 'no_onet_data' | 'no_apprenticeship_content' |
            'inactive_draft' | 'incomplete_module';
  severity: 'critical' | 'high' | 'medium' | 'low';
  program_id?: string;
  program_name?: string;
  course_id?: string;
  course_title?: string;
  module_id?: string;
  module_title?: string;
  occupation?: string;
  soc_code?: string;
  credential_type?: string;
  description: string;
  recommendation: string;
  suggested_action: 'generate_course' | 'generate_module' | 'generate_lesson' | 
                   'generate_quiz' | 'add_assessment' | 'link_credential' |
                   'fetch_onet_data' | 'publish_draft';
}

export interface GapScanResult {
  total_gaps: number;
  critical_gaps: number;
  high_gaps: number;
  medium_gaps: number;
  low_gaps: number;
  gaps: CourseGap[];
  scanned_at: string;
}

/**
 * Scan for programs without courses
 */
async function scanProgramsWithoutCourses(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  // Get all programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug, occupation, soc_code, credential_type, category')
    .eq('is_active', true);

  // Get all courses
  const { data: courses } = await supabase
    .from('career_courses')
    .select('id, title, program_id, status')
    .eq('status', 'published');

  const courseProgramIds = new Set(courses?.map(c => c.program_id) || []);
  const programCourseMap = new Map(courses?.map(c => [c.program_id, c]) || []);

  for (const program of programs || []) {
    if (!courseProgramIds.has(program.id)) {
      gaps.push({
        gap_type: 'no_course',
        severity: 'critical',
        program_id: program.id,
        program_name: program.title,
        occupation: program.occupation,
        soc_code: program.soc_code,
        credential_type: program.credential_type,
        description: `Program "${program.title}" has no published course attached`,
        recommendation: 'Generate a new course based on program requirements',
        suggested_action: 'generate_course',
      });
    } else {
      // Check if course is complete
      const course = programCourseMap.get(program.id);
      if (course && course.status !== 'published') {
        gaps.push({
          gap_type: 'inactive_draft',
          severity: 'medium',
          program_id: program.id,
          program_name: program.title,
          course_id: course.id,
          course_title: course.title,
          description: `Course "${course.title}" is in draft status and not published`,
          recommendation: 'Review and publish the course, or complete missing content',
          suggested_action: 'publish_draft',
        });
      }
    }
  }

  return gaps;
}

/**
 * Scan for courses missing modules
 */
async function scanCoursesWithoutModules(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  const { data: courses } = await supabase
    .from('career_courses')
    .select('id, title, program_id, status')
    .eq('status', 'published');

  for (const course of courses || []) {
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id, title')
      .eq('course_id', course.id)
      .eq('is_draft', false);

    if (!modules || modules.length === 0) {
      gaps.push({
        gap_type: 'no_modules',
        severity: 'critical',
        course_id: course.id,
        course_title: course.title,
        description: `Course "${course.title}" has no modules`,
        recommendation: 'Generate course modules based on program curriculum',
        suggested_action: 'generate_module',
      });
    }
  }

  return gaps;
}

/**
 * Scan for modules missing lessons
 */
async function scanModulesWithoutLessons(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, course_id')
    .eq('is_draft', false);

  for (const module of modules || []) {
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('module_id', module.id);

    if (!lessons || lessons.length === 0) {
      gaps.push({
        gap_type: 'no_lessons',
        severity: 'high',
        module_id: module.id,
        module_title: module.title,
        course_id: module.course_id,
        description: `Module "${module.title}" has no lessons`,
        recommendation: 'Add lessons to this module',
        suggested_action: 'generate_lesson',
      });
    }
  }

  return gaps;
}

/**
 * Scan for lessons missing quizzes
 */
async function scanLessonsWithoutQuizzes(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('id, title, module_id')
    .eq('has_quiz', false);

  for (const lesson of lessons || []) {
    const { data: quizzes } = await supabase
      .from('course_quizzes')
      .select('id')
      .eq('lesson_id', lesson.id);

    if (!quizzes || quizzes.length === 0) {
      gaps.push({
        gap_type: 'no_quiz',
        severity: 'medium',
        lesson_id: lesson.id,
        module_title: lesson.title,
        description: `Lesson "${lesson.title}" has no quiz`,
        recommendation: 'Add a quiz to assess learner understanding',
        suggested_action: 'generate_quiz',
      });
    }
  }

  return gaps;
}

/**
 * Scan for courses missing assessments
 */
async function scanCoursesWithoutAssessments(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  const { data: courses } = await supabase
    .from('career_courses')
    .select('id, title, has_final_exam, has_practical_assessment')
    .eq('status', 'published');

  for (const course of courses || []) {
    if (!course.has_final_exam || !course.has_practical_assessment) {
      gaps.push({
        gap_type: 'no_assessment',
        severity: 'high',
        course_id: course.id,
        course_title: course.title,
        description: `Course "${course.title}" is missing assessments (final exam or practical)`,
        recommendation: 'Add final exam and/or practical assessment',
        suggested_action: 'add_assessment',
      });
    }
  }

  return gaps;
}

/**
 * Scan for apprenticeship programs missing related instruction content
 */
async function scanApprenticeshipContentGaps(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  // Get apprenticeship programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, category, apprenticeship_hours_required')
    .eq('is_active', true)
    .eq('program_type', 'apprenticeship');

  for (const program of programs || []) {
    // Check if related instruction content exists
    const { data: content } = await supabase
      .from('course_content')
      .select('id')
      .eq('program_id', program.id)
      .limit(1);

    if (!content || content.length === 0) {
      gaps.push({
        gap_type: 'no_apprenticeship_content',
        severity: 'high',
        program_id: program.id,
        program_name: program.title,
        description: `Apprenticeship program "${program.title}" has no related instruction content`,
        recommendation: 'Generate related instruction curriculum for apprenticeship',
        suggested_action: 'generate_course',
      });
    }
  }

  return gaps;
}

/**
 * Scan for programs missing O*NET/SOC/BLS data
 */
async function scanMissingExternalData(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, occupation, soc_code')
    .eq('is_active', true);

  for (const program of programs || []) {
    if (!program.soc_code || !program.occupation) {
      gaps.push({
        gap_type: 'no_onet_data',
        severity: 'medium',
        program_id: program.id,
        program_name: program.title,
        description: `Program "${program.title}" is missing SOC code or occupation data`,
        recommendation: 'Link program to O*NET data for career pathway information',
        suggested_action: 'fetch_onet_data',
      });
    }
  }

  return gaps;
}

/**
 * Scan for inactive draft courses
 */
async function scanInactiveDrafts(): Promise<CourseGap[]> {
  const gaps: CourseGap[] = [];

  // Find drafts older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: drafts } = await supabase
    .from('career_courses')
    .select('id, title, updated_at')
    .eq('status', 'draft')
    .lt('updated_at', thirtyDaysAgo.toISOString());

  for (const draft of drafts || []) {
    gaps.push({
      gap_type: 'inactive_draft',
      severity: 'low',
      course_id: draft.id,
      course_title: draft.title,
      description: `Course "${draft.title}" has been in draft for over 30 days`,
      recommendation: 'Complete and publish, or archive this draft',
      suggested_action: 'publish_draft',
    });
  }

  return gaps;
}

/**
 * Main scan function - runs all gap detection checks
 */
export async function scanAllGaps(): Promise<GapScanResult> {
  console.info('Starting course gap detection scan...');

  const [
    programGaps,
    moduleGaps,
    lessonGaps,
    quizGaps,
    assessmentGaps,
    apprenticeshipGaps,
    externalDataGaps,
    draftGaps,
  ] = await Promise.all([
    scanProgramsWithoutCourses(),
    scanCoursesWithoutModules(),
    scanModulesWithoutLessons(),
    scanLessonsWithoutQuizzes(),
    scanCoursesWithoutAssessments(),
    scanApprenticeshipContentGaps(),
    scanMissingExternalData(),
    scanInactiveDrafts(),
  ]);

  const allGaps = [
    ...programGaps,
    ...moduleGaps,
    ...lessonGaps,
    ...quizGaps,
    ...assessmentGaps,
    ...apprenticeshipGaps,
    ...externalDataGaps,
    ...draftGaps,
  ];

  const result: GapScanResult = {
    total_gaps: allGaps.length,
    critical_gaps: allGaps.filter(g => g.severity === 'critical').length,
    high_gaps: allGaps.filter(g => g.severity === 'high').length,
    medium_gaps: allGaps.filter(g => g.severity === 'medium').length,
    low_gaps: allGaps.filter(g => g.severity === 'low').length,
    gaps: allGaps,
    scanned_at: new Date().toISOString(),
  };

  console.info(`Gap scan complete: ${result.total_gaps} gaps found`, {
    critical: result.critical_gaps,
    high: result.high_gaps,
    medium: result.medium_gaps,
    low: result.low_gaps,
  });

  return result;
}

/**
 * Create draft course generation jobs from gaps
 */
export async function createDraftJobsFromGaps(gaps: CourseGap[]): Promise<string[]> {
  const jobIds: string[] = [];

  for (const gap of gaps) {
    if (gap.gap_type === 'no_course' && gap.program_id) {
      // Create a course generation job
      const { data: job, error } = await supabase
        .from('course_generation_jobs')
        .insert({
          title: `Generate course for: ${gap.program_name}`,
          occupation: gap.occupation,
          soc_code: gap.soc_code,
          credential_type: gap.credential_type,
          target_hours: 40, // Default
          status: 'queued',
          metadata: {
            source_gap: gap.gap_type,
            program_id: gap.program_id,
            auto_generated: true,
          },
        })
        .select('id')
        .single();

      if (!error && job) {
        jobIds.push(job.id);
      }
    }
  }

  return jobIds;
}

/**
 * Get gap summary by category
 */
export function getGapSummary(gaps: CourseGap[]): Record<string, number> {
  return gaps.reduce((acc, gap) => {
    acc[gap.gap_type] = (acc[gap.gap_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}