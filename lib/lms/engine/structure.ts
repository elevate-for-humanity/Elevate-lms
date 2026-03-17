/**
 * getProgramStructure
 *
 * Returns the ordered module/lesson tree for a course from curriculum_lessons.
 * Only published lessons are returned by default; pass includeUnpublished=true
 * for admin views.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { EngineLesson, EngineModule, ProgramStructure, StepType } from './types';

export async function getProgramStructure(
  courseId: string,
  options: { includeUnpublished?: boolean } = {}
): Promise<ProgramStructure> {
  const db = createAdminClient();

  let query = db
    .from('curriculum_lessons')
    .select(
      'id, lesson_slug, lesson_title, step_type, passing_score, ' +
      'module_order, lesson_order, duration_minutes, status, ' +
      'module_title, video_file, script_text'
    )
    .eq('course_id', courseId)
    .order('module_order')
    .order('lesson_order');

  if (!options.includeUnpublished) {
    query = query.eq('status', 'published');
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(`getProgramStructure: ${error.message}`);

  // Resolve course name
  const { data: course } = await db
    .from('training_courses')
    .select('course_name')
    .eq('id', courseId)
    .maybeSingle();

  const courseName = course?.course_name ?? courseId;

  // Group into modules
  const moduleMap = new Map<number, EngineModule>();
  for (const row of rows ?? []) {
    const lesson: EngineLesson = {
      id:              row.id,
      lessonSlug:      row.lesson_slug,
      lessonTitle:     row.lesson_title,
      stepType:        row.step_type as StepType,
      passingScore:    row.passing_score ?? 70,
      moduleOrder:     row.module_order,
      lessonOrder:     row.lesson_order,
      durationMinutes: row.duration_minutes,
      status:          row.status,
      moduleTitle:     row.module_title ?? null,
      videoFile:       row.video_file ?? null,
      scriptText:      row.script_text ?? null,
    };

    const existing = moduleMap.get(row.module_order);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      moduleMap.set(row.module_order, {
        moduleOrder: row.module_order,
        moduleTitle: row.module_title ?? `Module ${row.module_order + 1}`,
        lessons: [lesson],
      });
    }
  }

  const modules = Array.from(moduleMap.values()).sort((a, b) => a.moduleOrder - b.moduleOrder);
  const allLessons = modules.flatMap(m => m.lessons);

  return {
    courseId,
    courseName,
    modules,
    totalLessons:     allLessons.length,
    publishedLessons: allLessons.filter(l => l.status === 'published').length,
  };
}
