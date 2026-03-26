import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const BASE = 'https://3000--019d1a33-e842-7c1a-aa41-65e720f24b45.us-east-1-01.gitpod.dev';

async function main() {
  const { data: courses } = await db
    .from('courses')
    .select('id,title,slug,status')
    .eq('status', 'published')
    .limit(5);

  console.log('\nPublished courses:');
  for (const c of courses ?? []) {
    const { count } = await db.from('course_lessons').select('*', { count: 'exact', head: true }).eq('course_id', c.id);
    console.log(`  ${c.id}  (${count} lessons)  ${c.title ?? c.slug}`);
  }

  const courseId = courses?.[0]?.id;
  if (!courseId) { console.log('No published courses found.'); return; }

  console.log(`\nUsing: ${courses![0].title ?? courses![0].slug}`);
  console.log(`Course page: ${BASE}/lms/courses/${courseId}\n`);

  const { data: lessons, error } = await db
    .from('lms_lessons')
    .select('id,lesson_number,step_type,title')
    .eq('course_id', courseId)
    .order('lesson_number')
    .limit(15);

  if (error) { console.error('lms_lessons error:', error.message); return; }

  console.log('Test links (first 15 lessons):');
  lessons?.forEach(l => {
    const tag = l.step_type === 'checkpoint' ? ' ← CHECKPOINT' : l.step_type === 'exam' ? ' ← EXAM' : '';
    console.log(`  [${String(l.lesson_number).padStart(2)}] ${(l.step_type ?? '').padEnd(12)} ${BASE}/lms/courses/${courseId}/lessons/${l.id}${tag}`);
  });

  const checkpoint = lessons?.find(l => l.step_type === 'checkpoint');
  if (checkpoint) {
    console.log(`\nCheckpoint tab direct link:`);
    console.log(`  ${BASE}/lms/courses/${courseId}/lessons/${checkpoint.id}?activity=checkpoint`);
  }
}

main().catch(console.error);
