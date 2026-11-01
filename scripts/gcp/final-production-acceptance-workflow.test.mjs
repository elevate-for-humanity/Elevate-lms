import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'js-yaml';

const workflow=load(readFileSync(new URL('../../.github/workflows/final-production-acceptance.yml',import.meta.url),'utf8'));

test('automatic acceptance uses an authorized dispatch without expanding Google trust',()=>{
 const {dispatch,acceptance}=workflow.jobs;
 assert.equal(dispatch.if,"github.event_name == 'push' && github.ref == 'refs/heads/main'");
 assert.deepEqual(dispatch.permissions,{actions:'write'});
 assert.equal(dispatch.steps.some(step=>step.uses?.startsWith('google-github-actions/auth')),false);
 assert.equal(dispatch.steps.at(-1).run,'gh workflow run final-production-acceptance.yml --ref main');
 assert.equal(acceptance.if,"github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
 assert.equal(acceptance.environment,'production');
 assert.equal(acceptance.steps.find(step=>step.uses?.startsWith('google-github-actions/auth')).with.workload_identity_provider,
  'projects/484736877039/locations/global/workloadIdentityPools/elevate-github/providers/github-main');
});
