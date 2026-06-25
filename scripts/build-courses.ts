#!/usr/bin/env npx tsx
/**
 * build-courses.ts
 * 
 * CLI to run the unified course builder for multiple courses.
 * 
 * Usage:
 *   npx tsx scripts/build-courses.ts                    # Build all courses with blueprints
 *   npx tsx scripts/build-courses.ts --slug hvac         # Build single course
 *   npx tsx scripts/build-courses.ts --list               # List available programs
 *   npx tsx scripts/build-courses.ts --hvac --barber --cosmo  # Build specific courses
 * 
 * Options:
 *   --mode          'replace' | 'missing-only' (default: 'missing-only')
 *   --content-mode  'ai' | 'blueprint-only' (default: 'ai')
 *   --videos        'queue' | 'off' (default: 'queue')
 */

import { createClient } from '@supabase/supabase-js';
import { unifiedCourseBuilder, buildCourseByProgramSlug } from '../lib/course-builder/unified-builder';
import { getAllBlueprints } from '../lib/curriculum/blueprints';

// Load env
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function listPrograms() {
  console.log('\n📋 Available Programs:\n');
  
  const { data: programs } = await supabase
    .from('programs')
    .select('id, slug, title, credential_type')
    .eq('is_active', true)
    .order('title');
  
  if (!programs) {
    console.log('No programs found');
    return;
  }

  const blueprints = await getAllBlueprints();
  
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Program Slug           │ Title                          │ Blueprint │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  for (const prog of programs) {
    const hasBlueprint = blueprints.some(bp => 
      bp.programSlug?.toLowerCase() === prog.slug?.toLowerCase()
    );
    const bpStatus = hasBlueprint ? '✅' : '❌';
    console.log(`│ ${(prog.slug || '').padEnd(22)} │ ${(prog.title || '').substring(0, 28).padEnd(28)} │ ${bpStatus}       │`);
  }
  
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log(`\nTotal: ${programs.length} programs\n`);
}

async function listBlueprints() {
  console.log('\n📋 Available Blueprints:\n');
  
  const blueprints = await getAllBlueprints();
  
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Program Slug           │ Credential                     │ Modules │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  for (const bp of blueprints) {
    const modules = bp.modules?.length ?? 0;
    console.log(`│ ${(bp.programSlug || '').padEnd(22)} │ ${(bp.credentialTitle || '').substring(0, 28).padEnd(28)} │ ${modules.toString().padStart(7)} │`);
  }
  
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log(`\nTotal: ${blueprints.length} blueprints\n`);
}

async function buildCourse(slug: string, options?: { mode?: 'replace' | 'missing-only'; contentMode?: 'ai' | 'blueprint-only'; videos?: 'queue' | 'off' }) {
  console.log(`\n🚀 Building course for: ${slug}\n`);
  
  const result = await buildCourseByProgramSlug(slug, {
    mode: options?.mode ?? 'missing-only',
    contentMode: options?.contentMode ?? 'blueprint-only',
    videoMode: options?.videos ?? 'queue',
  });
  
  if (result.ok) {
    console.log('✅ Course built successfully!');
    console.log(`   Course ID: ${result.courseId}`);
    console.log(`   Modules: ${result.moduleCount}`);
    console.log(`   Lessons: ${result.lessonCount}`);
    if (result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.length}`);
    }
  } else {
    console.log(`❌ Build failed: ${result.error}`);
    console.log(`   Status: ${result.status}`);
  }
  
  return result;
}

async function buildAll(options?: { mode?: 'replace' | 'missing-only'; contentMode?: 'ai' | 'blueprint-only'; videos?: 'queue' | 'off' }) {
  console.log('\n🚀 Building ALL courses with blueprints...\n');
  
  const blueprints = await getAllBlueprints();
  
  console.log(`Found ${blueprints.length} blueprints\n`);
  
  const results: Array<{ slug: string; ok: boolean; error?: string }> = [];
  
  for (const bp of blueprints) {
    if (!bp.programSlug) continue;
    
    try {
      const result = await buildCourse(bp.programSlug, options);
      results.push({ slug: bp.programSlug, ok: result.ok, error: result.ok ? undefined : result.error });
    } catch (err) {
      results.push({ slug: bp.programSlug, ok: false, error: String(err) });
    }
  }
  
  console.log('\n📊 Build Summary:\n');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Program Slug           │ Status                           │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  for (const r of results) {
    const status = r.ok ? '✅ Success' : `❌ ${r.error}`;
    console.log(`│ ${r.slug.padEnd(22)} │ ${status.substring(0, 35).padEnd(35)} │`);
  }
  
  console.log('└─────────────────────────────────────────────────────────────┘');
  
  const success = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nTotal: ${success} succeeded, ${failed} failed\n`);
}

// Parse args
const args = process.argv.slice(2);

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Course Builder CLI
==================

Usage:
  npx tsx scripts/build-courses.ts [options]

Options:
  --list              List all available programs
  --blueprints        List all available blueprints
  --slug <slug>       Build single course by program slug
  --all               Build all courses with blueprints
  --mode <mode>       'replace' or 'missing-only' (default: missing-only)
  --content-mode <m>  'ai' or 'blueprint-only' (default: blueprint-only)
  --videos <v>        'queue' or 'off' (default: queue)
  --hvac              Include HVAC
  --barber            Include Barbering
  --cosmo             Include Cosmetology
  --esthetic          Include Esthetician
  --nail              Include Nail Technician

Examples:
  npx tsx scripts/build-courses.ts --list
  npx tsx scripts/build-courses.ts --blueprints
  npx tsx scripts/build-courses.ts --slug hvac
  npx tsx scripts/build-courses.ts --all
  npx tsx scripts/build-courses.ts --hvac --barber --cosmo
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

  // Check for specific courses
  const specificCourses: string[] = [];
  if (args.includes('--hvac')) specificCourses.push('hvac');
  if (args.includes('--barber')) specificCourses.push('barber-apprenticeship');
  if (args.includes('--cosmo')) specificCourses.push('cosmetology-apprenticeship');
  if (args.includes('--esthetic')) specificCourses.push('esthetician-apprenticeship');
  if (args.includes('--nail')) specificCourses.push('nail-technician-apprenticeship');

  const mode = args.includes('--mode') 
    ? (args[args.indexOf('--mode') + 1] as 'replace' | 'missing-only')
    : 'missing-only';
  
  const contentMode = args.includes('--content-mode')
    ? (args[args.indexOf('--content-mode') + 1] as 'ai' | 'blueprint-only')
    : 'blueprint-only';
  
  const videos = args.includes('--videos')
    ? (args[args.indexOf('--videos') + 1] as 'queue' | 'off')
    : 'queue';

  const options = { mode, contentMode, videos };

  if (args.includes('--all')) {
    await buildAll(options);
  } else if (args.includes('--slug')) {
    const slug = args[args.indexOf('--slug') + 1];
    await buildCourse(slug, options);
  } else if (specificCourses.length > 0) {
    for (const slug of specificCourses) {
      await buildCourse(slug, options);
    }
  } else {
    console.log('No action specified. Use --help for usage information.');
    console.log('\nQuick start:');
    console.log('  npx tsx scripts/build-courses.ts --list');
    console.log('  npx tsx scripts/build-courses.ts --blueprints');
    console.log('  npx tsx scripts/build-courses.ts --slug hvac');
    console.log('  npx tsx scripts/build-courses.ts --hvac --barber --cosmo');
  }
}

main().catch(console.error);
