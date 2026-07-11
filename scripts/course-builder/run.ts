/**
 * UNIFIED COURSE BUILDER - Single Entry Point
 * 
 * Generates complete courses: content → quizzes → videos → upload
 * 
 * Usage:
 *   pnpm tsx scripts/course-builder/run.ts --course hvac        # Full pipeline
 *   pnpm tsx scripts/course-builder/run.ts --course hvac --validate  # Validate only
 *   pnpm tsx scripts/course-builder/run.ts --course hvac --content   # Content only
 *   pnpm tsx scripts/course-builder/run.ts --course hvac --videos    # Videos only
 *   pnpm tsx scripts/course-builder/run.ts --course hvac --upload     # Upload only
 */

import { execSync } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const COURSE = getArg('--course') ?? 'hvac';
const MODULE = getArg('--module');
const SLUG = getArg('--slug');
const STEPS = args.filter(a => !a.startsWith('--')).map(a => a.replace('--', ''));

const ALL = !STEPS.length || STEPS.includes('all');

// Helper to run tsx scripts
function run(script: string, extraArgs: string[] = []) {
  const cmd = `pnpm tsx ${script} ${extraArgs.join(' ')}`;
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  COURSE BUILDER: ${COURSE.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: Validate
  if (ALL || STEPS.includes('validate')) {
    console.log('\n📋 [1/5] VALIDATING course structure...');
    run('./scripts/course-builder/validate.ts', COURSE ? ['--course', COURSE] : []);
  }

  // Step 2: Build
  if (ALL || STEPS.includes('build')) {
    console.log('\n🏗️  [2/5] BUILDING course...');
    run('./scripts/course-builder/build.ts', COURSE ? ['--course', COURSE] : []);
  }

  // Step 3: Generate Content (AI)
  if (ALL || STEPS.includes('content')) {
    console.log('\n🤖 [3/5] GENERATING lesson content (AI)...');
    const contentArgs = ['./scripts/course-builder/generate-lesson-content.ts', '--course', COURSE];
    if (MODULE) contentArgs.push('--module', MODULE);
    if (SLUG) contentArgs.push('--slug', SLUG);
    run(contentArgs.join(' '));
  }

  // Step 4: Generate Videos (TTS + B-roll + Assembly)
  if (ALL || STEPS.includes('videos')) {
    console.log('\n🎬 [4/5] GENERATING videos...');
    const videoArgs = ['./scripts/generate-course-videos.ts', '--course', COURSE];
    if (MODULE) videoArgs.push('--module', MODULE);
    if (SLUG) videoArgs.push('--slug', SLUG);
    run(videoArgs.join(' '));
  }

  // Step 5: Upload to CDN
  if (ALL || STEPS.includes('upload')) {
    console.log('\n☁️  [5/5] UPLOADING to CDN...');
    run('./scripts/upload-videos-to-supabase.ts', ['--course', COURSE]);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ COURSE BUILDER COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
