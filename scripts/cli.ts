#!/usr/bin/env tsx
/**
 * UNIFIED CLI - Single entry point for all Elevate LMS scripts
 * 
 * Usage:
 *   pnpm tsx scripts/cli.ts <command> [options]
 * 
 * Commands:
 *   course build       - Build course (validate → build → content → videos → upload)
 *   course validate    - Validate course structure
 *   course content    - Generate lesson content (AI)
 *   course videos     - Generate lesson videos (TTS + B-roll)
 *   
 *   seed <type>       - Seed data (all, hvac, barber, cna, programs, students)
 *   
 *   migrate            - Run database migrations
 *   migrate status    - Check migration status
 *   
 *   apply <type>      - Apply patches (consolidation, features, content)
 *   activate <type>   - Activate features (courses, features)
 *   
 *   generate <type>   - Generate content (videos, audio, preview)
 * 
 * Examples:
 *   pnpm tsx scripts/cli.ts course build --course=hvac
 *   pnpm tsx scripts/cli.ts seed hvac
 *   pnpm tsx scripts/cli.ts migrate
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const CWD = process.cwd();

// ─── CLI Parser ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd = args[0] || 'help';
const subArgs = args.slice(2);
const flags = args.filter(a => a.startsWith('--')).reduce((acc, f) => {
  const [k, v] = f.replace('--', '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {} as Record<string, string | boolean>);

// ─── Run helper ──────────────────────────────────────────────────────────────

function run(script: string, extraArgs: string[] = []) {
  const fullArgs = [...args.slice(1), ...extraArgs].filter(Boolean);
  const cmd = `pnpm tsx ${script} ${fullArgs.join(' ')}`;
  console.log(`\n▶ ${cmd}\n`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: CWD });
  } catch (e) {
    console.error(`Failed: ${cmd}`);
    process.exit(1);
  }
}

function runSync(script: string, extraArgs: string[] = []) {
  const fullArgs = [...args.slice(1), ...extraArgs].filter(Boolean);
  const cmd = `pnpm tsx ${script} ${fullArgs.join(' ')}`;
  console.log(`▶ ${cmd}`);
  try {
    return execSync(cmd, { cwd: CWD, encoding: 'utf-8' });
  } catch (e) {
    return '';
  }
}

function exists(script: string): boolean {
  return existsSync(path.join(CWD, script));
}

// ─── Course Commands ──────────────────────────────────────────────────────────

async function course(action: string) {
  const courseName = flags.course || flags.c || 'hvac';
  
  switch (action) {
    case 'build':
      run('./scripts/course-builder/build.ts', [`--course=${courseName}`]);
      break;
    case 'validate':
      run('./scripts/course-builder/validate.ts', [`--course=${courseName}`]);
      break;
    case 'generate':
      run('./scripts/course-builder/generate-course.ts', [`--course=${courseName}`]);
      break;
    case 'content':
      run('./scripts/course-builder/generate-lesson-content.ts', [`--course=${courseName}`]);
      break;
    case 'videos':
      run('./scripts/generate-course-videos.ts', [`--course=${courseName}`]);
      break;
    case 'upload':
      run('./scripts/upload-videos-to-supabase.ts', [`--course=${courseName}`]);
      break;
    case 'all':
    case 'full':
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`  COURSE BUILDER: ${courseName.toUpperCase()}`);
      console.log('═══════════════════════════════════════════════════════════════');
      run('./scripts/course-builder/validate.ts', [`--course=${courseName}`]);
      run('./scripts/course-builder/build.ts', [`--course=${courseName}`]);
      run('./scripts/course-builder/generate-lesson-content.ts', [`--course=${courseName}`]);
      run('./scripts/generate-course-videos.ts', [`--course=${courseName}`]);
      run('./scripts/upload-videos-to-supabase.ts', [`--course=${courseName}`]);
      console.log('\n✅ Course build complete!');
      break;
    default:
      console.log(`Unknown action: ${action}`);
      console.log('Usage: cli.ts course <build|validate|generate|content|videos|upload|all>');
  }
}

// ─── Seed Commands ────────────────────────────────────────────────────────────

async function seed(type: string) {
  const seeds: Record<string, string> = {
    all: './scripts/seed-all-program-courses.ts',
    hvac: './scripts/seed-hvac-curriculum.ts',
    barber: './scripts/course-builder/seeds/barber-course.seed.ts',
    cna: './scripts/seed-cna-content.ts',
    courses: './scripts/seed-courses.ts',
    programs: './scripts/seed-programs-db.ts',
    students: './scripts/seed-students-v2.ts',
  };
  
  const script = seeds[type] || seeds.all;
  if (exists(script)) {
    run(script);
  } else {
    console.log(`Seed type '${type}' not found. Available: ${Object.keys(seeds).join(', ')}`);
  }
}

// ─── Migration Commands ────────────────────────────────────────────────────────

async function migrate(action: string) {
  switch (action) {
    case 'up':
      run('./scripts/apply-migrations.ts');
      break;
    case 'status':
      run('./scripts/check-pending-migrations.ts');
      break;
    case 'apply':
      run('./scripts/apply-migration-api.ts');
      break;
    default:
      run('./scripts/apply-migrations.ts');
  }
}

// ─── Apply Commands ───────────────────────────────────────────────────────────

async function apply(type: string) {
  const applies: Record<string, string> = {
    consolidation: './scripts/apply-consolidation.mjs',
    content: './scripts/apply-barber-content.ts',
    migrations: './scripts/apply-migrations.ts',
    features: './scripts/activate-all-features.ts',
    course: './scripts/activate-courses.sh',
    autopilot: './scripts/activate-all-autopilots.sh',
  };
  
  const script = applies[type];
  if (script && exists(script)) {
    run(script);
  } else {
    console.log(`Apply type '${type}' not found. Available: ${Object.keys(applies).join(', ')}`);
  }
}

// ─── Generate Commands ───────────────────────────────────────────────────────

async function generate(type: string) {
  const generates: Record<string, string> = {
    videos: './scripts/generate-course-videos.ts',
    audio: './scripts/generate-lesson-audio.ts',
    preview: './scripts/generate-course-preview-videos.ts',
    blueprint: './scripts/generate-blueprint-videos.mjs',
    cna: './scripts/generate-cna-lesson-videos.mjs',
  };
  
  const script = generates[type];
  if (script && exists(script)) {
    run(script, args.slice(1));
  } else {
    console.log(`Generate type '${type}' not found. Available: ${Object.keys(generates).join(', ')}`);
  }
}

// ─── Assemble Commands ────────────────────────────────────────────────────────

async function assemble(type: string) {
  const assembles: Record<string, string> = {
    lessons: './scripts/assemble-lesson.ts',
    all: './scripts/assemble-all-lessons.ts',
  };
  
  const script = assembles[type];
  if (script && exists(script)) {
    run(script);
  } else {
    console.log(`Assemble type '${type}' not found. Available: ${Object.keys(assembles).join(', ')}`);
  }
}

// ─── Main Router ──────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ELEVATE LMS - UNIFIED CLI');
  console.log('═══════════════════════════════════════════════════════════════\n');

  switch (cmd) {
    case 'course':
      await course(args[1] || 'help');
      break;
    case 'seed':
      await seed(args[1] || 'all');
      break;
    case 'migrate':
      await migrate(args[1] || 'up');
      break;
    case 'apply':
      await apply(args[1] || 'help');
      break;
    case 'generate':
    case 'gen':
      await generate(args[1] || 'help');
      break;
    case 'assemble':
      await assemble(args[1] || 'all');
      break;
    case 'activate':
      await apply(args[1] || 'features');
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`
USAGE:
  pnpm tsx scripts/cli.ts <command> [options]

COMMANDS:
  course <action>  Course builder
    build        - Build course structure
    validate     - Validate course
    generate     - Generate course
    content      - Generate lesson content
    videos       - Generate videos
    upload       - Upload to CDN
    all          - Full pipeline

  seed <type>     Seed data
    all           - All programs
    hvac          - HVAC curriculum
    barber        - Barber apprenticeship
    cna           - CNA content
    courses       - Generic courses

  migrate <action> Migrations
    up            - Run pending migrations
    status        - Check migration status

  apply <type>    Apply patches
    consolidation  - Apply consolidation
    content       - Apply content
    features      - Activate features
    course        - Activate courses

  generate <type> Generate content
    videos        - Course videos
    audio         - Lesson audio
    preview       - Preview videos

  assemble <type> Assemble content
    all           - All lessons
    lessons       - Single lesson

  activate <type> Activate features (same as apply)

EXAMPLES:
  pnpm tsx scripts/cli.ts course build --course=hvac
  pnpm tsx scripts/cli.ts seed hvac
  pnpm tsx scripts/cli.ts migrate up
  pnpm tsx scripts/cli.ts generate videos --course=hvac
`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
