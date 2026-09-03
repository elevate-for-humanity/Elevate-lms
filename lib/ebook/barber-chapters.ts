/**
 * lib/ebook/barber-chapters.ts
 *
 * Extracts chapter data from the barber apprenticeship blueprint for the
 * printable ebook at /ebook/barber-theory/[chapter].
 *
 * Each chapter maps 1:1 to a blueprint module. Content, quiz questions, and
 * metadata are pulled directly from the blueprint — no duplication.
 */

import { loadJsonOnce } from '@/lib/data/json-cache';
import type { BlueprintLessonRef, BlueprintQuizQuestion } from '@/lib/curriculum/blueprints/types';

// 224 KB blueprint loaded from JSON — excluded from webpack module graph
const barberApprenticeshipBlueprint = loadJsonOnce<any>('barber-apprenticeship-blueprint.json');

export type EbookLesson = {
  slug: string;
  title: string;
  order: number;
  objective?: string;
  durationMinutes?: number;
  content?: string;
  isCheckpoint: boolean;
  quizQuestions?: BlueprintQuizQuestion[];
  passingScore?: number;
};

export type EbookChapter = {
  /** URL slug — matches the [chapter] param */
  id: string;
  chapterNumber: number;
  title: string;
  /** Short title without "Module N:" prefix */
  shortTitle: string;
  color: string;
  accentBg: string;
  lessons: EbookLesson[];
  /** All quiz questions across all lessons in this chapter */
  allQuizQuestions: BlueprintQuizQuestion[];
  /** Checkpoint lesson (last lesson in module) */
  checkpoint?: EbookLesson;
  totalDurationMinutes: number;
};

// Chapter ID → module slug mapping (matches cover page CHAPTERS array)
const CHAPTER_MAP: Array<{
  id: string;
  moduleSlug: string;
  color: string;
  accentBg: string;
}> = [
  { id: 'infection-control', moduleSlug: 'barber-module-1', color: '#dc2626', accentBg: '#fef2f2' },
  { id: 'hair-science', moduleSlug: 'barber-module-2', color: '#d97706', accentBg: '#fffbeb' },
  { id: 'tools-equipment', moduleSlug: 'barber-module-3', color: '#ea580c', accentBg: '#fff7ed' },
  { id: 'haircutting', moduleSlug: 'barber-module-4', color: '#334155', accentBg: '#f8fafc' },
  { id: 'shaving-beard', moduleSlug: 'barber-module-5', color: '#44403c', accentBg: '#fafaf9' },
  { id: 'chemical-services', moduleSlug: 'barber-module-6', color: '#6d28d9', accentBg: '#f5f3ff' },
  {
    id: 'professional-skills',
    moduleSlug: 'barber-module-7',
    color: '#1d4ed8',
    accentBg: '#eff6ff',
  },
  { id: 'state-board-prep', moduleSlug: 'barber-module-8', color: '#15803d', accentBg: '#f0fdf4' },
];

function stripModulePrefix(title: string): string {
  // "Module 3: Tools, Equipment & Ergonomics" → "Tools, Equipment & Ergonomics"
  return title.replace(/^Module \d+:\s*/, '');
}

function lessonFromRef(ref: BlueprintLessonRef): EbookLesson {
  const isCheckpoint = ref.slug.includes('checkpoint') || ref.slug.includes('exam');
  return {
    slug: ref.slug,
    title: ref.title,
    order: ref.order,
    objective: ref.objective,
    durationMinutes: ref.durationMinutes,
    content: ref.content,
    isCheckpoint,
    quizQuestions: ref.quizQuestions,
    passingScore: ref.passingScore,
  };
}

function buildChapter(
  chapterNumber: number,
  id: string,
  moduleSlug: string,
  color: string,
  accentBg: string,
): EbookChapter | null {
  const blueprintModule = barberApprenticeshipBlueprint.modules.find((m) => m.slug === moduleSlug);
  if (!blueprintModule) return null;

  const lessons = blueprintModule.lessons.map(lessonFromRef);
  const contentLessons = lessons.filter((l) => !l.isCheckpoint);
  const checkpoint = lessons.find((l) => l.isCheckpoint);

  const allQuizQuestions: BlueprintQuizQuestion[] = lessons.flatMap((l) => l.quizQuestions ?? []);

  const totalDurationMinutes = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);

  return {
    id,
    chapterNumber,
    title: blueprintModule.title,
    shortTitle: stripModulePrefix(blueprintModule.title),
    color,
    accentBg,
    lessons: contentLessons,
    allQuizQuestions,
    checkpoint,
    totalDurationMinutes,
  };
}

// Build all chapters once at module load (server-side only)
export const EBOOK_CHAPTERS: EbookChapter[] = CHAPTER_MAP.flatMap(
  ({ id, moduleSlug, color, accentBg }, i) => {
    const chapter = buildChapter(i + 1, id, moduleSlug, color, accentBg);
    return chapter ? [chapter] : [];
  },
);

export function getChapterById(id: string): EbookChapter | undefined {
  return EBOOK_CHAPTERS.find((c) => c.id === id);
}

export function getAdjacentChapters(id: string): {
  prev: EbookChapter | null;
  next: EbookChapter | null;
} {
  const idx = EBOOK_CHAPTERS.findIndex((c) => c.id === id);
  return {
    prev: idx > 0 ? EBOOK_CHAPTERS[idx - 1] : null,
    next: idx < EBOOK_CHAPTERS.length - 1 ? EBOOK_CHAPTERS[idx + 1] : null,
  };
}
