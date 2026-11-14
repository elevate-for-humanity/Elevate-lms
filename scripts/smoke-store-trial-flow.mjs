#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const BASE = (process.env.SMOKE_BASE_URL || 'https://www.elevateforhumanity.org').replace(/\/$/, '');
const TRIAL_ROUTES = ['/store/licenses', '/launch', '/apps/website-builder/start-trial'];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const results = { ok: true, checks: [] };

function record(name, pass, detail) {
  results.checks.push({ name, pass, detail });
  if (!pass) results.ok = false;
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

if (url && key) {
  const db = createClient(url, key);
  const { error } = await db.from('user_app_subscriptions').select('app_slug').limit(1);
  record('user_app_subscriptions.app_slug', !error, error?.message);
  const { count } = await db.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true);
  record('products table (store catalog)', (count ?? 0) > 0, `active=${count ?? 0}`);
}

for (const path of TRIAL_ROUTES) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  record(`HTTP ${path}`, [200, 301, 302, 307, 308].includes(res.status), `status ${res.status}`);
}

process.exit(results.ok ? 0 : 1);
