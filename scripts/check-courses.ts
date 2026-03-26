import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // All courses regardless of published state
  const { data: courses, error } = await db
    .from('courses')
    .select('id,title,slug,status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) { console.error('courses error:', error.message); return; }
  console.log('\nAll courses (newest first):');
  courses?.forEach(c => console.log(`  ${c.id}  status=${c.status}  ${c.title ?? c.slug}`));

  // Count course_lessons per course
  for (const c of (courses ?? []).slice(0, 3)) {
    const { count } = await db.from('course_lessons').select('*', { count: 'exact', head: true }).eq('course_id', c.id);
    console.log(`    → ${count} course_lessons`);
  }

  // training_courses (HVAC legacy)
  const { data: tc } = await db.from('training_courses').select('id,title,slug').limit(5);
  console.log('\ntraining_courses:');
  tc?.forEach(c => console.log(`  ${c.id}  ${c.title ?? c.slug}`));
}

main().catch(console.error);
