#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  'https://cuxzzpsyufcewtmicszk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE2MTA0NywiZXhwIjoyMDczNzM3MDQ3fQ.5JRYvJPzFzsVaZQkbZDLcohP7dq8LWQEFeFdVByyihE',
  { auth: { persistSession: false } }
);

// Check course_lessons columns
const { data: cols } = await db
  .from('information_schema.columns' as any)
  .select('column_name, data_type, column_default')
  .eq('table_schema', 'public')
  .eq('table_name', 'course_lessons')
  .order('column_name');

console.log('\ncourse_lessons columns:');
for (const c of cols ?? []) {
  console.log(`  ${(c as any).column_name}: ${(c as any).data_type}`);
}

const colNames = new Set((cols ?? []).map((c: any) => c.column_name));
console.log('\nstatus column exists:', colNames.has('status'));
console.log('is_published column exists:', colNames.has('is_published'));
console.log('slug column exists:', colNames.has('slug'));
console.log('lesson_type column exists:', colNames.has('lesson_type'));
