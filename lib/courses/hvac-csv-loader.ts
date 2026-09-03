/**
 * HVAC lesson loader — serves lesson data from the in-memory content store.
 *
 * Originally intended to load from a CSV file; replaced with the canonical
 * in-memory store (hvac-lesson-content.ts + hvac-lesson-number-map.ts) to
 * avoid a filesystem dependency at build time.
 */

import { HVAC_LESSON_NUMBER_TO_DEF_ID } from './hvac-lesson-number-map';
import { loadJsonOnce } from '@/lib/data/json-cache';

export interface HvacLesson {
  lessonId: string;
  module: string;
  lessonOrder: number;
  lessonTitle: string;
  scriptText: string;
  diagramFile: string;
  videoFile: string;
  audioFile: string;
  quizQuestion: string;
  quizAnswer: string;
  keyConcept: string;
  durationMin: number;
}

// Build the lesson list from the number map + content store
function buildLessons(): HvacLesson[] {
  const HVAC_LESSON_CONTENT = loadJsonOnce<Record<string, any>>('hvac-lesson-content.json');
  return Object.entries(HVAC_LESSON_NUMBER_TO_DEF_ID)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([num, defId]) => {
      const content = HVAC_LESSON_CONTENT[defId];
      const [moduleNum] = defId.replace('hvac-', '').split('-').map(Number);
      return {
        lessonId: defId,
        module: `Module ${moduleNum}`,
        lessonOrder: Number(num),
        lessonTitle: content?.concept?.split('.')[0]?.slice(0, 80) ?? `Lesson ${num}`,
        scriptText: content?.concept ?? '',
        diagramFile: content?.diagramRef ? `${content.diagramRef}.svg` : '',
        videoFile: `lesson-${defId}.mp4`,
        audioFile: `lesson-${defId}.mp3`,
        quizQuestion: '',
        quizAnswer: '',
        keyConcept: content?.jobApplication ?? '',
        durationMin: 45,
      };
    });
}

let _cache: HvacLesson[] | null = null;

export function getAllHvacLessons(): HvacLesson[] {
  if (!_cache) _cache = buildLessons();
  return _cache;
}

export function getHvacLesson(lessonId: string): HvacLesson | null {
  return getAllHvacLessons().find((l) => l.lessonId === lessonId) ?? null;
}
