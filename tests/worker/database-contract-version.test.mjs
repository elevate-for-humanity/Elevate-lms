import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

test('strict database handoff and publication gates track the source lesson contract', () => {
  const source = readFileSync(new URL('../../lib/ultimate-course-builder/core/lesson-contract.ts', import.meta.url), 'utf8');
  const version = source.match(/ULTIMATE_LESSON_CONTRACT_VERSION\s*=\s*'([^']+)'/)?.[1];
  assert.ok(version, 'Source lesson contract version must be explicit');
  const migration = readFileSync(new URL('../../supabase/migrations/20261029192819_align_ultimate_database_contract_version.sql', import.meta.url), 'utf8');
  const databaseVersion = migration.match(/current_literal constant text := quote_literal\('([^']+)'\)/)?.[1];
  assert.equal(databaseVersion, version, 'Update and exercise the database gates whenever the source contract changes');
  for (const signature of ['public.complete_ultimate_lesson_autopilot(uuid,text,bigint)',
    'public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb)']) assert.ok(migration.includes(signature));
});
