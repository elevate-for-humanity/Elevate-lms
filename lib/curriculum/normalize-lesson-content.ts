/**
 * Converts any lesson content value — legacy plain string, unversioned JSON,
 * or already-structured content — into a canonical LessonContent object.
 */

import {
  LessonContentSchema,
  emptyLessonContent,
  type LessonContent,
} from './lesson-content-schema';
import { logger } from '@/lib/logger';

export function normalizeLessonContent(raw: unknown): LessonContent {
  if (raw === null || raw === undefined) return emptyLessonContent();

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return emptyLessonContent();
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeLessonContent(parsed);
    } catch {
      return LessonContentSchema.parse({ version: 1, instructionalContent: trimmed });
    }
  }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    if (obj.version === 1) {
      const result = LessonContentSchema.safeParse(obj);
      if (result.success) return result.data;
      logger.warn('[normalize-lesson-content] Partial validation failure, applying defaults', {
        errors: result.error.issues.map((i) => i.message),
      });
      return LessonContentSchema.parse({ version: 1, ...obj });
    }

    const hydrated: Record<string, unknown> = { version: 1 };

    // Canonical Course Factory shape.
    if (typeof obj.html === 'string') hydrated.instructionalContent = obj.html;
    if (Array.isArray(obj.learning_points)) hydrated.objectives = obj.learning_points;
    if (typeof obj.scenario === 'string') hydrated.activityInstructions = obj.scenario;
    if (obj.experience && typeof obj.experience === 'object' && !Array.isArray(obj.experience)) {
      hydrated.experience = obj.experience;
      const exp = obj.experience as Record<string, unknown>;
      if (typeof exp.narrationScript === 'string') hydrated.transcript = exp.narrationScript;
    }

    // Legacy curriculum lesson shapes.
    if (typeof obj.script_text === 'string') hydrated.instructionalContent = obj.script_text;
    if (typeof obj.content === 'string') hydrated.instructionalContent = obj.content;
    if (typeof obj.summary_text === 'string') hydrated.summary = obj.summary_text;
    if (typeof obj.reflection_prompt === 'string') hydrated.activityInstructions = obj.reflection_prompt;
    if (Array.isArray(obj.objectives)) hydrated.objectives = obj.objectives;
    if (Array.isArray(obj.materials)) hydrated.materials = obj.materials;
    if (typeof obj.transcript === 'string') hydrated.transcript = obj.transcript;

    if (typeof obj.video_file === 'string' || typeof obj.videoFile === 'string') {
      hydrated.video = {
        videoFile: obj.video_file ?? obj.videoFile,
        transcript: obj.transcript ?? '',
        runtimeSeconds: obj.video_runtime_seconds ?? obj.runtimeSeconds ?? 0,
        completionThresholdPercent: 90,
      };
    }

    return LessonContentSchema.parse(hydrated);
  }

  return emptyLessonContent();
}

export function mergeLessonContent(
  existing: LessonContent,
  patch: Partial<LessonContent>,
): LessonContent {
  return LessonContentSchema.parse({ ...existing, ...patch, version: 1 });
}

export function extractInstructionalText(raw: unknown): string {
  const content = normalizeLessonContent(raw);
  return [
    content.instructionalContent,
    content.summary,
    content.activityInstructions,
    content.transcript,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
