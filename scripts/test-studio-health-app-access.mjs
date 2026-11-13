import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {runHealthProbe,waitForHealthSignal,STUDIO_HEALTH_BUDGET_MS,STUDIO_HEALTH_SECRET_MS} from '../lib/devstudio/health-probes.mjs';
const source=stripTypeScriptTypes(await readFile(new URL('../lib/devstudio/health-handler.ts',import.meta.url),'utf8')).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
function health({status=200,tokenError}={}){
 const requests=[];
 const handler=new Function('apiRequireDevStudio','getGoogleServices','isGoogleRuntimeReady','googleProjectId','getGitHubToken','probeCloudflareWorkersAI','resolveAIRuntimeState','fetch','NextResponse','process','require','readAIHealthSecrets','runHealthProbe','waitForHealthSignal','STUDIO_HEALTH_BUDGET_MS','STUDIO_HEALTH_SECRET_MS',source+'\nreturn handleDevStudioHealth;')(
  async()=>({}),()=>[],()=>true,()=> 'fixture-project',async()=>{if(tokenError)throw tokenError;return 'installation-fixture-token';},
  async()=>({reachable:false}),async()=>({providers:{},activeProvider:'elevate',elevate:true,anyConfigured:true}),
  async(url,init)=>{requests.push({url,init});return new Response(null,{status:url.endsWith('/user')?403:status});},
  {json:value=>value},{env:{NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture'},version:'v22'},()=>({version:'fixture'}),async()=>({}),runHealthProbe,waitForHealthSignal,STUDIO_HEALTH_BUDGET_MS,STUDIO_HEALTH_SECRET_MS);
 return {handler,requests};
}
test('canonical Studio health accepts installation repository access without requiring a GitHub user identity',async()=>{
 const h=health(),result=await h.handler({});
 assert.equal(result.githubTokenValid,true);
 assert.equal(h.requests[0].url,'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main');
 assert.equal(h.requests[0].init.redirect,'error');
 assert.equal(h.requests[0].init.cache,'no-store');
});
test('canonical Studio health rejects unauthorized repository access',async()=>{
 const h=health({status:403}),result=await h.handler({});
 assert.equal(result.githubTokenValid,false);assert.equal(result.execution.ready,false);
});
test('credential resolver failure remains an explicit unhealthy capability without crashing Studio health or leaking credentials',async()=>{
 const h=health({tokenError:Error('fixture-private-credential')}),result=await h.handler({});
 assert.equal(result.hasGitHub,false);assert.equal(result.githubTokenValid,false);assert.equal(result.execution.ready,false);
 assert.equal(result.githubAuthError,'github_authentication_unavailable');
 assert.equal(h.requests.length,0);assert.equal(JSON.stringify(result).includes('fixture-private-credential'),false);
});

test('known GitHub App failure codes are surfaced without exposing credentials',async()=>{
 for (const code of ['GITHUB_APP_NOT_CONFIGURED','GITHUB_APP_INSTALLATION_MISMATCH','GITHUB_APP_WRITE_PERMISSIONS_REQUIRED','GITHUB_APP_REQUEST_HTTP_404']) {
  const h=health({tokenError:Error(code)}),result=await h.handler({});
  assert.equal(result.githubAuthError,code);
  assert.equal(result.githubTokenValid,false);
  assert.equal(result.execution.ready,false);
  assert.equal(h.requests.length,0);
 }
});
test('untrusted exception details are never included in health response',async()=>{
 for (const message of ['GITHUB_APP_NOT_CONFIGURED secret=private-key','GITHUB_TOKEN_REJECTED: private-token','fixture-private-credential']) {
  const h=health({tokenError:Error(message)}),result=await h.handler({});
  assert.equal(result.githubAuthError,'github_authentication_unavailable');
  assert.equal(JSON.stringify(result).includes(message),false);
 }
});
