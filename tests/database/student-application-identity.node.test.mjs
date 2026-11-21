import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('student application inserts preserve program identity and database duplicate protection', async () => {
  const route = await readFile(new URL('../../apps/marketing/app/api/applications/route.ts', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../../supabase/migrations/20260621000001_applications_status_and_normalization.sql', import.meta.url), 'utf8');
  const index = migration.match(/CREATE UNIQUE INDEX IF NOT EXISTS unique_applicant_per_program[\s\S]*?;/)?.[0];

  assert.ok(index, 'Expected the canonical student application uniqueness index');
  assert.equal(route.match(/program_id: catalogResult\.data\.id/g)?.length, 2,
    'Both the canonical and baseline insert must persist the verified program ID');
  assert.match(route, /error\?\.code === '23505' && String\(error\.message\)\.includes\('unique_applicant_per_program'\)/);

  const db = new PGlite();
  try {
    await db.exec('CREATE TABLE public.applications (normalized_email text, program_id uuid, status text)');
    await db.exec(index);
    const applicant = 'fixture@example.invalid';
    const barber = '10000000-0000-4000-8000-000000000001';
    const hvac = '10000000-0000-4000-8000-000000000002';
    const insert = program => db.query(
      "INSERT INTO public.applications VALUES ($1, $2, 'submitted')",
      [applicant, program],
    );

    await insert(barber);
    await assert.rejects(insert(barber), { code: '23505', constraint: 'unique_applicant_per_program' });
    await insert(hvac);

    const { rows } = await db.query('SELECT program_id FROM public.applications ORDER BY program_id');
    assert.deepEqual(rows.map(row => row.program_id), [barber, hvac]);
  } finally {
    await db.close();
  }
});
