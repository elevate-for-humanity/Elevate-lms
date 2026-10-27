import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = async path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const compile = text => stripTypeScriptTypes(text).replace(/^import[\s\S]*?;\n/gm, '').replaceAll('export ', '');
const executorSource = await source('lib/ai/tools/executor.ts');
const engineerSource = await source('lib/devstudio/paris-code-engineer.ts');
function executor({ token = 'ghs_app_token_fixture', fail = false } = {}) {
  const requests = [], deployments = [];
  const factory = new Function('getGitHubToken', 'dispatchGoogleDeployment', 'fetch', 'setTimeout',
    compile(executorSource) + '\nreturn {githubToken,dispatchToolRequest};');
  const api = factory(async () => { if (fail) throw Error('GITHUB_APP_CONFIGURATION_INVALID'); return token; },
    async target => { deployments.push(target); return {target, status:'dispatched',verifiedLive:false}; },
    async (url, init) => {
      requests.push({url,init});
      if (url.endsWith('/dispatches')) return new Response(null,{status:204});
      return Response.json({workflow_runs: requests.length === 1 ? [] : [{id:42,head_sha:'a'.repeat(40)}]});
    }, callback => callback());
  return {...api, requests, deployments};
}
test('PARIS test dispatch uses canonical App credentials without a PAT fallback', async () => {
  const e=executor();
  const response=await e.dispatchToolRequest({name:'workflows.runTests'},'https://admin.invalid',{});
  assert.equal(response.status,202);
  assert.ok(e.requests.every(r=>r.init.headers.Authorization==='Bearer ghs_app_token_fixture'));
  assert.ok(e.requests.some(r=>r.url.endsWith('/ci.yml/dispatches')));
  const failed=executor({fail:true});
  await assert.rejects(failed.githubToken(),/GITHUB_APP_CONFIGURATION_INVALID/);
  assert.equal(failed.requests.length,0);
});
test('PARIS deployment routes to existing Google workflows and rejects unknown targets',async()=>{
  const e=executor();
  const tool={name:'deployments.autopilot'};
  let response=await e.dispatchToolRequest(tool,'https://admin.invalid',{body:'{}'});
  assert.equal(response.status,202);
  assert.deepEqual(e.deployments,['admin']);
  response=await e.dispatchToolRequest(tool,'https://admin.invalid',{body:'{"target":"store"}'});
  assert.equal(response.status,202);
  assert.deepEqual(e.deployments,['admin','store']);
  response=await e.dispatchToolRequest(tool,'https://admin.invalid',{body:'{"target":"unknown"}'});
  assert.equal(response.status,400);
  assert.equal(e.deployments.length,2);
  assert.equal(e.requests.length,0);
});

function engineer(statuses) {
  const requests=[];
  const factory=new Function('fetch','getGitHubHeaders',compile(engineerSource)+'\nreturn {blockedPath,searchCode};');
  const api=factory(async(url,init)=>{
    requests.push({url,init});
    return Response.json({}, {status:statuses.shift()??200});
  },async()=>({Authorization:'Bearer workflow-fixture'}));
  return {...api,requests};
}
test('Search 401 falls back to directory discovery only after exact repository authorization succeeds',async()=>{
  const e=engineer([401,200]);
  assert.deepEqual(await e.searchCode('route failure'),[]);
  assert.equal(e.requests.length,2);
  assert.equal(e.requests[1].url,'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main');
  assert.equal(e.requests[1].init.redirect,'error');
  for(const status of [401,403]){
    const rejected=engineer([401,status]);
    await assert.rejects(rejected.searchCode('route failure'),new RegExp('repository authorization failed: '+status));
  }
});
test('runtime engineer and independent workflow both protect App authentication code',async()=>{
  const e=engineer([]);
  const workflow=await source('.github/workflows/paris-code-repair.yml');
  const pattern=workflow.match(/if re\.search\(r'([^']+)',path,re.I\)/)?.[1];
  assert.ok(pattern,'independent workflow must retain a protected-path check');
  for(const path of ['lib/devstudio/github-app-token.ts','lib/devstudio/github-token.ts','lib/devstudio/workflow-github-context.ts']){
    assert.equal(e.blockedPath(path),true);
    assert.equal(new RegExp(pattern,'i').test(path),true);
  }
  assert.equal(e.blockedPath('components/learner/Example.tsx'),false);
});

test('health checks validate App-authenticated repository reads without claiming writes are proven',async()=>{
  const health=await source('apps/admin/app/api/admin/dev-studio/system-health/route.ts');
  for(const status of [200,401]){
    const factory=new Function('apiRequireDevStudio','applyRateLimit','getDecryptedPlatformSecret','resolveAIRuntimeState','probeCloudflareWorkersAI','isGoogleDeploymentConfigured','getGitHubToken','fetch','NextResponse','process',compile(health)+'\nreturn GET;');
    const get=factory(async()=>({id:'operator'}),async()=>null,async()=>undefined,
      async()=>({providers:{},elevate:true,anyConfigured:true}),
      async()=>({reachable:false,configured:false,detail:'not configured'}),
      async()=>true,async()=>'ghs_fixture_token',
      async()=>Response.json({object:{sha:'a'.repeat(40)}},{status}),
      {json:body=>body},{env:{}});
    const report=await get({});
    const github=report.checks.find(c=>c.name==='GitHub Authorization');
    assert.equal(github.status,status===200?'ok':'warn');
    assert.ok(!github.detail.includes('ghs_'));
    if(status===200)assert.match(github.detail,/write and dispatch authority require an actual operation/);
  }
});

test('OpenHands verifies Elevate-lms with canonical App credentials and preserves separately configured repository behavior',async()=>{
  const text=await source('lib/devstudio/openhands/github-verifier.ts');
  let legacyReads=0;
  const factory=new Function('getGitHubToken','getSecret','process',compile(text)+'\nreturn githubToken;');
  const get=factory(async()=>'ghs_app_fixture',async()=>{legacyReads++;return 'legacy-other-repository-token';},{env:{}});
  assert.equal(await get('elevate-for-humanity/Elevate-lms'),'ghs_app_fixture');
  assert.equal(legacyReads,0);
  assert.equal(await get('elevate-for-humanity/another-authorized-repository'),'legacy-other-repository-token');
  assert.equal(legacyReads,1);
});
