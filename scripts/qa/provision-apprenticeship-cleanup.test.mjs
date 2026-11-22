import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./provision-apprenticeship-e2e.mjs', import.meta.url), 'utf8');
const cleanup = source.slice(source.indexOf('async function cleanup() {'));

test('a missing cleanup state never reports successful teardown', () => {
  assert.match(cleanup, /QA cleanup state missing/);
  assert.doesNotMatch(cleanup, /No QA E2E state file found; nothing to clean up/);
});
test('historical attendance and wage obligations block destructive cleanup', () => {
  assert.match(cleanup, /host_shop_attendance_records/);
  assert.match(cleanup, /apprenticeship_wage_obligations/);
  assert.match(cleanup, /QA cleanup retention review required/);
});
test('cleanup validates exact fixture identity and shop ownership', () => {
  assert.match(cleanup, /state\.marker !==/);
  assert.match(cleanup, /QA cleanup rejected unexpected/);
  assert.match(cleanup, /QA cleanup rejected non-fixture shop/);
});
test('cleanup propagates errors and verifies database and Auth teardown', () => {
  assert.match(cleanup, /QA cleanup incomplete:/);
  assert.match(cleanup, /getUserById/);
  assert.match(cleanup, /QA Auth identity remains active/);
  assert.doesNotMatch(cleanup, /console\.error\(`soft-delete auth user/);
});
