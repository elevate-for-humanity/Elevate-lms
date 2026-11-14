import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('CDL account provisioning and welcome email require explicit main dispatch', () => {
  const workflow = readFileSync(new URL('../.github/workflows/provision-cdl-academy-program-holder.yml', import.meta.url), 'utf8');
  assert.match(workflow, /^  workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^  (push|schedule|workflow_run|pull_request):/m);
  assert.match(workflow, /if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /node scripts\/ops\/provision-cdl-academy-program-holder\.mjs/);
});
