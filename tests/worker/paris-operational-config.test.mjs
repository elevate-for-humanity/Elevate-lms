import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/paris-code-repair.yml','utf8');
const docs=readFileSync('.env.example','utf8');
const operational=[
 'PARIS_ADMIN_ORIGIN','PARIS_MONITOR_JOB_TIMEOUT_MINUTES',
 'PARIS_PREPARE_JOB_TIMEOUT_MINUTES','PARIS_VALIDATE_JOB_TIMEOUT_MINUTES',
 'PARIS_PUBLISH_JOB_TIMEOUT_MINUTES','PARIS_HEALTH_TIMEOUT_SECONDS',
 'PARIS_GITHUB_TIMEOUT_SECONDS','PARIS_PREFLIGHT_TIMEOUT_SECONDS',
 'PARIS_TICK_TIMEOUT_SECONDS','PARIS_DISPATCH_FAILURE_TIMEOUT_SECONDS',
 'PARIS_PREPARE_REQUEST_TIMEOUT_SECONDS','PARIS_OPENHANDS_POLL_SECONDS',
 'PARIS_REPAIR_BUDGET_MINUTES','PARIS_REPAIR_MAX_TURNS',
 'PARIS_IDENTITY_HTTP_TIMEOUT_SECONDS','PARIS_VALIDATION_HEAP_MB',
 'PARIS_VALIDATION_ARTIFACT_RETENTION_DAYS',
];

test('PARIS operational configuration uses repository variables rather than embedded endpoint/budget defaults',()=>{
 for(const name of operational) {
  assert.ok(workflow.includes('vars.'+name),name+' must come from GitHub Actions variables');
  assert.ok(docs.includes(name+'='),name+' must be documented for provisioning');
 }
 assert.doesNotMatch(workflow,/https:\/\/admin\.elevateforhumanity\.org/);
 assert.doesNotMatch(workflow,/timeout-minutes:\s*\d+/);
 assert.doesNotMatch(workflow,/os\.environ\.get\('PARIS_REPAIR_(?:BUDGET_MINUTES|MAX_TURNS)'\) or \d+/);
 assert.match(workflow,/PARIS_SETTING_REQUIRED/);
 assert.match(workflow,/PARIS_ADMIN_ORIGIN_INVALID/);
});
test('repair release controls and evidence gates remain intact',()=>{
 for(const evidence of [
  'Require an application patch and a new regression test',
  'Type-check production applications',
  'Enforce production application and runtime repair gates',
  'Publish only the independently validated immutable patch',
  'PARIS_ID_TOKEN',
  'repair_id',
  'PARIS_GITHUB_CONNECTIVITY_CHECK_FAILED'
 ]) assert.ok(workflow.includes(evidence),evidence+' must remain present');
});
