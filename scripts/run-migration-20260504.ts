#!/usr/bin/env tsx
/**
 * One-shot: apply migration 20260504000001 via Supabase service role
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  // Test connection
  const { error: connErr } = await db.from('courses').select('id').limit(1);
  if (connErr) { console.error('Connection failed:', connErr.message); process.exit(1); }
  console.log('Connection OK');

  // Check current course_lessons columns
  const { data: cols } = await db
    .from('information_schema.columns' as any)
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'course_lessons');

  const existing = new Set((cols ?? []).map((c: any) => c.column_name as string));
  console.log('course_lessons columns:', [...existing].sort().join(', '));

  const needsStatus = !existing.has('status');
  const needsIsPublished = !existing.has('is_published');
  console.log(`needs status: ${needsStatus}, needs is_published: ${needsIsPublished}`);

  if (!needsStatus && !needsIsPublished) {
    console.log('Columns already present — checking unique constraints...');
  }

  // Check unique constraints via pg_constraint
  const { data: constraints } = await db
    .from('pg_constraint' as any)
    .select('conname')
    .in('conname', [
      'course_modules_course_id_order_index_key',
      'course_lessons_course_id_slug_key',
      'modules_program_id_order_index_key',
    ]);

  const existingConstraints = new Set((constraints ?? []).map((c: any) => c.conname as string));
  console.log('existing constraints:', [...existingConstraints].join(', ') || 'none of the three');

  console.log('\nMigration file exists:', fs.existsSync(
    path.join(process.cwd(), 'supabase/migrations/20260504000001_course_lessons_generator_join.sql')
  ));
  console.log('\nTo apply: paste supabase/migrations/20260504000001_course_lessons_generator_join.sql');
  console.log('into Supabase Dashboard → SQL Editor and run it.');
  console.log('\nThe Supabase JS client cannot execute arbitrary DDL — only the SQL Editor or direct pg connection can.');
}

main().catch(e => { console.error(e); process.exit(1); });
