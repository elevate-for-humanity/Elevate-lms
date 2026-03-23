#!/usr/bin/env tsx
/**
 * Apply DDL to Supabase via the pg REST endpoint.
 * Supabase exposes a /pg endpoint for service-role DDL on some plans.
 * Falls back to individual ALTER TABLE via the REST API headers trick.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// The DDL we need — broken into individual statements
const DDL_STATEMENTS = [
  // Add status to course_lessons
  `ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived'))`,
  // Add is_published to course_lessons
  `ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false`,
  // Unique constraint on course_modules(course_id, order_index)
  `ALTER TABLE public.course_modules ADD CONSTRAINT IF NOT EXISTS course_modules_course_id_order_index_key UNIQUE (course_id, order_index)`,
  // Unique constraint on course_lessons(course_id, slug)
  `ALTER TABLE public.course_lessons ADD CONSTRAINT IF NOT EXISTS course_lessons_course_id_slug_key UNIQUE (course_id, slug)`,
  // Unique constraint on modules(program_id, order_index)
  `ALTER TABLE public.modules ADD CONSTRAINT IF NOT EXISTS modules_program_id_order_index_key UNIQUE (program_id, order_index)`,
];

async function tryPgEndpoint(sql: string): Promise<{ ok: boolean; body: string }> {
  // Supabase pg endpoint (available on Pro+ plans)
  const res = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return { ok: res.ok, body: await res.text() };
}

async function tryRestRPC(sql: string): Promise<{ ok: boolean; body: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  return { ok: res.ok, body: await res.text() };
}

async function main() {
  console.log('Current course_lessons columns:');
  const { data: cl } = await db.from('course_lessons').select('*').limit(1);
  const existing = cl?.length ? Object.keys(cl[0]) : [];
  console.log(' ', existing.join(', '));
  console.log('  has status:', existing.includes('status'));
  console.log('  has is_published:', existing.includes('is_published'));

  if (existing.includes('status') && existing.includes('is_published')) {
    console.log('\nColumns already present. Migration already applied.');
    return;
  }

  console.log('\nAttempting DDL via /pg endpoint...');
  for (const stmt of DDL_STATEMENTS) {
    const pg = await tryPgEndpoint(stmt);
    if (pg.ok) {
      console.log('  OK (pg):', stmt.slice(0, 70));
    } else {
      const rpc = await tryRestRPC(stmt);
      if (rpc.ok) {
        console.log('  OK (rpc):', stmt.slice(0, 70));
      } else {
        console.log('  FAIL:', stmt.slice(0, 70));
        console.log('    pg:', pg.body.slice(0, 150));
        console.log('    rpc:', rpc.body.slice(0, 150));
      }
    }
  }

  // Verify
  console.log('\nVerifying...');
  const { data: cl2 } = await db.from('course_lessons').select('*').limit(1);
  const after = cl2?.length ? Object.keys(cl2[0]) : [];
  console.log('  has status:', after.includes('status'));
  console.log('  has is_published:', after.includes('is_published'));
}

main().catch(e => { console.error(e); process.exit(1); });
