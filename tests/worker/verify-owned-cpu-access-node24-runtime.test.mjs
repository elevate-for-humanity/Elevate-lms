import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../../.github/workflows/verify-owned-cpu-access.yml', import.meta.url), 'utf8'
);

// actions/checkout and actions/setup-node declare `runs.using: node24` from major 5 on.
// Earlier majors target Node.js 20, which runners force onto Node.js 24 and report as a warning.
const NODE24_MAJOR = new Map([
  ['actions/checkout', 5],
  ['actions/setup-node', 5],
]);

const usesRefs = () => [...workflow.matchAll(/uses:\s*(\S+)@(\S+)/g)].map((m) => ({ action: m[1], ref: m[2] }));

test('checkout and setup-node resolve to Node.js 24 runtimes', () => {
  const refs = usesRefs().filter((u) => NODE24_MAJOR.has(u.action));
  assert.equal(refs.length, 4, 'expected checkout and setup-node in both verify and connect jobs');
  for (const { action, ref } of refs) {
    assert.match(ref, /^v\d+$/, `${action}@${ref} must pin a major version tag`);
    const major = Number(ref.slice(1));
    assert.ok(
      major >= NODE24_MAJOR.get(action),
      `${action}@${ref} targets deprecated Node.js 20; ${action}@v${NODE24_MAJOR.get(action)}+ targets Node.js 24`
    );
  }
});

test('no action reference in the verification workflow targets Node.js 20', () => {
  const offenders = usesRefs().filter(({ action, ref }) => {
    const minMajor = NODE24_MAJOR.get(action);
    return minMajor !== undefined && Number(ref.replace(/^v/, '')) < minMajor;
  });
  assert.deepEqual(offenders, [], `Node.js 20 action references remain: ${JSON.stringify(offenders)}`);
});

test('the runtime upgrade leaves the verification contract unchanged', () => {
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node-version: '22'/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /inputs\.connect/);
  assert.match(workflow, /node --test scripts\/gcp\/probe-owned-cpu-admin\.test\.mjs scripts\/gcp\/activate-owned-cpu-model\.test\.mjs scripts\/gcp\/accept-owned-cpu-model\.test\.mjs/);
  assert.doesNotMatch(workflow, /contents: write|secrets\./);
});
