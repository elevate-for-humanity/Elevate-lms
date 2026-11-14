import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'js-yaml';
test('automatic voicemail acceptance requires the actual successful Admin deployment job, never its dispatcher',()=>{
 const deployment=load(readFileSync('.github/workflows/deploy-admin.yml','utf8'));
 const workflow=load(readFileSync('.github/workflows/verify-owned-voicemail-speech.yml','utf8'));
 const job=workflow.jobs['dispatch-after-deployment'];
 const guard=job.steps.find(step=>step.name==='Require successful real Admin deployment for automatic acceptance').run;
 assert.ok(guard.includes(`.name == "${deployment.jobs['deploy-admin'].name}"`));
 assert.ok(guard.includes('.conclusion == "success"'));
 assert.ok(!guard.includes('.name == "dispatch"'));
 assert.ok(job.if.includes("github.event.workflow_run.event == 'workflow_dispatch'"));
 assert.ok(job.if.includes("github.event.workflow_run.head_branch == 'main'"));
 assert.ok(job.if.includes("github.event.workflow_run.conclusion == 'success'"));
});

test('Google speech authentication executes only through the permitted dispatch identity',()=>{
 const workflow=load(readFileSync('.github/workflows/verify-owned-voicemail-speech.yml','utf8'));
 assert.equal(workflow.jobs.verify.if, "github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
 const relay=workflow.jobs['dispatch-after-deployment'];
 assert.ok(relay.steps.some(s=>s.run?.includes('gh workflow run verify-owned-voicemail-speech.yml --ref main')));
 assert.ok(!relay.steps.some(s=>s.uses?.includes('google-github-actions/auth')));
});
