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
