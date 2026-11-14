#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getStaticProgram } from '../data/programs';
import { getAllBlueprints } from '../lib/curriculum/blueprints/index';
import { autoGenerateCourseForProgram } from '../lib/course-builder/program-auto-course';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const withVideos = process.argv.includes('--with-videos');
  const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='));
  const concurrency = Math.max(
    1,
    Number(concurrencyArg?.split('=')[1] ?? '1') || 1,
  );

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: programs, error } = await db.from('programs').select('id, slug, title, code');
  if (error) {
    throw new Error(`Failed to load programs: ${error.message}`);
  }

  const programBySlug = new Map((programs ?? []).map((program) => [String(program.slug ?? '').toLowerCase(), program]));
  const blueprints = await getAllBlueprints();
  let successCount = 0;
  let failureCount = 0;

  console.log(
    `Found ${blueprints.length} blueprints and ${programBySlug.size} programs. concurrency=${concurrency} videos=${withVideos ? 'on' : 'off'}`,
  );

  async function processBlueprint(blueprint: (typeof blueprints)[number]) {
    let program = programBySlug.get(blueprint.programSlug.toLowerCase());

    if (!program?.id) {
      const staticProgram = getStaticProgram(blueprint.programSlug);
      if (!staticProgram) {
        console.log(
          `- SKIP ${blueprint.id} — no matching program row and no static program file for slug '${blueprint.programSlug}'',
        );
        return;
      }

      const programRow = {
        slug: staticProgram.slug,
        title: staticProgram.title,
        category: staticProgram.category ?? 'workforce',
        description: staticProgram.subtitle || staticProgram.title,
        short_description: staticProgram.subtitle || null,
        status: 'draft',
        published: false,
        is_active: true,
        delivery_model: staticProgram.deliveryMode ?? null,
        enrollment_type: staticProgram.enrollmentType ?? null,
        has_lms_course: true,
      };

      if (dryRun) {
        console.log(`- DRY RUN create program row for ${blueprint.programSlug}`);
        program = {
          id: `dry-run-${blueprint.programSlug}`,
          slug: staticProgram.slug,
          title: staticProgram.title,
          code: null,
        };
      } else {
        const { data: insertedProgram, error: insertErr } = await db
          .from('programs')
          .upsert(programRow, { onConflict: 'slug' })
          .select('id, slug, title, code')
          .single();

        if (insertErr || !insertedProgram?.id) {
          console.log(
            `- SKIP ${blueprint.id} — failed to create program row for slug '${blueprint.programSlug}': ${insertErr?.message ?? 'no row returned'}`,
          );
          return;
        }

        program = insertedProgram;
        programBySlug.set(blueprint.programSlug.toLowerCase(), insertedProgram);
      }
    }

    if (dryRun) {
      console.log(`- DRY RUN ${blueprint.id} -> program ${program.id} (${program.slug})`);
      return;
    }

    console.log(`- BUILDING ${blueprint.id} -> program ${program.id} (${program.slug})`);
    const result = await autoGenerateCourseForProgram({
      programId: program.id,
      mode: 'replace',
      videoMode: withVideos ? 'queue' : 'off',
    });

    if (!result.ok) {
      console.log(`  ! ${result.error}`);
      if (result.status === 'incomplete_course') {
        console.log(
          `    expected=${result.expectedLessonCount} inserted=${result.lessonCount} skipped=${result.skipped} ratio=${(result.completionRatio * 100).toFixed(1)}%`,
        );
        if (result.generationFailures?.length) {
          console.log(`    generation_failures=${result.generationFailures.length}`);
        }
        if (result.contentFailures?.length) {
          console.log(`    content_failures=${result.contentFailures.length}`);
        }
      }
      failureCount++;
      return;
    }

    console.log(
      `  ✓ course ${result.courseId} modules=${result.moduleCount} lessons=${result.lessonCount}/${result.expectedLessonCount} ratio=${(result.completionRatio * 100).toFixed(1)}%${withVideos ? '' : ' (videos deferred)'}`,
    );
    successCount++;
  }

  const queue = [...blueprints];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const blueprint = queue.shift();
      if (!blueprint) break;
      await processBlueprint(blueprint);
    }
  });

  await Promise.all(workers);

  if (!dryRun) {
    console.log(`\nBuild summary: success=${successCount} failures=${failureCount}`);
    if (failureCount > 0) {
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error('\n❌ Bulk seed failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});