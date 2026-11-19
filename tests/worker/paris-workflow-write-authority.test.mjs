import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../../.github/workflows/verify-paris-workflow-write-authority.yml', import.meta.url), 'utf8'
);

test('write attestation is manual-only, isolated to main invocation and least required permissions', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  schedule:/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
});

test('write attestation verifies a temporary branch and cleans up without updating main', () => {
  assert.match(workflow, /git\/refs/);
  assert.match(workflow, /git\/ref\/heads/);
  assert.match(workflow, /-X DELETE/);
  assert.match(workflow, /trap cleanup EXIT/);
  assert.match(workflow, /verified_sha.*GITHUB_SHA/);
  assert.doesNotMatch(workflow, /git push .*main/);
  assert.doesNotMatch(workflow, /gh pr merge/);
});

test('workflow identity and evidence do not equate to protected merge or production acceptance', () => {
  assert.match(workflow, /ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(workflow, /PARIS_WORKFLOW_CONTENTS_WRITE_VERIFIED/);
  assert.match(workflow, /does not verify production Admin token/);
});
