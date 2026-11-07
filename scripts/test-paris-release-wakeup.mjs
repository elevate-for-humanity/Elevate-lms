import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const verifier=readFileSync(new URL('../.github/workflows/verify-paris-production-authorization.yml',import.meta.url),'utf8');
const condition=source.match(/  monitor:\n    if: (.+)/)?.[1];
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
test('later monitors retain queued repair dispatches in the serialized workflow',()=>{
 const policy=source.split('concurrency:')[1].split('jobs:')[0];
 assert.match(policy,/group: paris-code-repair/);
 assert.match(policy,/cancel-in-progress: false/);
 assert.match(policy,/queue: max/);
});
