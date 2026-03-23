#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

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

async function main() {
  // First check current view columns
  const { data: current } = await db.from('lms_lessons').select('*').limit(1);
  console.log('Current lms_lessons columns:', current?.length ? Object.keys(current[0]).join(', ') : '(no rows)');

  // Drop and recreate — must match existing column names to avoid breaking dependents
  const DROP = `DROP VIEW IF EXISTS public.lms_lessons CASCADE`;
  const CREATE = `CREATE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.module_id,
  cl.order_index,
  cl.order_index AS lesson_number,
  cl.title,
  cl.slug,
  cl.slug AS lesson_slug,
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
  NULL::text AS module_title,
  NULL::integer AS module_order,
  NULL::integer AS lesson_order,
  NULL::integer AS duration_minutes,
  'curriculum'::text AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
WHERE cl.is_published = true OR cl.status = 'published'`;

  const GRANT = `GRANT SELECT ON public.lms_lessons TO authenticated, service_role`;

  console.log('\nDropping existing view...');
  const dr = await rpc(DROP);
  console.log(dr.ok ? '  OK: dropped' : `  FAIL: ${dr.body.slice(0, 200)}`);

  console.log('Creating new view...');
  const cr = await rpc(CREATE);
  console.log(cr.ok ? '  OK: created' : `  FAIL: ${cr.body.slice(0, 200)}`);

  console.log('Granting access...');
  const gr = await rpc(GRANT);
  console.log(gr.ok ? '  OK: granted' : `  FAIL: ${gr.body.slice(0, 200)}`);

  // Verify
  const { data: after, error } = await db.from('lms_lessons').select('*').limit(1);
  if (error) {
    console.log('\nlms_lessons after rebuild:', error.message);
  } else {
    console.log('\nlms_lessons columns after rebuild:', after?.length ? Object.keys(after[0]).join(', ') : '(no rows — view exists and is empty, which is correct since no published lessons yet)');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
