import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/paris-code-repair.yml', import.meta.url),'utf8');
const monitor = workflow.split(/^  monitor:\s*$/m)[1]?.split(/^  prepare:\s*$/m)[0];
const prepare = workflow.split(/^  prepare:\s*$/m)[1]?.split(/^  validate:\s*$/m)[0];

test('workflow-run floods coalesce waiting monitor runs without canceling an active signed tick',()=>{
 assert.ok(monitor,'monitor job exists');
 assert.match(monitor,/\bconcurrency:\s*\n\s+group: paris-code-repair-monitor\s*\n\s+cancel-in-progress: false\s*\n\s+queue: single/);
 assert.match(monitor,/Obtain short-lived PARIS workflow identity/);
 assert.match(monitor,/phase':'tick'/);
});

test('explicit durable repair dispatches retain their own serialized max queue',()=>{
 assert.ok(prepare,'prepare job exists');
 assert.match(prepare,/\bconcurrency:\s*\n\s+group: paris-code-repair-prepare\s*\n\s+cancel-in-progress: false\s*\n\s+queue: max/);
 assert.match(prepare,/inputs\.repair_id != ''/);
 assert.match(prepare,/Stage the PARIS patch/);
 assert.match(workflow,/\n  validate:\s*\n/);
 assert.match(workflow,/\n  publish:\s*\n/);
});

test('monitor events cannot consume repair-id prepare jobs',()=>{
 assert.doesNotMatch(workflow,/\nconcurrency:\s*\n\s+group: paris-code-repair\s*\n/);
 assert.match(monitor,/github\.event_name == 'workflow_dispatch' && inputs\.repair_id == ''/);
 assert.match(prepare,/github\.event_name == 'workflow_dispatch' && inputs\.repair_id != ''/);
 assert.match(workflow,/queue: single/);
 assert.match(workflow,/queue: max/);
});
