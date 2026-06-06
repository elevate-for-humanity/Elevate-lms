#!/usr/bin/env tsx
/**
 * Prestige Elevation™ — barber media orchestrator
 *
 * Runs existing generators with correct env checks and branding.
 * Does NOT call external APIs unless you pass --execute and keys are set.
 *
 * Usage:
 *   pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --dry-run
 *   pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --tier slide --execute
 *   pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --tier broll --slug barber-lesson-1 --execute
 *   pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --tier runway --slug barber-lesson-1 --execute
 */

import { config } from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

export const PRESTIGE_BRAND = {
  curriculumName: 'Prestige Elevation™ Barber Curriculum',
  orgName: 'Elevate for Humanity',
  courseId: '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
  programSlug: 'barber-apprenticeship',
  blueprintId: 'barber-apprenticeship-v1',
} as const;

const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
const tier = (() => {
  const i = args.indexOf('--tier');
  return i !== -1 ? args[i + 1] : 'slide';
})();
const slug = (() => {
  const i = args.indexOf('--slug');
  return i !== -1 ? args[i + 1] : null;
})();

function requireEnv(names: string[]): string[] {
  const missing: string[] = [];
  for (const n of names) {
    if (!process.env[n]?.trim()) missing.push(n);
  }
  return missing;
}

function assertSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!url.startsWith('https://') || url.includes('eyJ')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL must be the project URL (https://cuxzzpsyufcewtmicszk.supabase.co), not a JWT.',
    );
  }
}

function run(cmd: string) {
  console.log(`\n→ ${cmd}\n`);
  if (dryRun) {
    console.log('(dry-run — add --execute to run)\n');
    return;
  }
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
}

function main() {
  console.log('\n═══ Prestige Elevation Barber Media ═══');
  console.log(`Curriculum: ${PRESTIGE_BRAND.curriculumName}`);
  console.log(`Course ID:  ${PRESTIGE_BRAND.courseId}`);
  console.log(`Tier:       ${tier}`);
  console.log(`Mode:       ${dryRun ? 'DRY RUN' : 'EXECUTE'}\n`);

  const baseKeys = ['OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL'];
  const tierKeys: Record<string, string[]> = {
    slide: baseKeys,
    broll: baseKeys,
    runway: [...baseKeys, 'RUNWAY_API_KEY'],
  };

  const missing = requireEnv(tierKeys[tier] ?? baseKeys);
  if (missing.length && !dryRun) {
    console.error('Missing secrets (set in Dev Studio → Container or shell):');
    missing.forEach((k) => console.error(`  - ${k}`));
    process.exit(1);
  }
  if (!dryRun) assertSupabaseUrl();

  const slugArg = slug ? ` --slug ${slug}` : '';
  const onlyArg = slug ? ` --only ${slug}` : '';

  switch (tier) {
    case 'broll':
      run(`pnpm tsx scripts/generate-barber-lesson-videos.ts${slugArg}${dryRun ? ' --dry-run' : ''}`);
      break;
    case 'runway':
      if (!slug) {
        console.error('--tier runway requires --slug barber-lesson-N');
        process.exit(1);
      }
      run(
        `pnpm tsx scripts/generate-lesson-video-runway.ts --slug ${slug} --title "Lesson" --module "Barber" --out public/videos/barber-lessons/${slug}.mp4`,
      );
      break;
    case 'slide':
    default:
      run(
        `pnpm tsx scripts/generate-barber-videos.ts${dryRun ? ' --dry-run' : ''}${onlyArg}${args.includes('--force') ? ' --force' : ''}`,
      );
      break;
  }

  console.log('\nDone. Next: pnpm tsx scripts/audit-barber-course.ts\n');
}

main();
