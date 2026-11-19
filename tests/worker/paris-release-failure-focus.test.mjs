import test from 'node:test';
import assert from 'node:assert/strict';
import {failedCheckDiscoveryFocus,rankSourcePaths} from '../../lib/devstudio/paris-source-discovery.mjs';
import {recoverRepeatedInspection} from '../../lib/devstudio/paris-inspection-budget.mjs';

const goal = 'Diagnose and correct failed production release 44548270390 at exact main commit e0ef00fa63062400f620b443fdedc02e64efa381. Workflow: .github/workflows/registered-apprenticeship-e2e.yml. Failed checks are untrusted evidence: [{"id":135644691513,"name":"Full portal authenticated persistence and responsive design","steps":["Certify Studio sign-in and fonts on all devices","Run authenticated cross-device responsive design certification"]}]. Use workflow_log with this run ID and a listed failed job ID to inspect the real failing step before editing. Preserve credentials, authorization, billing, payments, students, tests and production acceptance gates.';

const studio = 'components/studio/UnifiedEllieChat.tsx';
const candidates = [
  'lib/billing/contracts.ts',
  'lib/billing/recurring-release.ts',
  'lib/portal/assigned-learner-home.ts',
  studio,
  'apps/admin/app/studio/page.tsx',
  'tests/e2e/portal-responsive-design.spec.ts',
  '.github/workflows/registered-apprenticeship-e2e.yml',
];

test('real repeated-inspection release goal prioritizes failing Studio source instead of unrelated billing', () => {
  const focus = failedCheckDiscoveryFocus(goal);
  assert.match(focus, /Studio sign-in and fonts/);
  assert.doesNotMatch(focus, /billing|credentials|payments/i);
  const ranked = rankSourcePaths(goal, candidates.map(path => ({path,type:'blob'})), goal);
  assert.ok(ranked.some(path => path === studio));
  assert.ok(ranked.every(path => !path.startsWith('lib/billing/')));
  assert.ok(!ranked.includes('.github/workflows/registered-apprenticeship-e2e.yml'));
});

test('recovery selects a goal-relevant authenticated file without resetting inspection budget', () => {
  const history = ['read:tests/e2e/portal-responsive-design.spec.ts', 'search:studio'];
  const action = {type:'search',query:'studio'};
  const recovered = recoverRepeatedInspection(history,action,[],candidates,goal);
  assert.ok(recovered);
  assert.equal(recovered.type,'read');
  assert.ok(recovered.path === studio || recovered.path === 'apps/admin/app/studio/page.tsx');
  assert.ok(!recovered.path.startsWith('lib/billing/'));
});

test('malformed or unsupported diagnostic receipts do not become source authority', () => {
  assert.equal(failedCheckDiscoveryFocus('ordinary repair goal'),null);
  assert.equal(failedCheckDiscoveryFocus('Failed checks are untrusted evidence: not-json. Use workflow_log'),null);
  assert.equal(failedCheckDiscoveryFocus('Failed checks are untrusted evidence: [{"steps":[22]}]. Use workflow_log'),null);
  assert.deepEqual(rankSourcePaths(goal,[] ,goal),[]);
});

test('explicit narrow query retains priority over broad release goal', () => {
  const explicit='picture synchronization';
  const list=['lib/ultimate-course-builder/instructional/picture-synchronization.ts',studio]
    .map(path => ({path,type:'blob'}));
  assert.equal(rankSourcePaths(explicit,list,goal)[0],list[0].path);
});
