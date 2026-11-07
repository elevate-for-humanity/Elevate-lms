import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const monitor=workflow.split(/\n  monitor:\n/)[1]?.split(/\n  prepare:\n/)[0]??'';

test('PARIS monitor wakes on both successful and failed completed prerequisites',()=>{
 assert.match(workflow,/workflow_run:\s*\n\s*workflows:/);
 assert.match(monitor,/github\.event\.workflow_run\.conclusion == 'success'/);
 assert.match(monitor,/github\.event\.workflow_run\.conclusion == 'failure'/);
 assert.doesNotMatch(monitor,/workflow_run\.name == 'Deploy Admin' && github\.event\.workflow_run\.conclusion == 'success'/);
});

test('PARIS main pushes that update model, planner or recovery migrations trigger a monitor',()=>{
 for(const path of [
  "lib/ai/providers/**",
  "lib/devstudio/paris-inspection-budget.mjs",
  "lib/devstudio/repair-inference-budget.mjs",
  "lib/devstudio/paris-repair-deliverables.mjs",
  "lib/devstudio/paris-workflow-evidence.mjs",
  "lib/paris-workflow-identity.ts",
  "supabase/migrations/*paris*.sql"
 ])assert.ok(workflow.includes("- '"+path+"'"),path);
});

test('PARIS monitor retains signed workflow scope and failure visibility',()=>{
 assert.match(monitor,/github\.ref == 'refs\/heads\/main'/);
 assert.match(monitor,/recovery_blocked=admin_source/);
 assert.match(monitor,/recovery_blocked=admin_capability/);
 assert.match(monitor,/PARIS recovery did not execute:/);
 assert.match(monitor,/PARIS_GITHUB_CONNECTIVITY_CHECK_FAILED/);
});
