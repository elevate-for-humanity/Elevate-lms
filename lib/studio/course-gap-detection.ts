import type { SupabaseClient } from '@supabase/supabase-js';

export interface CourseGap {
  type: 'no_course' | 'missing_module' | 'missing_lesson' | 'missing_quiz' | 
        'missing_video' | 'missing_instructor_guide' | 'missing_student_workbook' |
        'missing_credential_alignment';
  program_id: string | null;
  program_name: string | null;
  program_slug: string | null;
  course_id: string | null;
  course_title: string | null;
  module_id: string | null;
  module_title: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  created_at: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface GapDetectionResult {
  gaps: CourseGap[];
  summary: {
    total_gaps: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    by_type: Record<string, number>;
    by_program: Record<string, number>;
  };
  programs_analyzed: number;
  courses_analyzed: number;
  generated_at: string;
}

export async function detectCourseGaps(
  supabase: SupabaseClient,
  options?: {
    programId?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    includeResolved?: boolean;
  }
): Promise<GapDetectionResult> {
  const gaps: CourseGap[] = [];
  const byType: Record<string, number> = {};
  const byProgram: Record<string, number> = {};

  // 1. Detect programs with no course assigned
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('id, name:title, slug, credential_name')
    .eq('is_active', true)
    .eq('published', true);
  if (programsError) throw programsError;

  if (programs) {
    for (const program of programs) {
      // Check if program has courses
      const { data: programCourses, error: programCoursesError } = await supabase
        .from('program_courses')
        .select('course_id')
        .eq('program_id', program.id)
        .limit(1);
      if (programCoursesError) throw programCoursesError;

      const { data: directCourse, error: directCourseError } = await supabase.from('lms_courses').select('id').eq('program_id', program.id).limit(1);
      if (directCourseError) throw directCourseError;
      if ((!programCourses || programCourses.length === 0) && !directCourse?.length) {
        const gap: CourseGap = {
          type: 'no_course',
          program_id: program.id,
          program_name: program.name,
          program_slug: program.slug,
          course_id: null,
          course_title: null,
          module_id: null,
          module_title: null,
          severity: 'critical',
          description: `Program "${program.name}" has no courses assigned`,
          recommendation: 'Create or assign courses to this program',
          created_at: new Date().toISOString(),
          status: 'open',
        };
        gaps.push(gap);
        byType.no_course = (byType.no_course || 0) + 1;
        byProgram[program.name] = (byProgram[program.name] || 0) + 1;
      }
    }
  }

  // 2. Detect courses with missing modules
  const { data: courses, error: coursesError } = await supabase
    .from('lms_courses')
    .select('id, title, description')
    .eq('is_active', true);
  if (coursesError) throw coursesError;

  if (courses) {
    for (const course of courses) {
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('id, title')
        .eq('course_id', course.id)
        .order('order_index');
      if (modulesError) throw modulesError;

      if (!modules || modules.length === 0) {
        const gap: CourseGap = {
          type: 'missing_module',
          program_id: null,
          program_name: null,
          program_slug: null,
          course_id: course.id,
          course_title: course.title,
          module_id: null,
          module_title: null,
          severity: 'high',
          description: `Course "${course.title}" has no modules`,
          recommendation: 'Create at least one module for this course',
          created_at: new Date().toISOString(),
          status: 'open',
        };
        gaps.push(gap);
        byType.missing_module = (byType.missing_module || 0) + 1;
      } else {
        // 3. Check each module for lessons
        for (const mod of modules) {
          const { data: lessons, error: lessonsError } = await supabase
            .from('course_lessons')
            .select('id, title, quiz_questions')
            .eq('module_id', mod.id);
          if (lessonsError) throw lessonsError;

          if (!lessons || lessons.length === 0) {
            const gap: CourseGap = {
              type: 'missing_lesson',
              program_id: null,
              program_name: null,
              program_slug: null,
              course_id: course.id,
              course_title: course.title,
              module_id: mod.id,
              module_title: mod.title,
              severity: 'high',
              description: `Module "${mod.title}" in "${course.title}" has no lessons`,
              recommendation: 'Add at least one lesson to this module',
              created_at: new Date().toISOString(),
              status: 'open',
            };
            gaps.push(gap);
            byType.missing_lesson = (byType.missing_lesson || 0) + 1;
          }

          // 4. Check for quizzes
          const lessonIds = (lessons ?? []).map(lesson => lesson.id);
          const { data: quizzes, error: quizError } = lessonIds.length
            ? await supabase.from('quizzes').select('id').in('lesson_id', lessonIds).eq('is_published', true).limit(1)
            : { data: [], error: null };
          if (quizError) throw quizError;
          const inlineQuiz = (lessons ?? []).some(lesson => Array.isArray(lesson.quiz_questions) && lesson.quiz_questions.length > 0);

          if (!inlineQuiz && (!quizzes || quizzes.length === 0)) {
            const gap: CourseGap = {
              type: 'missing_quiz',
              program_id: null,
              program_name: null,
              program_slug: null,
              course_id: course.id,
              course_title: course.title,
              module_id: mod.id,
              module_title: mod.title,
              severity: 'medium',
              description: `Module "${mod.title}" has no quiz`,
              recommendation: 'Consider adding a quiz to assess student understanding',
              created_at: new Date().toISOString(),
              status: 'open',
            };
            gaps.push(gap);
            byType.missing_quiz = (byType.missing_quiz || 0) + 1;
          }
        }
      }
    }
  }

  // 5. Check for credential alignment gaps
  const { data: credentials, error: credentialsError } = await supabase
    .from('credentials')
    .select('id, name, credential_type, exam_provider');
  if (credentialsError) throw credentialsError;

  if (credentials && programs) {
    for (const program of programs) {
      const { data: programCredentials, error: programCredentialsError } = await supabase
        .from('program_credentials')
        .select('credential_id')
        .eq('program_id', program.id);
      if (programCredentialsError) throw programCredentialsError;

      if (!programCredentials || programCredentials.length === 0) {
        const gap: CourseGap = {
          type: 'missing_credential_alignment',
          program_id: program.id,
          program_name: program.name,
          program_slug: program.slug,
          course_id: null,
          course_title: null,
          module_id: null,
          module_title: null,
          severity: 'medium',
          description: `Program "${program.name}" has no credential alignment`,
          recommendation: 'Link this program to relevant credentials for career pathways',
          created_at: new Date().toISOString(),
          status: 'open',
        };
        gaps.push(gap);
        byType.missing_credential_alignment = (byType.missing_credential_alignment || 0) + 1;
        byProgram[program.name] = (byProgram[program.name] || 0) + 1;
      }
    }
  }

  // Calculate summary
  const summary = {
    total_gaps: gaps.length,
    critical_count: gaps.filter(g => g.severity === 'critical').length,
    high_count: gaps.filter(g => g.severity === 'high').length,
    medium_count: gaps.filter(g => g.severity === 'medium').length,
    low_count: gaps.filter(g => g.severity === 'low').length,
    by_type: byType,
    by_program: byProgram,
  };

  // Filter by options
  let filteredGaps = gaps;
  if (options?.programId) {
    filteredGaps = filteredGaps.filter(g => g.program_id === options.programId);
  }
  if (options?.severity) {
    filteredGaps = filteredGaps.filter(g => g.severity === options.severity);
  }
  if (!options?.includeResolved) {
    filteredGaps = filteredGaps.filter(g => g.status === 'open');
  }

  return {
    gaps: filteredGaps,
    summary: {
      ...summary,
      total_gaps: filteredGaps.length,
      critical_count: filteredGaps.filter(g => g.severity === 'critical').length,
      high_count: filteredGaps.filter(g => g.severity === 'high').length,
      medium_count: filteredGaps.filter(g => g.severity === 'medium').length,
      low_count: filteredGaps.filter(g => g.severity === 'low').length,
    },
    programs_analyzed: programs?.length || 0,
    courses_analyzed: courses?.length || 0,
    generated_at: new Date().toISOString(),
  };
}

export async function createGapDraftJobs(
  supabase: SupabaseClient,
  gaps: CourseGap[]
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const gap of gaps) {
    if (gap.severity === 'low') {
      skipped++;
      continue;
    }

    // Check if job already exists
    const { data: existing, error: existingError } = await supabase
      .from('gap_draft_jobs')
      .select('id')
      .eq('gap_type', gap.type)
      .eq('target_id', gap.course_id || gap.program_id)
      .eq('status', 'pending')
      .limit(1);
    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    // Create draft generation job
    const { error } = await supabase.from('gap_draft_jobs').insert({
      gap_type: gap.type,
      target_id: gap.course_id || gap.program_id,
      target_title: gap.course_title || gap.program_name || 'Unknown',
      severity: gap.severity,
      description: gap.description,
      recommendation: gap.recommendation,
      status: 'pending',
      priority: gap.severity === 'critical' ? 1 : gap.severity === 'high' ? 2 : 3,
    });

    if (!error) {
      created++;
    } else {
      throw new Error('Gap draft job creation failed', { cause: error });
    }
  }

  return { created, skipped };
}