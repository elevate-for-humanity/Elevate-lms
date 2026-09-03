import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const limit = parseInt(process.argv[2] ?? '10', 10);

async function main() {
  const { data, error } = await sb
    .from('curriculum_lessons')
    .select('id, lesson_title, lesson_slug, lesson_order, module_order, step_type, video_file')
    .eq('course_id', COURSE_ID)
    .order('module_order', { ascending: true })
    .order('lesson_order', { ascending: true })
    .limit(limit);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`\nFirst ${limit} lessons — Barber Course\n`);
  console.log('Mod.Les | Step Type   | Video | Title');
  console.log('--------|-------------|-------|----------------------------------------------');
  data!.forEach((l) => {
    const pos = `${l.module_order}.${l.lesson_order}`.padEnd(7);
    const type = (l.step_type ?? 'lesson').padEnd(11);
    const vid = l.video_file ? '✅' : '❌';
    console.log(`${pos} | ${type} | ${vid}    | ${l.lesson_title}`);
  });

  console.log('\nLesson IDs (for direct URL):');
  data!.forEach((l) => {
    console.log(`  ${l.module_order}.${l.lesson_order} ${l.id}  ${l.lesson_slug}`);
  });
}

main();
