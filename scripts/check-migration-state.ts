#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const _key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!_url || !_key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
const db = createClient(_url, _key, { auth: { persistSession: false } });

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
