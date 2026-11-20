import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const engine = process.env.PGLITE_MODULE;
test('clock notifications satisfy the production notification type contract', { skip: !engine }, async () => {
  const { PGlite } = await import(engine);
  const db = new PGlite();
  try {
    const migration = await fs.readFile('supabase/migrations/20260519000001_fix_document_approval_notification_trigger.sql', 'utf8');
    const constraint = migration.match(/ALTER TABLE public\.notifications\s+ADD CONSTRAINT notifications_type_check CHECK \(type IN \([\s\S]*?\)\);/)?.[0];
    assert.ok(constraint, 'load the real checked-in constraint');
    await db.exec('CREATE TABLE public.notifications (type text NOT NULL);');
    await db.exec(constraint);
    await assert.rejects(db.query("INSERT INTO notifications(type) VALUES ('timeclock')"), /notifications_type_check/);
    const route = await fs.readFile('apps/lms/app/api/timeclock/action/route.ts', 'utf8');
    const types = [...route.matchAll(/(?<![\w])type: '(ojt|timeclock)'/g)].map(match => match[1]);
    assert.equal(types.length, 3, 'learner receipt, admin attempt and geofence alert');
    for (const type of types) await db.query('INSERT INTO notifications(type) VALUES ($1)', [type]);
    assert.equal((await db.query('SELECT count(*)::integer AS n FROM notifications')).rows[0].n, 3);
  } finally { await db.close(); }
});
