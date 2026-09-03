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
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../../lib/supabase/admin';

dotenv.config({ path: '.env.local' });

const AI_SECRET_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'AZURE_OPENAI_API_KEY',
] as const;

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

async function hydratePlatformAISecrets(): Promise<string[]> {
  const available = AI_SECRET_KEYS.filter((key) => Boolean(process.env[key]?.trim())) as string[];
  if (available.length === AI_SECRET_KEYS.length) return available;

  try {
    const db = await requireAdminClient();
    for (const key of AI_SECRET_KEYS) {
      if (process.env[key]?.trim()) continue;
      const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
      if (!error && typeof data === 'string' && data.trim()) {
        process.env[key] = data.trim();
        available.push(key);
      }
    }
  } catch (error) {
    console.warn(
      `[course-builder] platform AI secret hydration unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const unique = [...new Set(available)];
  console.log(`[course-builder] AI provider pool: ${unique.length} configured credential(s)`);
  return unique;
}

async function main() {
  const programSlug = valueAfter('--course');
  if (!programSlug) throw new Error('--course <program-slug> is required');

  const requestedMode = valueAfter('--mode');
  const mode: BuildMode =
    requestedMode === 'replace' || requestedMode === 'missing-only' ? requestedMode : 'refresh';
  const dryRun = args.includes('--validate') || args.includes('--dry-run');
  const videoMode = args.includes('--no-videos') || dryRun ? 'off' : 'queue';

  if (!dryRun) {
    const providers = await hydratePlatformAISecrets();
    if (!providers.length) {
      throw new Error(
        'No AI provider credential is available in runtime environment or platform secrets.',
      );
    }
  }

  const progress = (stage: Parameters<NonNullable<Parameters<typeof courseFactory>[1]>>[0], message: string, progressValue?: number) => {
    const percent = typeof progressValue === 'number' ? ` ${progressValue}%` : '';
    console.log(`[${stage}]${percent} ${message}`);
  };

  let result = await courseFactory(
    {
      programSlug,
      mode,
      contentSource: 'ai',
      videoMode,
      dryRun,
    },
    progress,
  );

  // Some credential courses are intentionally standalone and therefore do not
  // have a row in `programs`. A registered blueprint is still a canonical
  // Course Factory source and must remain rebuildable. Only fall back when the
  // program-bound resolution reports not_found; never bypass a different
  // validation or generation failure.
  if (!result.ok && result.status === 'not_found') {
    const registeredBlueprint = await getBlueprintBySlug(programSlug);
    if (registeredBlueprint) {
      console.log(`[resolve] No programs row for ${programSlug}; using registered credential blueprint ${registeredBlueprint.id}.`);
      result = await courseFactory(
        {
          blueprint: registeredBlueprint,
          mode,
          contentSource: 'ai',
          videoMode,
          dryRun,
        },
        progress,
      );
    }
  }

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
