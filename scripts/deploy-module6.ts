/**
 * scripts/deploy-module6.ts
 *
 * Deploys all Module 6 lessons + checkpoint to the DB.
 * Lessons: 35, 36, 37, 38 + barber-module-6-checkpoint
 *
 * Usage:
 *   pnpm tsx scripts/deploy-module6.ts
 *   pnpm tsx scripts/deploy-module6.ts --dry-run
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

import * as lesson35 from './module6/lesson-35';
import * as lesson36 from './module6/lesson-36';
import * as lesson37 from './module6/lesson-37';
import * as lesson38 from './module6/lesson-38';
import * as checkpoint from './module6/checkpoint';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const DRY_RUN = process.argv.includes('--dry-run');

interface LessonModule {
  slug: string;
  title: string;
  videoUrl: string;
  content: string;
  quizQuestions: object[];
}

const lessons: LessonModule[] = [
  lesson35,
  lesson36,
  lesson37,
  lesson38,
  checkpoint,
];

async function deployLesson(mod: LessonModule): Promise<void> {
  console.log(`\n→ ${mod.slug}: ${mod.title}`);

  if (DRY_RUN) {
    console.log('  [dry-run] would upsert to course_lessons');
    console.log(`  content length: ${mod.content.length} chars`);
    console.log(`  quiz questions: ${mod.quizQuestions.length}`);
    return;
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('course_lessons')
    .select('id, slug')
    .eq('course_id', COURSE_ID)
    .eq('slug', mod.slug)
    .maybeSingle();

  if (fetchErr) {
    console.error(`  ✗ fetch error: ${fetchErr.message}`);
    return;
  }

  const isCheckpoint = mod.slug.includes('checkpoint');
  const payload: Record<string, unknown> = {
    content: mod.content,
    quiz_questions: mod.quizQuestions,
    video_url: mod.videoUrl,
    is_published: true,
    status: 'published',
  };
  if (isCheckpoint) {
    payload.passing_score = 70;
    payload.lesson_type = 'checkpoint';
  }

  if (existing) {
    const { error } = await supabase
      .from('course_lessons')
      .update(payload)
      .eq('id', existing.id);

    if (error) {
      console.error(`  ✗ update failed: ${error.message}`);
    } else {
      console.log(`  ✓ updated (id: ${existing.id})`);
    }
  } else {
    const { error } = await supabase
      .from('course_lessons')
      .insert({
        course_id: COURSE_ID,
        slug: mod.slug,
        title: mod.title,
        lesson_type: isCheckpoint ? 'checkpoint' : 'lesson',
        ...payload,
      });

    if (error) {
      console.error(`  ✗ insert failed: ${error.message}`);
    } else {
      console.log(`  ✓ inserted`);
    }
  }
}

async function main() {
  console.log(`Module 6 deploy — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Course ID: ${COURSE_ID}`);
  console.log(`Lessons: ${lessons.map(l => l.slug).join(', ')}`);

  for (const lesson of lessons) {
    await deployLesson(lesson);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
