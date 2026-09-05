import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export const COURSE_BUILDER_PAUSE_KEY = 'course_builder_generation_paused';

export function isPausedSettingValue(value: unknown): boolean {
  if (value === true) return true;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return (value as { paused?: unknown }).paused === true;
  }
  return false;
}

export async function isCourseBuilderGenerationPaused(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db
    .from('system_settings')
    .select('value')
    .eq('key', COURSE_BUILDER_PAUSE_KEY)
    .maybeSingle();
  if (error) throw new Error(`Unable to read Course Builder generation control: ${error.message}`);
  return isPausedSettingValue(data?.value);
}

export async function assertCourseBuilderGenerationEnabled(
  db: SupabaseClient,
  courseId?: string | null,
): Promise<void> {
  if (await isCourseBuilderGenerationPaused(db)) {
    throw new Error('COURSE_BUILDER_GENERATION_PAUSED');
  }
  if (!courseId) return;
  const { data, error } = await db
    .from('courses')
    .select('generation_paused')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw new Error(`Unable to read course generation control: ${error.message}`);
  if (!data || data.generation_paused === true) {
    throw new Error('COURSE_GENERATION_PAUSED');
  }
}
