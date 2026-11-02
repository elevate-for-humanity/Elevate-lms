import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');
const condition=source.match(/  monitor:\n    if: (.+)/)?.[1];
function monitor(eventName,run={},ref='refs/heads/main') {
 return vm.runInNewContext(condition,{github:{ref,event_name:eventName,event:{workflow_run:run}}});
}
test('a verified main Admin deployment wakes the repair monitor without waiting for cron',()=>{
 assert.match(source,/workflow_run:\n    workflows: \['Deploy Admin'\]\n    types: \[completed\]\n    branches: \[main\]/);
 assert.equal(monitor('workflow_run',{head_branch:'main',event:'workflow_dispatch',conclusion:'success'}),true);
 assert.equal(monitor('schedule'),true);
 assert.equal(monitor('push'),true);
});
test('failed releases and request-only push runs cannot wake repair execution',()=>{
 for(const conclusion of ['failure','cancelled','timed_out','skipped',null]) {
  assert.equal(monitor('workflow_run',{head_branch:'main',event:'workflow_dispatch',conclusion}),false);
 }
 assert.equal(monitor('workflow_run',{head_branch:'main',event:'push',conclusion:'success'}),false);
 assert.equal(monitor('workflow_run',{head_branch:'feature',event:'workflow_dispatch',conclusion:'success'}),false);
 assert.equal(monitor('workflow_run',{head_branch:'main',event:'workflow_dispatch',conclusion:'success'},'refs/heads/feature'),false);
 assert.equal(monitor('pull_request'),false);
});
