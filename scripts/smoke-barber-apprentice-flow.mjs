#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const EMAIL = process.argv[2] || 'elizabethpowell6262@gmail.com';
const BASE = (process.env.SMOKE_BASE_URL || 'https://www.elevateforhumanity.org').replace(/\/$/, '');
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) process.exit(1);

const db = createClient(url, key);
const results = { ok: true, checks: [] };

function record(name, pass, detail) {
  results.checks.push({ name, pass, detail });
  if (!pass) results.ok = false;
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function httpCheck(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  return [200, 301, 302, 307, 308].includes(res.status);
}

const { data: profile } = await db.from('profiles').select('id,role,email').eq('email', EMAIL).maybeSingle();
record('profile exists', !!profile, EMAIL);
if (!profile) process.exit(1);

const { data: pe } = await db
  .from('program_enrollments')
  .select('enrollment_state')
  .eq('user_id', profile.id)
  .eq('program_slug', 'barber-apprenticeship')
  .maybeSingle();
const { data: apprentice } = await db.from('apprentices').select('shop_id,status').eq('user_id', profile.id).maybeSingle();

record('program_enrollment active', pe?.enrollment_state === 'active', pe?.enrollment_state);
record('apprentices row', !!apprentice, apprentice?.status);

for (const path of ['/login/apprentice', '/portal/barber', '/programs/barber-apprenticeship']) {
  record(`HTTP ${path}`, await httpCheck(path));
}

console.log(JSON.stringify(results, null, 2));
process.exit(results.ok ? 0 : 1);
