#!/usr/bin/env node
/** Time individual dashboard Supabase queries. */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function timed(label, fn) {
  const t0 = Date.now();
  try {
    const result = await fn();
    const err = result?.error?.message;
    const count = result?.count ?? result?.data?.length ?? (Array.isArray(result) ? result.length : undefined);
    console.log(`${String(Date.now() - t0).padStart(5)}ms  ${err ? 'ERR ' + err.slice(0, 80) : 'ok '}  ${label}${count != null ? ` (${count})` : ''}`);
    return result;
  } catch (e) {
    console.log(`${String(Date.now() - t0).padStart(5)}ms  THROW ${label}: ${e.message}`);
  }
}

const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

await timed('admin_revenue_summary RPC', () =>
  db.rpc('admin_revenue_summary', {
    month_start: monthStart,
    last_month_start: monthStart,
    last_month_end: monthStart,
  }),
);

await timed('admin_inactive_learners RPC', () => db.rpc('admin_inactive_learners', { inactive_days: 3, limit_n: 20 }));

await timed('active enrollments (unbounded)', () =>
  db
    .from('program_enrollments')
    .select(
      'id, user_id, program_id, program_slug, enrollment_state, access_granted_at, revoked_at, funding_source, funding_verified, amount_paid_cents',
    )
    .in('enrollment_state', ['active', 'enrolled', 'onboarding']),
);

await timed('paid enrollments (unbounded)', () =>
  db
    .from('program_enrollments')
    .select('amount_paid_cents, your_revenue_cents, created_at')
    .or('amount_paid_cents.gt.0,your_revenue_cents.gt.0'),
);

await timed('participant_report view', () =>
  db.from('participant_report').select('participant_id, enrollment_id').eq('enrollment_status', 'completed').limit(10),
);

await timed('programs unpublished', () =>
  db.from('programs').select('id, title, slug, status, updated_at').eq('published', false).neq('status', 'archived').limit(10),
);

await timed('missing funding enrollments (no embed)', () =>
  db
    .from('program_enrollments')
    .select('id, user_id, program_slug, funding_source')
    .in('enrollment_state', ['active', 'onboarding', 'enrolled'])
    .is('funding_source', null)
    .limit(10),
);
