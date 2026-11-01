import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export const COURSE_BUILDER_PAUSE_KEY = 'course_builder_generation_paused';

export type CourseBuilderGenerationControl = {
  paused: boolean;
  allowedCourseIds: string[];
};

function normalizeCourseIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function parseCourseBuilderGenerationControl(
  value: unknown,
): CourseBuilderGenerationControl {
  if (value === true) return { paused: true, allowedCourseIds: [] };
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { paused: false, allowedCourseIds: [] };
  }
  const control = value as {
    paused?: unknown;
    allowedCourseIds?: unknown;
    allowed_course_ids?: unknown;
  };
  return {
    paused: control.paused === true,
    allowedCourseIds: normalizeCourseIds(
      control.allowedCourseIds ?? control.allowed_course_ids,
    ),
  };
}

export function isPausedSettingValue(value: unknown): boolean {
  return parseCourseBuilderGenerationControl(value).paused;
}

export async function getCourseBuilderGenerationControl(
  db: SupabaseClient,
): Promise<CourseBuilderGenerationControl> {
  const { data, error } = await db
    .from('system_settings')
    .select('value')
    .eq('key', COURSE_BUILDER_PAUSE_KEY)
    .maybeSingle();
  if (error) throw new Error(`Unable to read Course Builder generation control: ${error.message}`);
  return parseCourseBuilderGenerationControl(data?.value);
}

export async function isCourseBuilderGenerationPaused(db: SupabaseClient): Promise<boolean> {
  return (await getCourseBuilderGenerationControl(db)).paused;
}

export async function assertCourseBuilderGenerationEnabled(
  db: SupabaseClient,
  courseId?: string | null,
): Promise<void> {
  const control = await getCourseBuilderGenerationControl(db);
  const normalizedCourseId = typeof courseId === 'string' ? courseId.trim() : '';

  if (
    control.paused &&
    (!normalizedCourseId || !control.allowedCourseIds.includes(normalizedCourseId))
  ) {
    throw new Error('COURSE_BUILDER_GENERATION_PAUSED');
  }
  if (!normalizedCourseId) return;

  const { data, error } = await db
    .from('courses')
    .select('generation_paused')
    .eq('id', normalizedCourseId)
    .maybeSingle();
  if (error) throw new Error(`Unable to read course generation control: ${error.message}`);
  if (!data || data.generation_paused === true) {
    throw new Error('COURSE_GENERATION_PAUSED');
  }
}
