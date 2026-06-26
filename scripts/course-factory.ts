#!/usr/bin/env npx tsx
/**
 * course-factory.ts
 * 
 * CLI for the Unified Course Factory.
 * 
 * Usage:
 *   npx tsx scripts/course-factory.ts --list
 *   npx tsx scripts/course-factory.ts --blueprints
 *   npx tsx scripts/course-factory.ts --build hvac
 *   npx tsx scripts/course-factory.ts --build hvac --mode replace
 *   npx tsx scripts/course-factory.ts --build hvac barber --content ai
 *   npx tsx scripts/course-factory.ts --all
 */

import { courseFactory, createCourse, listBlueprints } from '../lib/course-factory';
import { loadBlueprintWithProgram } from '../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../lib/supabase/admin';

// Load env
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Colors ─────────────────────────────────────────────────────────────────

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg: string, color?: keyof typeof colors) {
  const c = color ? colors[color] : '';
  console.log(`${c}${msg}${colors.reset}`);
}

// ─── Progress Display ─────────────────────────────────────────────────────────

function showProgress(stage: string, message: string, progress?: number) {
  const bar = progress !== undefined 
    ? ` [${'█'.repeat(Math.floor(progress / 5))}${'░'.repeat(20 - Math.floor(progress / 5))}] ${Math.round(progress)}%`
    : '';
  log(`  ${stage}: ${message}${bar}`, 'cyan');
}

// ─── List Programs ─────────────────────────────────────────────────────────────

async function listPrograms() {
  const db = await requireAdminClient();
  
  const { data: programs } = await db
    .from('programs')
    .select('id, slug, title, credential_type')
    .eq('is_active', true)
    .order('title');

  if (!programs?.length) {
    log('No programs found', 'yellow');
    return;
  }

  log('\n📋 Available Programs:\n', 'bright');
  console.log('┌────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Slug                   │ Title                              │ Type   │');
  console.log('├────────────────────────────────────────────────────────────────────────┤');
  
  for (const prog of programs) {
    const slug = (prog.slug || '').padEnd(22);
    const title = (prog.title || '').substring(0, 30).padEnd(30);
    const type = (prog.credential_type || '').substring(0, 7).padEnd(7);
    console.log(`│ ${slug} │ ${title} │ ${type} │`);
  }
  
  console.log('└────────────────────────────────────────────────────────────────────────┘');
  console.log(`\nTotal: ${programs.length} programs\n`);
}

// ─── Build Course ──────────────────────────────────────────────────────────────

async function buildCourse(
  slug: string, 
  options?: { mode?: 'replace' | 'missing-only'; contentSource?: 'ai' | 'blueprint' }
) {
  log(`\n🚀 Building course: ${slug}\n`, 'bright');
  log('─'.repeat(60), 'blue');

  const startTime = Date.now();

  try {
    const result = await courseFactory({
      programSlug: slug,
      mode: options?.mode ?? 'missing-only',
      contentSource: options?.contentSource ?? 'blueprint',
    }, showProgress);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    log('\n' + '─'.repeat(60), 'blue');

    if (result.ok) {
      log('\n✅ SUCCESS!', 'green');
      console.log(`
   Course ID:     ${result.courseId}
   Title:         ${result.title}
   Modules:       ${result.moduleCount}
   Lessons:       ${result.lessonCount}
   Skipped:       ${result.skippedCount ?? 0}
   Time:          ${elapsed}s
`);
      if (result.warnings?.length) {
        log(`⚠️  Warnings: ${result.warnings.length}`, 'yellow');
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }
    } else {
      log('\n❌ FAILED', 'red');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.errors?.join(', ')}`);
    }

    return result;

  } catch (err) {
    log('\n❌ ERROR', 'red');
    console.error(err);
  }
}

// ─── Build All Courses ────────────────────────────────────────────────────────

async function buildAll(options?: { mode?: 'replace' | 'missing-only'; contentSource?: 'ai' | 'blueprint' }) {
  log('\n🚀 Building ALL courses with blueprints...\n', 'bright');

  const { listBlueprints: getBlueprints } = await import('../lib/course-factory');
  const blueprints = await getBlueprints();

  log(`Found ${blueprints.length} blueprints\n`, 'cyan');

  const results: Array<{ slug: string; ok: boolean; error?: string }> = [];

  for (const bp of blueprints) {
    if (!bp.programSlug) continue;

    log(`\n📦 Building: ${bp.programSlug}`, 'bright');
    const result = await buildCourse(bp.programSlug, options);
    results.push({ 
      slug: bp.programSlug, 
      ok: result?.ok ?? false, 
      error: result?.ok ? undefined : result?.errors?.join(', ') 
    });
  }

  // Summary
  log('\n\n' + '═'.repeat(60), 'blue');
  log('📊 BUILD SUMMARY', 'bright');
  log('═'.repeat(60), 'blue');
  console.log('┌────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Slug                   │ Status                                        │');
  console.log('├────────────────────────────────────────────────────────────────────────┤');
  
  for (const r of results) {
    const status = r.ok ? '✅ Success' : `❌ ${r.error?.substring(0, 30) || 'Failed'}`;
    const slug = r.slug.padEnd(22);
    console.log(`│ ${slug} │ ${status.padEnd(58)} │`);
  }
  
  console.log('└────────────────────────────────────────────────────────────────────────┘');
  
  const success = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  log(`\nTotal: ${success} succeeded, ${failed} failed\n`, success === results.length ? 'green' : 'yellow');
}

// ─── Check Blueprint ─────────────────────────────────────────────────────────

async function checkBlueprint(slug: string) {
  const db = await requireAdminClient();
  
  log(`\n🔍 Checking blueprint: ${slug}\n`, 'bright');

  const bpWithProgram = await loadBlueprintWithProgram(db, { programSlug: slug });

  if (!bpWithProgram) {
    log('❌ No blueprint found for this program', 'red');
    return;
  }

  const { program, blueprint } = bpWithProgram;

  console.log(`
Program:
  ID:       ${program.id}
  Slug:     ${program.slug}
  Title:    ${program.title || 'N/A'}
  Code:     ${program.code || 'N/A'}
  Credential: ${program.credential_type || 'N/A'}

Blueprint:
  ID:       ${blueprint.id}
  Title:    ${blueprint.credentialTitle}
  Code:     ${blueprint.credentialCode || 'N/A'}
  SOC:      ${blueprint.socCode || 'N/A'}
  State:    ${blueprint.state || 'N/A'}
  Modules:  ${blueprint.modules?.length || 0}
  Lessons:  ${blueprint.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0}

Modules:
`);

  for (const mod of blueprint.modules ?? []) {
    console.log(`  📚 ${mod.title}`);
    for (const lesson of mod.lessons ?? []) {
      const hasContent = lesson.content && lesson.content.length > 100;
      const hasQuiz = lesson.quizQuestions && lesson.quizQuestions.length > 0;
      const status = hasContent ? '✅' : '⚠️';
      console.log(`     ${status} ${lesson.title} (${lesson.stepType || 'lesson'})`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Course Factory CLI${colors.reset}

Unified course generation system for Elevate LMS.

Usage:
  npx tsx scripts/course-factory.ts [command] [options]

Commands:
  --list              List all programs
  --blueprints        List all available blueprints
  --check <slug>      Check blueprint details
  --build <slug>      Build course for program slug
  --all               Build all courses with blueprints

Options:
  --mode <mode>       'replace' or 'missing-only' (default: missing-only)
  --content <src>     'ai' or 'blueprint' (default: blueprint)
  --videos            Include video queue

Examples:
  npx tsx scripts/course-factory.ts --list
  npx tsx scripts/course-factory.ts --blueprints
  npx tsx scripts/course-factory.ts --check hvac
  npx tsx scripts/course-factory.ts --build hvac
  npx tsx scripts/course-factory.ts --build hvac --mode replace
  npx tsx scripts/course-factory.ts --build hvac barber cosmetology
  npx tsx scripts/course-factory.ts --all
`);
    return;
  }

  if (args.includes('--list')) {
    await listPrograms();
    return;
  }

  if (args.includes('--blueprints')) {
    await listBlueprints();
    return;
  }

  // Get mode
  const mode = args.includes('--mode') 
    ? (args[args.indexOf('--mode') + 1] as 'replace' | 'missing-only')
    : 'missing-only';

  const contentSource = args.includes('--content')
    ? (args[args.indexOf('--content') + 1] as 'ai' | 'blueprint')
    : 'blueprint';

  const options = { mode, contentSource };

  if (args.includes('--check')) {
    const slug = args[args.indexOf('--check') + 1];
    if (slug) await checkBlueprint(slug);
    return;
  }

  if (args.includes('--all')) {
    await buildAll(options);
    return;
  }

  // Get slugs from args
  const slugs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--') && !['hvac', 'barber', 'cosmetology', 'esthetician', 'nail'].includes(arg)) {
      slugs.push(arg);
    }
  }

  // Check for specific courses
  if (args.includes('--hvac')) slugs.push('hvac');
  if (args.includes('--barber')) slugs.push('barber-apprenticeship');
  if (args.includes('--cosmo')) slugs.push('cosmetology-apprenticeship');
  if (args.includes('--esthetic')) slugs.push('esthetician-apprenticeship');
  if (args.includes('--nail')) slugs.push('nail-technician-apprenticeship');

  if (slugs.length > 0) {
    for (const slug of slugs) {
      await buildCourse(slug, options);
    }
    return;
  }

  // Default: show help
  log('\nNo command specified.\n', 'yellow');
  log('Quick start:\n', 'bright');
  console.log('  npx tsx scripts/course-factory.ts --list');
  console.log('  npx tsx scripts/course-factory.ts --blueprints');
  console.log('  npx tsx scripts/course-factory.ts --check hvac');
  console.log('  npx tsx scripts/course-factory.ts --build hvac');
  console.log('  npx tsx scripts/course-factory.ts --build hvac barber cosmetology');
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
