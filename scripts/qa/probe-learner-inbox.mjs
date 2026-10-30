import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Exercise the page's exact projection against PostgREST without reading any
// message contents or creating test messages. RLS remains covered by the
// authenticated page; this gate detects missing columns and relationships.
const source = readFileSync('apps/lms/app/lms/(app)/messages/page.tsx', 'utf8');
const projection = source.match(/\.from\('messages'\)\s*\.select\('([^']+)'\)/)?.[1];
assert.ok(projection, 'Learner inbox projection was not found in the actual page');
const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(base && key, 'Supabase projection verification credentials are required');
const url = new URL('/rest/v1/messages', base);
url.searchParams.set('select', projection);
url.searchParams.set('limit', '0');
const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` },
  redirect: 'error', signal: AbortSignal.timeout(15000) });
assert.equal(response.status, 200, `Learner inbox projection failed with HTTP ${response.status}`);
const rows = await response.json();
assert.ok(Array.isArray(rows) && rows.length === 0, 'Projection probe must not retrieve message contents');
console.log(JSON.stringify({ learnerInboxProjectionVerified: true, readOnly: true, messageRowsRead: 0 }));
