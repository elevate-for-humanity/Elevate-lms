import { assignDuration } from '@/lib/course-builder/hours-engine';
import type { LessonType } from '@/lib/course-builder/schema';

function textArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((value) => value.trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return textArray(parsed);
    } catch {
      return [value.trim()];
    }
    return [value.trim()];
  }
  return [];
}

export function normalizeLearningObjectives(input: {
  learningObjectives?: unknown;
  objective?: unknown;
  content?: unknown;
  contentJson?: unknown;
}): string[] {
  const content = input.content && typeof input.content === 'object' && !Array.isArray(input.content)
    ? input.content as Record<string, unknown>
    : {};
  const contentJson = input.contentJson && typeof input.contentJson === 'object' && !Array.isArray(input.contentJson)
    ? input.contentJson as Record<string, unknown>
    : {};
  return Array.from(new Set([
    ...textArray(input.learningObjectives),
    ...textArray(input.objective),
    ...textArray(content.learning_points ?? content.learningPoints),
    ...textArray(contentJson.learning_points ?? contentJson.learningPoints),
  ])).slice(0, 5);
}

function wordCount(value: unknown): number {
  return typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

/**
 * Derive honest self-paced seat time without claiming apprenticeship/OJL hours.
 * Existing configured time wins. Otherwise use the lesson-type baseline and
 * ensure it can contain the narration at an accessible 130 words per minute.
 */
export function deriveLessonDurationMinutes(input: {
  durationMinutes?: unknown;
  lessonType?: unknown;
  script?: unknown;
  scriptText?: unknown;
  experienceNarration?: unknown;
}): number {
  const configured = Number(input.durationMinutes ?? 0);
  if (Number.isFinite(configured) && configured > 0) return Math.ceil(configured);

  const supportedTypes = new Set([
    'lesson', 'video', 'reading', 'checkpoint', 'quiz', 'lab', 'assignment',
    'exam', 'certification', 'practical', 'live_session', 'fieldwork', 'observation',
  ]);
  const rawType = String(input.lessonType ?? 'lesson');
  const type = (supportedTypes.has(rawType) ? rawType : 'lesson') as LessonType;
  const narrationWords = Math.max(
    wordCount(input.script),
    wordCount(input.scriptText),
    wordCount(input.experienceNarration),
  );
  const narrationMinutes = Math.ceil(narrationWords / 130);
  return Math.max(assignDuration(type), narrationMinutes);
}

