/**
 * getProgramStructure
 *
 * Returns the ordered module/lesson tree for a course.
 * Reads course_lessons + course_modules (canonical tables only).
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { EngineLesson, EngineModule, ProgramStructure, StepType } from './types';

export async function getProgramStructure(
  courseId: string,
  options: { includeUnpublished?: boolean } = {}
): Promise<ProgramStructure> {
  const db = await getAdminClient();

  // Resolve course title — canonical table
  const { data: course } = await db
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .maybeSingle();

  const courseName = course?.title ?? courseId;

  // Fetch lessons with module join — canonical tables
  const query = db
    .from('course_lessons')
    .select(
      'id, slug, title, lesson_type, passing_score, order_index, ' +
      'module_id, course_modules(id, title, order_index)'
    )
    .eq('course_id', courseId)
    .order('order_index');

  const { data: rows, error } = await query;
  if (error) throw new Error(`getProgramStructure: ${error.message}`);

  // Group into modules by module_id
  const moduleMap = new Map<string, EngineModule & { _order: number }>();

  for (const row of rows ?? []) {
    const mod = (row as any).course_modules;
    const moduleId    = row.module_id ?? '__none__';
    const moduleOrder = mod?.order_index ?? 0;
    const moduleTitle = mod?.title ?? `Module ${moduleOrder + 1}`;

    const lesson: EngineLesson = {
      id:              row.id,
      lessonSlug:      row.slug,
      lessonTitle:     row.title,
      stepType:        (row.lesson_type ?? 'lesson') as StepType,
      passingScore:    row.passing_score ?? 70,
      moduleOrder,
      lessonOrder:     row.order_index,
      durationMinutes: null,
      status:          'published',
      moduleTitle,
      videoFile:       null,
      scriptText:      null,
    };

    const existing = moduleMap.get(moduleId);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      moduleMap.set(moduleId, {
        moduleOrder,
        moduleTitle,
        lessons: [lesson],
        _order:  moduleOrder,
      });
    }
  }

  const modules = Array.from(moduleMap.values())
    .sort((a, b) => a._order - b._order)
    .map(({ _order: _, ...m }) => m);

  const allLessons = modules.flatMap(m => m.lessons);

  return {
    courseId,
    courseName,
    modules,
    totalLessons:     allLessons.length,
    publishedLessons: allLessons.length,
  };
}
