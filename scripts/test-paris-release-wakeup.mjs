import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const verifier=readFileSync(new URL('../.github/workflows/verify-paris-production-authorization.yml',import.meta.url),'utf8');
// The monitor has its own concurrency block; the if predicate no longer
// immediately follows the job key. Parse only the monitor job, fail closed
// if its guard disappears, and never interpret a prepare-job condition.
const monitorBody=source.split(/^  monitor:\s*$/m)[1]?.split(/^  prepare:\s*$/m)[0];
assert.ok(monitorBody,'PARIS monitor job is required');
const condition=monitorBody.match(/^    if: (.+)$/m)?.[1];
assert.ok(condition,'PARIS monitor authority condition is required');
function monitor(eventName,repairId='',ref='refs/heads/main',workflowRun={}) {
 return vm.runInNewContext(condition,{github:{ref,event_name:eventName,event:{workflow_run:workflowRun}},inputs:{repair_id:repairId}});
}
test('completed main workflows wake recovery on success or failure, but skipped and feature events cannot',()=>{
 for(const conclusion of ['failure','success'])
  assert.equal(monitor('workflow_run','','refs/heads/main',{head_branch:'main',conclusion}),true);
 for(const workflowRun of [{head_branch:'feature',conclusion:'failure'},{head_branch:'feature',conclusion:'success'},{head_branch:'main',conclusion:'skipped'},{head_branch:'main',conclusion:'cancelled'}])
  assert.equal(monitor('workflow_run','','refs/heads/main',workflowRun),false);
});
test('verified live authorization explicitly wakes a monitor without an invented repair ID',()=>{
 assert.equal(monitor('workflow_dispatch'),true);
 assert.equal(monitor('schedule'),true);
 assert.equal(monitor('push'),true);
 assert.match(source,/repair_id:[\s\S]*?required: false/);
 assert.match(verifier,/actions: write/);
 const checked=verifier.indexOf("raise SystemExit('PARIS_GITHUB_CONNECTIVITY_CHECK_FAILED')");
 const wake=verifier.indexOf('name: Wake the serialized repair monitor');
 assert.ok(checked>0 && wake>checked);
 assert.match(verifier.slice(wake),/paris-code-repair\.yml\/dispatches.*-f ref=main/);
 assert.doesNotMatch(verifier.slice(wake),/repair_id/);
});
test('monitor entry cannot impersonate a repair preparation or run outside main',()=>{
 assert.equal(monitor('workflow_dispatch','existing-repair'),false);
 assert.equal(monitor('workflow_dispatch','','refs/heads/feature'),false);
 for(const event of ['pull_request','workflow_run']) assert.equal(monitor(event),false);
 for(const job of ['prepare','report']) {
  const header=source.slice(source.indexOf('  '+job+':'),source.indexOf('    runs-on:',source.indexOf('  '+job+':')));
  assert.ok(header.includes("inputs.repair_id != ''"));
 }
});
test('the update verification bridge cannot recurse from a manually dispatched monitor',()=>{
 const bridge=source.slice(source.indexOf('name: Verify serving authorization after compatible control-plane updates'),source.indexOf('  prepare:'));
 assert.ok(bridge.includes("if: github.event_name == 'push' && steps.tick.outputs.runtime_sha != ''"));
 assert.match(bridge,/verify-paris-production-authorization\.yml\/dispatches/);
});
test('monitor backlog coalesces without discarding owner-authorized repair dispatches',()=>{
 const prepare=source.split(/^  prepare:\s*$/m)[1]?.split(/^  validate:\s*$/m)[0];
 assert.ok(prepare,'durable PARIS repair prepare job is required');
 assert.match(monitorBody,/group: paris-code-repair-monitor/);
 assert.match(monitorBody,/cancel-in-progress: false/);
 assert.match(monitorBody,/queue: single/);
 assert.match(prepare,/group: paris-code-repair-prepare/);
 assert.match(prepare,/cancel-in-progress: false/);
 assert.match(prepare,/queue: max/);
 assert.match(prepare,/inputs.repair_id != ''/);
});
