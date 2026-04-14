import fs from 'fs';
import path from 'path';
import type { CourseSeed, LessonSeed, CheckpointSeed, ModuleSeed } from '../../../lib/curriculum/course-builder-types';
import { module1 } from './module-1.seed';
import { module2 } from './module-2.seed';
import { module3 } from './module-3.seed';
import { module4 } from './module-4.seed';
import { module5 } from './module-5.seed';
import { module6 } from './module-6.seed';
import { module7 } from './module-7.seed';
import { module8 } from './module-8.seed';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Sidecar merger ────────────────────────────────────────────────────────────
// Generated quiz/flashcard content lives in seeds/content/<slug>.json.
// TypeScript seed files are never modified by the generator.

const SIDECAR_DIR = path.resolve(__dirname, 'content');

function loadSidecar(slug: string): Record<string, unknown> {
  const p = path.join(SIDECAR_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function mergeLesson(lesson: LessonSeed): LessonSeed {
  const s = loadSidecar(lesson.slug);
  return {
    ...lesson,
    // Sidecar content wins if it's longer than the seed content
    content: (() => {
      const sidecarContent = s.content as string | undefined;
      if (!sidecarContent) return lesson.content;
      const sidecarWords = sidecarContent.trim().split(/\s+/).length;
      const seedWords    = lesson.content?.trim().split(/\s+/).length ?? 0;
      return sidecarWords > seedWords ? sidecarContent : lesson.content;
    })(),
    quiz:        (s.quiz        as LessonSeed['quiz'])        ?? lesson.quiz,
    flashcards:  (s.flashcards  as LessonSeed['flashcards'])  ?? lesson.flashcards,
    procedures:  (s.procedures  as LessonSeed['procedures'])  ?? lesson.procedures,
  };
}

function mergeCheckpoint(cp: CheckpointSeed): CheckpointSeed {
  const s = loadSidecar(cp.slug);
  const sq = s.quiz as { passingScore?: number; questions?: CheckpointSeed['questions'] } | undefined;
  return {
    ...cp,
    questions:   sq?.questions   ?? cp.questions,
    passingScore: sq?.passingScore ?? cp.passingScore,
  };
}

function mergeModule(mod: ModuleSeed): ModuleSeed {
  return {
    ...mod,
    lessons:    mod.lessons.map(mergeLesson),
    checkpoint: mod.checkpoint ? mergeCheckpoint(mod.checkpoint) : undefined,
  };
}

export const barberCourse: CourseSeed = {
  slug: 'barber-apprenticeship',
  title: 'Indiana Registered Barber License — Apprenticeship Program',
  hoursTotal: 14.5,
  modules: [module1, module2, module3, module4, module5, module6, module7, module8].map(mergeModule),
};
