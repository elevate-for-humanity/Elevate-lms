import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminDashboardAppCandidate, verifyAdminWorkflowCandidate } from './gcp/activate-tested-public-revision.mjs';

const candidate='https://candidate.example.run.app';
const environment={
 ACTIONS_ID_TOKEN_REQUEST_URL:'https://pipelines.actions.githubusercontent.com/oidc?request=1',
 ACTIONS_ID_TOKEN_REQUEST_TOKEN:'masked-job-authorization',
};
const good={credentialSource:'github-app-installation',diagnosticVersion:2,
 repository:{ok:true},contents:{ok:true},workflow:{ok:true},writeAuthority:'not_exercised'};
function fixture(response=good){
 const calls=[];
 const request=async(url,init)=>{
  calls.push({url:String(url),init});
  if(String(url).includes('/oidc?'))return new Response(JSON.stringify({value:'header.payload.signature'}),{status:200});
  return new Response(JSON.stringify(response),{status:200});
 };
 return {calls,request};
}
test('the zero-traffic candidate needs a GitHub signed App diagnostic before promotion',async()=>{
 const f=fixture();
 assert.deepEqual(await verifyAdminDashboardAppCandidate(candidate,{request:f.request,environment}),
  {verified:true,source:'github-app-installation'});
 assert.equal(f.calls.length,2);
 assert.match(f.calls[0].url,/audience=elevate-paris-code-repair/);
 assert.equal(f.calls[1].url,candidate+'/api/cron/paris-code-repair');
 assert.equal(f.calls[1].init.method,'POST');
 assert.equal(JSON.parse(f.calls[1].init.body).phase,'app-auth-diagnostic');
 assert.equal(f.calls[1].init.headers.Authorization,'Bearer header.payload.signature');
});
test('candidate health is insufficient without exact App identity and all read probes',async()=>{
 for(const result of [
  {...good,credentialSource:'runtime-token'},
  {...good,repository:{ok:false}},
  {...good,contents:{ok:false}},
  {...good,workflow:{ok:false}},
  {...good,diagnosticVersion:1},
 ])await assert.rejects(verifyAdminDashboardAppCandidate(candidate,{request:fixture(result).request,environment}),
  /PARIS_APP_CANDIDATE_AUTHORIZATION_UNVERIFIED/);
});
test('missing GitHub workflow OIDC environment never authorizes candidate',async()=>{
 const f=fixture();
 await assert.rejects(verifyAdminDashboardAppCandidate(candidate,{request:f.request,environment:{}}),
  /PARIS_APP_CANDIDATE_OIDC_UNAVAILABLE/);
 assert.equal(f.calls.length,0);
});

test('signed GitHub Actions identity verifies the zero-traffic Admin worker without an App RSA key',async()=>{
 const workflow={diagnosticVersion:2,workflowAuthorization:'temporary-job-v1',plannerContinuation:'durable-turn-v1',
  repository:{ok:true},contents:{ok:true},workflow:{ok:true}};
 const f=fixture(workflow);
 const env={...environment,GH_TOKEN:'scoped-job-identity-fixture'};
 assert.deepEqual(await verifyAdminWorkflowCandidate(candidate,{request:f.request,environment:env}),
  {verified:true,source:'signed-workflow-job'});
 assert.equal(JSON.parse(f.calls[1].init.body).phase,'auth-diagnostic');
 assert.equal(f.calls[1].init.headers['X-Paris-GitHub-Token'],env.GH_TOKEN);
});
test('workflow candidate cannot pass on missing scoped job identity or unavailable repository authority',async()=>{
 const good={diagnosticVersion:2,workflowAuthorization:'temporary-job-v1',plannerContinuation:'durable-turn-v1',
  repository:{ok:true},contents:{ok:true},workflow:{ok:true}};
 await assert.rejects(verifyAdminWorkflowCandidate(candidate,{request:fixture(good).request,environment}),
  /PARIS_WORKFLOW_CANDIDATE_AUTHORIZATION_UNVERIFIED/);
 for(const bad of [
  {...good,workflowAuthorization:'unexpected'},
  {...good,repository:{ok:false}},
  {...good,contents:{ok:false}},
  {...good,workflow:{ok:false}},
 ])await assert.rejects(verifyAdminWorkflowCandidate(candidate,{request:fixture(bad).request,
  environment:{...environment,GH_TOKEN:'scoped-fixture'}}),
  /PARIS_WORKFLOW_CANDIDATE_AUTHORIZATION_UNVERIFIED/);
});
