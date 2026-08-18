#!/usr/bin/env npx tsx
/**
 * Canonical Course Builder CLI.
 *
 * This command is intentionally a thin transport around Course Factory. It
 * must never own a second content, assessment, persistence, or video pipeline.
 *
 * Examples:
 *   pnpm tsx scripts/course-builder/run.ts --course entrepreneurship
 *   pnpm tsx scripts/course-builder/run.ts --course barber-apprenticeship
 *   pnpm tsx scripts/course-builder/run.ts --course entrepreneurship --validate
 */

import * as dotenv from 'dotenv';
import { courseFactory } from '../../lib/course-factory';
import type { BuildMode } from '../../lib/course-factory';

dotenv.config({ path: '.env.local' });

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

async function main() {
  const programSlug = valueAfter('--course');
  if (!programSlug) throw new Error('--course <program-slug> is required');

  const requestedMode = valueAfter('--mode');
  const mode: BuildMode =
    requestedMode === 'replace' || requestedMode === 'missing-only' ? requestedMode : 'refresh';
  const dryRun = args.includes('--validate') || args.includes('--dry-run');
  const videoMode = args.includes('--no-videos') || dryRun ? 'off' : 'queue';

  const result = await courseFactory(
    {
      programSlug,
      mode,
      contentSource: 'ai',
      videoMode,
      dryRun,
    },
    (stage, message, progress) => {
      const percent = typeof progress === 'number' ? ` ${progress}%` : '';
      console.log(`[${stage}]${percent} ${message}`);
    },
  );

  if (!result.ok) {
    throw new Error(result.errors?.join('; ') || 'Course Factory failed');
  }

  console.log(JSON.stringify({
    courseId: result.courseId ?? null,
    title: result.title,
    modules: result.moduleCount,
    lessons: result.lessonCount,
    assessments: result.assessmentsGenerated,
    videosQueued: result.videosQueued,
    dryRun: result.dryRun,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
