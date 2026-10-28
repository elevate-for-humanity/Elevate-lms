import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('release reads the existing Google token and keeps workflow dispatch on its scoped job identity',async()=>{const s=await read('.github/workflows/deploy-admin.yml');assert.ok(s.includes('node scripts/gcp/github-runtime-binding.mjs'));assert.ok(!s.includes('PARIS_GITHUB_APP_SECRET'));assert.ok(!s.includes('paris-github-app-binding.mjs'));assert.ok(s.includes('GH_TOKEN: ${{ github.token }}'));assert.ok(s.includes('inputs[credential_source]=runtime-token'));for(const gate of ['prune-web-release-requests.mjs --assert-tested-admin-rollout','preflight-web-rollout.mjs','activate-tested-public-revision.mjs','verify-admin-revision.mjs'])assert.ok(s.includes(gate));});
test('live runtime verification forwards OIDC only and App verification stays an explicit separate mode',async()=>{const s=await read('.github/workflows/verify-paris-production-authorization.yml');assert.ok(s.includes('default: runtime-token'));assert.ok(s.includes("phase='app-auth-diagnostic' if source=='github-app-installation' else 'auth-diagnostic'"));assert.ok(!s.toLowerCase().includes('x-paris-github-token'));assert.ok(s.includes("sha!=os.environ['EXPECTED_SHA']"));assert.ok(s.includes("body.get('credentialSource')=='github-app-installation'"));});
test('ordinary runtime ticks cannot claim repairs or send GitHub requests',async()=>{
 const text=stripTypeScriptTypes(await read('lib/ai/runtime/code-repair.ts')).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');let otherReads=0;
 const db={from:table=>{if(!['paris_autopilot_policy','profiles'].includes(table))otherReads++;return{select:()=>({eq:()=>({maybeSingle:async()=>({data:table==='profiles'?{role:'admin'}:{enabled:true,actor_id:'owner'}})})})};}};
 for(const [flag,token] of [[false,undefined],[true,undefined],[false,'verified-job-token']]){
  const factory=new Function('requireAdminClient','currentWorkflowGitHubToken',text+'\nreturn tickParisCodeRepairs;');const tick=factory(async()=>db,()=>token);
  assert.deepEqual(await tick({workflowOwnedDispatch:flag}),{enabled:true,dispatched:0,awaitingWorkflow:true});
 }
 assert.equal(otherReads,0);
});
