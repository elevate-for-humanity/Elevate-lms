/**
 * Compatibility pipeline for historical Course Builder/compiler callers.
 *
 * IMPORTANT: This file is no longer a persistence engine. The canonical
 * generation, validation and persistence authority is lib/course-factory.
 * Existing callers may keep using runCoursePublishPipeline while they migrate,
 * but every write crosses courseFactory().
 */

import type { SupabaseClient } from '@/lib/supabase';
import type { CourseTemplate } from './schema';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { validateCourseTemplate, type CourseValidationResult } from './validate';
import { adaptCourseTemplateToBlueprint } from './publish-adapter';
import { courseFactory } from '@/lib/course-factory';
import { logger } from '@/lib/logger';

export function generateCourseCode(slug: string): string {
  const parts = slug
    .replace(/[^a-z0-9]+/gi, '-')
    .split('-')
    .filter(Boolean);
  const prefix =
    parts
      .find((part) => /^[a-z]/i.test(part))
      ?.replace(/[^a-z]/gi, '')
      .toUpperCase()
      .slice(0, 4) ?? 'CRS';
  const numMatch = slug.match(/\d+/);
  const suffix = numMatch
    ? numMatch[0].slice(-3).padStart(3, '0')
    : String(
        (slug.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) & 0xffff, 0) % 900) +
          100,
      );
  return `${prefix}${suffix}`;
}

export type PipelineMode = 'missing-only' | 'replace' | 'refresh';

export type PipelineOptions = {
  template: CourseTemplate;
  /** Retained for API compatibility. Course Factory owns its DB client. */
  db: SupabaseClient;
  mode?: PipelineMode;
  dryRun?: boolean;
  blueprint?: CredentialBlueprint;
};

export type PipelineResult = {
  success: boolean;
  courseId: string | null;
  validation: CourseValidationResult;
  lessonsWritten: number;
  lessonsSkipped: number;
  errors: string[];
};

/**
 * Compatibility wrapper around the canonical Course Factory.
 * No direct courses/course_modules/course_lessons writes are allowed here.
 */
export async function runCoursePublishPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  const { template, mode = 'refresh', dryRun = false } = opts;
  const validation = validateCourseTemplate(template);

  if (!validation.valid) {
    return {
      success: false,
      courseId: null,
      validation,
      lessonsWritten: 0,
      lessonsSkipped: 0,
      errors: validation.errors.map(
        (error) => `${error.moduleSlug}/${error.lessonSlug} [${error.field}]: ${error.message}`,
      ),
    };
  }

  const blueprint = opts.blueprint ?? adaptCourseTemplateToBlueprint(template);
  const result = await courseFactory({
    programSlug: template.programSlug,
    blueprint,
    mode,
    contentSource: 'ai',
    videoMode: 'queue',
    dryRun,
  });

  if (!result.ok) {
    logger.error('[course-builder/pipeline] Canonical Course Factory failed', undefined, {
      courseSlug: template.courseSlug,
      errors: result.errors ?? [],
    });
  }

  return {
    success: result.ok,
    courseId: result.courseId ?? null,
    validation,
    lessonsWritten: result.lessonCount ?? 0,
    lessonsSkipped: result.skippedCount ?? 0,
    errors: result.errors ?? [],
  };
}
