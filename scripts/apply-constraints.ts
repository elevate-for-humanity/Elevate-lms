#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');

async function rpc(sql: string): Promise<{ ok: boolean; body: string }> {
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

const CONSTRAINTS = [
  {
    name: 'course_modules_course_id_order_index_key',
    sql: `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_modules_course_id_order_index_key') THEN
    ALTER TABLE public.course_modules ADD CONSTRAINT course_modules_course_id_order_index_key UNIQUE (course_id, order_index);
  END IF;
END $$`,
  },
  {
    name: 'course_lessons_course_id_slug_key',
    sql: `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_lessons_course_id_slug_key') THEN
    ALTER TABLE public.course_lessons ADD CONSTRAINT course_lessons_course_id_slug_key UNIQUE (course_id, slug);
  END IF;
END $$`,
  },
  {
    name: 'modules_program_id_order_index_key',
    sql: `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'modules_program_id_order_index_key') THEN
    ALTER TABLE public.modules ADD CONSTRAINT modules_program_id_order_index_key UNIQUE (program_id, order_index);
  END IF;
END $$`,
  },
];

// Rebuild lms_lessons view to use is_published
const VIEW_SQL = `CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.module_id,
  cl.order_index AS lesson_number,
  cl.order_index,
  cl.title,
  cl.slug AS lesson_slug,
  cl.slug,
  cl.status,
  cl.is_published,
  cl.is_required,
  cl.lesson_type,
  cl.lesson_type::text AS step_type,
  cl.lesson_type::text AS content_type,
  cl.content,
  cl.passing_score,
  cl.quiz_questions,
  cl.video_url,
  cl.video_url AS video_file,
  cl.key_terms,
  cl.activity_type,
  cl.scenario_prompt,
  'curriculum'::text AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
WHERE cl.is_published = true OR cl.status = 'published'`;

async function main() {
  for (const c of CONSTRAINTS) {
    const r = await rpc(c.sql);
    console.log(r.ok ? `  OK: ${c.name}` : `  FAIL: ${c.name} — ${r.body.slice(0, 150)}`);
  }

  console.log('\nRebuilding lms_lessons view...');
  const vr = await rpc(VIEW_SQL);
  console.log(vr.ok ? '  OK: lms_lessons view rebuilt' : `  FAIL: ${vr.body.slice(0, 200)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
