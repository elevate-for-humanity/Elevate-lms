import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
try {
  await db.exec(`create table google_classroom_sync(id int generated always as identity primary key,user_id text,course_id text,settings jsonb);
    create unique index google_classroom_sync_user_course_uidx on google_classroom_sync(user_id,course_id) where course_id is not null;
    insert into google_classroom_sync(user_id,course_id) values ('owner','course'),('owner',null),('owner',null);`);
  const upsert = `insert into google_classroom_sync(user_id,course_id,settings) values ('owner','course','{"name":"Updated"}') on conflict (user_id,course_id) do update set settings=excluded.settings`;
  await assert.rejects(db.exec(upsert), /no unique or exclusion constraint/);
  const migration = await readFile(new URL('../../supabase/migrations/20261101055459_repair_classroom_upsert_conflict_index.sql', import.meta.url),'utf8');
  await db.exec(migration);
  await db.exec(upsert);
  await db.exec(migration);
  assert.equal((await db.query('select count(*)::int as n from google_classroom_sync')).rows[0].n,3);
  assert.equal((await db.query("select settings->>'name' as name from google_classroom_sync where course_id='course'")).rows[0].name,'Updated');
  await assert.rejects(db.exec("insert into google_classroom_sync(user_id,course_id) values ('owner','course')"),/duplicate key/);
  console.log('Classroom PostgreSQL regression passed: original failure reproduced, upsert repaired, null rows preserved, unique key enforced, migration idempotent.');
} finally { await db.close(); }
