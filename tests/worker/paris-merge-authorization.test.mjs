import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The signed protected-merge workflow must not trust its own dispatch inputs.
// authorizeParisProtectedMerge proves the requested PR and head match the
// durable repair record while the repair is awaiting merge. These assertions
// pin the contract so the guard cannot be silently weakened.
const source = readFileSync(new URL('../../lib/ai/runtime/code-repair.ts', import.meta.url), 'utf8');

test('merge authorization compares the requested PR and head to the repair record', () => {
  const fn = source.slice(source.indexOf('export async function authorizeParisProtectedMerge'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /recorded\.number\)!==prNumber/, 'must reject a PR that is not the recorded one');
  assert.match(body, /recorded\.headSha\)!==expectedHeadSha/, 'must reject a head that was not validated');
  assert.match(body, /row\?\.status!=='validating'/, 'must require the repair to be awaiting a merge');
  assert.match(body, /authorized:reasons\.length===0/, 'must fail closed on any reason');
});

test('merge result records the workflow run id and a bounded reason set', () => {
  const fn = source.slice(source.indexOf('export async function recordParisMergeResult'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /runId:Number\.isSafeInteger\(result\.runId\)\?result\.runId:null/, 'must persist the run id');
  assert.match(body, /reasons\.slice\(0,8\)/, 'must bound the reported reasons');
});

test('the merge workflow driver authorizes before any GitHub write', () => {
  const driver = readFileSync(new URL('../../scripts/paris-protected-merge.mjs', import.meta.url), 'utf8');
  const authorizeAt = driver.indexOf('await authorizeMerge()');
  const approveAt = driver.indexOf("event: 'APPROVE'");
  const mergeAt = driver.indexOf('/merge`');
  assert.ok(authorizeAt > 0, 'the driver must call authorizeMerge');
  assert.ok(authorizeAt < approveAt, 'authorization must precede the approval');
  assert.ok(authorizeAt < mergeAt, 'authorization must precede the merge');
  assert.match(driver, /report\('merge-authorize'/, 'the driver must request authorization');
  // Every report call the Admin authority receives must carry the workflow run
  // id. The Admin route rejects any repair report without a safe-integer runId
  // before dispatch, so a report missing it fails the whole phase (this exact
  // omission previously made every protected merge fail authorization).
  const reports = driver.match(/report\('(merge-authorize|merge-result)'[^\n]*/g) ?? [];
  assert.ok(reports.length >= 6, 'expected the authorize and merge-result reports');
  for (const call of reports) assert.match(call, /runId:/, 'every Admin report must include runId: ' + call);
});
