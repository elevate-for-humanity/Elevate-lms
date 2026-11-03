// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('claims fresh events without replaying history, duplicating live claims, or exposing the RPC', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role service_role; create role anon; create role authenticated;
      create table platform_events(id text primary key, processing_status text, available_at timestamptz default now(), created_at timestamptz default now(), locked_at timestamptz, attempts integer default 0,last_error text);`);
    await db.exec(readFileSync('supabase/migrations/20261103071717_isolate_historical_platform_event_claims.sql', 'utf8'));
    await db.exec(`insert into platform_events(id,processing_status,created_at) values ('old','pending',now()-interval '2 days'),('fresh','pending',now());`);
    expect((await db.query('select id from claim_platform_events_v1(20)')).rows).toEqual([{ id: 'fresh' }]);
    expect((await db.query("select processing_status,attempts from platform_events where id='old'")).rows).toEqual([{ processing_status: 'pending', attempts: 0 }]);
    expect((await db.query('select id from claim_platform_events_v1(20)')).rows).toEqual([]);
    for (const role of ['anon', 'authenticated']) {
      expect((await db.query<{allowed: boolean}>(`select has_function_privilege('${role}','claim_platform_events_v1(integer)','execute') as allowed`)).rows[0].allowed).toBe(false);
    }
  } finally { await db.close(); }
}, 30_000);
