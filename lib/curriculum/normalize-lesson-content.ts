/**
 * lib/curriculum/normalize-lesson-content.ts
 *
 * Converts any lesson content value — legacy plain string, unversioned JSON,
 * or already-structured content — into a fully validated LessonContent object.
 *
 * Rules:
 *   - If content is already a valid LessonContent (version: 1), validate and return.
 *   - If content is a plain string, wrap it as instructionalContent.
 *   - If content is a JSON object without version, attempt partial hydration.
 *   - If content is null/undefined, return empty defaults.
 *   - Validation errors are logged but never thrown — returns best-effort result.
 *
 * This is the single entry point for reading lesson content anywhere in the app.
 * Never read course_lessons.content or content_structured raw — always normalize first.
 */

import { LessonContentSchema, emptyLessonContent, type LessonContent } from './lesson-content-schema';
import { logger } from '@/lib/logger';

/**
 * Normalizes any raw content value into a LessonContent object.
 * Safe to call with any value from the DB — never throws.
 */
export function normalizeLessonContent(raw: unknown): LessonContent {
  if (raw === null || raw === undefined) {
    return emptyLessonContent();
  }

  // Plain string — legacy script_text or content column
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return emptyLessonContent();

    // Try parsing as JSON first (some legacy rows stored JSON as text)
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeLessonContent(parsed);
    } catch {
      // Not JSON — treat as plain instructional content
      return LessonContentSchema.parse({
        version: 1,
        instructionalContent: trimmed,
      });
    }
  }

  // Object — validate against schema
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    // Already versioned — validate directly
    if (obj.version === 1) {
      const result = LessonContentSchema.safeParse(obj);
      if (result.success) return result.data;

      // Partial parse — fill defaults for invalid fields
      logger.warn('[normalize-lesson-content] Partial validation failure, applying defaults', {
        errors: result.error.issues.map(i => i.message),
      });
      return LessonContentSchema.parse({ version: 1, ...obj });
    }

    // Unversioned object — attempt hydration from known legacy shapes
    const hydrated: Record<string, unknown> = { version: 1 };

    // Legacy curriculum_lessons fields
    if (typeof obj.script_text === 'string')       hydrated.instructionalContent = obj.script_text;
    if (typeof obj.content === 'string')            hydrated.instructionalContent = obj.content;
    if (typeof obj.summary_text === 'string')       hydrated.summary = obj.summary_text;
    if (typeof obj.reflection_prompt === 'string')  hydrated.activityInstructions = obj.reflection_prompt;
    if (Array.isArray(obj.objectives))              hydrated.objectives = obj.objectives;
    if (Array.isArray(obj.materials))               hydrated.materials = obj.materials;
    if (typeof obj.transcript === 'string')         hydrated.transcript = obj.transcript;

    // Legacy video fields
    if (typeof obj.video_file === 'string' || typeof obj.videoFile === 'string') {
      hydrated.video = {
        videoFile:    obj.video_file ?? obj.videoFile,
        transcript:   obj.transcript ?? '',
        runtimeSeconds: obj.video_runtime_seconds ?? obj.runtimeSeconds ?? 0,
        completionThresholdPercent: 90,
      };
    }

    return LessonContentSchema.parse(hydrated);
  }

  // Fallback
  return emptyLessonContent();
}

/**
 * Merges a partial update into existing structured content.
 * Used by the builder UI when saving individual sections.
 */
export function mergeLessonContent(
  existing: LessonContent,
  patch: Partial<LessonContent>
): LessonContent {
  return LessonContentSchema.parse({ ...existing, ...patch, version: 1 });
}

/**
 * Extracts the plain instructional text from any content value.
 * Used by the publish auditor to check content length.
 */
export function extractInstructionalText(raw: unknown): string {
  const content = normalizeLessonContent(raw);
  return [
    content.instructionalContent,
    content.summary,
    content.activityInstructions,
    content.transcript,
  ].filter(Boolean).join('\n').trim();
}
