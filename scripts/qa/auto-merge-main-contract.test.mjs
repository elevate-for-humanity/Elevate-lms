import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../.github/workflows/auto-merge-main.yml', import.meta.url), 'utf8');

const disable = source.split('      - name: Disable only after transition out of automatic main eligibility\n')[1]
  ?.split('\n      - name: Request squash auto-merge')[0];
const arm = source.split('      - name: Request squash auto-merge through the existing branch rules\n')[1];
function getExpr(block) {
  const expr = block?.match(/(?:^|\n)        if: >-\n([\s\S]*?)\n        env:/)
    || block?.match(/(?:^|\n)        if: ([^\n]+)\n        env:/);
  assert.ok(expr, 'condition extracted from checked-in workflow');
  return (expr[1] || expr[2]).trim().replace(/^\$\{\{\s*/, '')
    .replace(/\s*\}\}\s*$/, '').replace(/\n\s*/g, ' ');
}
const disableExpr = getExpr(disable);
const armExpr = getExpr(arm);
function scenario({action='edited', base='main', previousBase='', head='feature', draft=false}={}) {
  const github = {event:{action,changes:{base:{ref:{from:previousBase}}},
    pull_request:{base:{ref:base},head:{ref:head},draft}}};
  return {disable:Function('github', `return (${disableExpr})`)(github),
    arm:Function('github', `return (${armExpr})`)(github)};
}

test('routine title/body edits preserve manual staging promotion auto-merge', () => {
  for (const s of [
    {base:'main',head:'staging'},
    {base:'staging',head:'feature'},
    {base:'staging',head:'feature',previousBase:'staging'},
  ]) assert.deepEqual(scenario(s),{disable:false,arm:false});
});

test('main-to-other retarget revokes only previously automation-eligible PRs', () => {
  assert.deepEqual(scenario({base:'staging',previousBase:'main',head:'feature'}),
    {disable:true,arm:false});
  assert.equal(scenario({base:'staging',previousBase:'main',head:'staging'}).disable,false);
  assert.deepEqual(scenario({base:'main',previousBase:'staging',head:'feature'}),
    {disable:false,arm:true});
});

test('draft conversion revokes only formerly eligible main-target PR', () => {
  assert.deepEqual(scenario({action:'converted_to_draft',draft:true}),
    {disable:true,arm:false});
  assert.equal(scenario({action:'converted_to_draft',head:'staging',draft:true}).disable,false);
  assert.equal(scenario({action:'converted_to_draft',base:'staging',draft:true}).disable,false);
});

test('live checks and exact-head protected merge guard are retained', () => {
  assert.deepEqual(scenario({action:'edited'}),{disable:false,arm:true});
  assert.match(disable,/headRefName,isDraft,autoMergeRequest/);
  assert.match(disable,/TRANSITION_ACTION/);
  // A genuinely stale main-target auto-merge must not survive retargeting,
  // even when a maintainer originally armed it. Title/body edits never enter
  // this cancellation path.
  assert.match(disable,/--disable-auto/);
  assert.doesNotMatch(disable,/owner_type|auto_merge\.enabled_by\.type/);
  assert.match(arm,/headRefOid,isDraft/);
  assert.match(arm,/--match-head-commit "\$PR_HEAD"/);
  assert.doesNotMatch(source,/--admin|--force|--bypass/);
});

test('retarget revocation survives unrelated metadata edits', () => {
  const concurrency = source.split('\nconcurrency:\n')[1]?.split('\njobs:\n')[0];
  assert.ok(concurrency, 'workflow concurrency contract must exist');
  assert.match(concurrency, /cancel-in-progress: true/);
  const line = concurrency.split('\n').find(value => value.trimStart().startsWith('group: '));
  const expression = line?.split(' }}-${{ ')[1]?.split(' }}')[0];
  assert.ok(expression, 'revocation requires a separate per-event concurrency key');
  const group = (action, from, runId) => {
    const github = {event: {action, changes: {base: {ref: {from}}}}, run_id: runId};
    return String(Function('github', `return (${expression})`)(github));
  };
  const retarget = group('edited', 'main', 701);
  const metadata = group('edited', '', 702);
  const anotherRetarget = group('edited', 'staging', 703);
  const draft = group('converted_to_draft', '', 704);
  assert.equal(retarget, '701');
  assert.equal(anotherRetarget, '703');
  assert.equal(draft, '704');
  assert.equal(metadata, 'routine');
  assert.equal(group('synchronize', '', 705), 'routine');
  assert.equal(group('edited', '', 706), metadata, 'routine arming remains deduplicated');
  assert.notEqual(retarget, metadata, 'metadata change must not cancel revoke');
  assert.notEqual(retarget, anotherRetarget, 'a second retarget cannot cancel revoke');
  assert.notEqual(draft, metadata, 'metadata change must not cancel draft revoke');
});
