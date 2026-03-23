#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  'https://cuxzzpsyufcewtmicszk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE2MTA0NywiZXhwIjoyMDczNzM3MDQ3fQ.5JRYvJPzFzsVaZQkbZDLcohP7dq8LWQEFeFdVByyihE',
  { auth: { persistSession: false } }
);

async function main() {
  // course_lessons
  const { data: cl, error: cle } = await db.from('course_lessons').select('*').limit(1);
  if (cle) console.log('course_lessons:', cle.message);
  else console.log('course_lessons columns:', cl?.length ? Object.keys(cl[0]).join(', ') : '(no rows — table exists)');

  // lms_lessons
  const { data: ll, error: lle } = await db.from('lms_lessons').select('*').limit(1);
  if (lle) console.log('lms_lessons:', lle.message);
  else console.log('lms_lessons columns:', ll?.length ? Object.keys(ll[0]).join(', ') : '(no rows — view exists)');

  // course_modules
  const { data: cm, error: cme } = await db.from('course_modules').select('*').limit(1);
  if (cme) console.log('course_modules:', cme.message);
  else console.log('course_modules columns:', cm?.length ? Object.keys(cm[0]).join(', ') : '(no rows — table exists)');

  // programs — check PRS slug exists
  const { data: prog } = await db.from('programs').select('id, slug, title').eq('slug', 'peer-recovery-specialist-jri').single();
  console.log('PRS program:', prog ? `id=${prog.id}` : 'NOT FOUND');

  // courses linked to PRS program
  if (prog) {
    const { data: course } = await db.from('courses').select('id, program_id').eq('program_id', prog.id).single();
    console.log('PRS course:', course ? `id=${course.id}` : 'NOT FOUND — must create before seeding');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
