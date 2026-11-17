import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverRepeatedInspection, checkInspectionBudget} from '../../lib/devstudio/paris-inspection-budget.mjs';
import {rankSourcePaths, rememberSourcePaths} from '../../lib/devstudio/paris-source-discovery.mjs';

test('replayed Studio inspection does not redirect into unrelated billing or test files', () => {
  const history = ['read:tests/e2e/portal-responsive-design.spec.ts'];
  const discovered = [
    'tests/e2e/portal-responsive-design.spec.ts',
    'apps/lms/app/api/learner/billing-authorization/route.ts',
    'lib/billing/contracts.ts',
    'lib/credentials/open-badges.test.ts',
  ];
  const action = {type:'read',path:'tests/e2e/portal-responsive-design.spec.ts'};
  assert.equal(recoverRepeatedInspection(history, action, [], discovered,
    'Repair authenticated Admin Studio composer viewport and font-size failure'), null);
  assert.equal(checkInspectionBudget([...history,...history],action).decision,'stop');
});

test('replayed Studio inspection selects only a relevant authenticated application source', () => {
  const history = ['read:tests/e2e/portal-responsive-design.spec.ts'];
  const action = {type:'read',path:'tests/e2e/portal-responsive-design.spec.ts'};
  const discovered = [
    'lib/billing/contracts.ts',
    'tests/e2e/portal-responsive-design.spec.ts',
    'apps/admin/components/studio/StudioComposer.tsx',
  ];
  assert.deepEqual(recoverRepeatedInspection(history,action,[],discovered,
    'Fix Studio composer responsive viewport'),{
    type:'read',path:'apps/admin/components/studio/StudioComposer.tsx'
  });
});

test('recovery never treats a protected or invented location as authenticated source', () => {
  const action = {type:'search',query:'studio'};
  const history = ['search:studio'];
  assert.equal(recoverRepeatedInspection(history,action,[],[
    'lib/devstudio/paris-code-engineer.ts',
    '../apps/admin/components/studio/StudioComposer.tsx',
    'tests/e2e/studio.test.ts',
  ], 'Studio composer'),null);
});

test('trusted branch-tree discovery recovers a relevant Studio producer without relaxing authorization', () => {
  const goal = 'Repair Studio composer mobile viewport and keyboard usability';
  const history = ['read:tests/e2e/portal-responsive-design.spec.ts'];
  const action = {type:'read',path:'tests/e2e/portal-responsive-design.spec.ts'};
  const irrelevant = ['lib/billing/contracts.ts','tests/e2e/portal-responsive-design.spec.ts'];
  assert.equal(recoverRepeatedInspection(history,action,[],irrelevant,goal),null);
  const trustedTree = [
    {type:'blob',path:'components/admin/studio/StudioComposer.tsx'},
    {type:'blob',path:'lib/billing/contracts.ts'},
    {type:'blob',path:'tests/e2e/portal-responsive-design.spec.ts'},
  ];
  const discovered = rememberSourcePaths(irrelevant,rankSourcePaths(goal,trustedTree,goal));
  assert.deepEqual(recoverRepeatedInspection(history,action,[],discovered,goal),
    {type:'read',path:'components/admin/studio/StudioComposer.tsx'});
});
