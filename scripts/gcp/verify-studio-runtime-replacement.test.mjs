import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStudioRuntimeReplacement} from './verify-studio-runtime-replacement.mjs';
function fixture({trafficPercent=0,active=0,unchangedProcess=false,userProcesses=0}={}){
 const sha='a'.repeat(40),candidateTag='sc-'+sha.slice(0,8)+'-1234abcd',url='https://'+candidateTag+'---elevate-studio-browser-fixture.a.run.app',revision='elevate-studio-browser-00042-fixture',secret='fixture-shared-secret';
 const calls=[];let restarted=false,opens=0;
 const options={url,revision,sha,secret,candidateTag,attempts:2,sleep:async()=>{},readTraffic:async()=>[{revisionName:revision,percent:trafficPercent,tag:candidateTag,url},{revisionName:'old',percent:100-trafficPercent}],request:async(target,init)=>{
  const route=new URL(target).pathname,body=init.body?JSON.parse(init.body):null;calls.push({route,body,method:init.method});let result;
  if(route==='/health')result={ready:true,commit:sha,activeSessions:active,workspaceRecovery:{ready:true,persistent:true},browserWorkspaceRecovery:{persistent:true},terminalRecovery:{persistent:true,active:0}};
  else if(route==='/workspace/exec'){
   const p=body.args[1];let stdout;
   if(p.includes('/proc/sys/kernel/random/boot_id'))stdout=(restarted&&!unchangedProcess?'b':'a').repeat(64);
   else if(p.includes('candidate_restart_requested')){restarted=true;stdout='candidate_restart_requested';}
   else if(p.includes('fixture_saved'))stdout='fixture_saved';
   else if(p.includes('fixture_restored'))stdout='fixture_restored';
   else if(p.includes('fixture_removed'))stdout='fixture_removed';
   else if(p.includes('directNonBrowserProcesses'))stdout=JSON.stringify({processInventoryReadable:true,directNonBrowserProcesses:userProcesses,directChildShells:0});
   else throw Error('Unexpected executable probe');
   result={exitCode:0,stdout};
  }else if(route==='/sessions'){opens++;result={id:'session-'+opens,token:'fixture-session-token',restored:opens>1};}
  else if(route.endsWith('/events'))result={tabs:[{id:'one',url:'https://www.elevateforhumanity.org/'},{id:'two',url:'about:blank'}],activeTabId:'two',viewport:{width:390,height:780}};
  else if(route==='/workspace/checkpoint')result={persistent:true};
  else result={ok:true};
  return {ok:true,json:async()=>result};
 }};return {options,calls,get restarted(){return restarted;}};
}
test('proves replacement, isolated cloud-file restore and browser reconnect without writing the serving workspace',async()=>{
 const f=fixture(),result=await verifyStudioRuntimeReplacement(f.options);assert.equal(result.passed,true);assert.equal(result.isolatedWorkspaceFileRestored,true);assert.equal(result.runtimeReplaced,true);assert.equal(result.trafficChanged,false);
 assert.ok(f.restarted);assert.ok(!f.calls.some(c=>c.route==='/workspace/file'));assert.ok(f.calls.some(c=>c.body?.args?.[1]?.includes('workspaces/acceptance-')));assert.ok(f.calls.some(c=>c.body?.args?.[1]?.includes('fixture_removed')));assert.ok(!JSON.stringify(result).includes(f.options.secret));
});
test('never restarts a serving revision even when it has the verification tag',async()=>{
 const f=fixture({trafficPercent:1});await assert.rejects(verifyStudioRuntimeReplacement(f.options),/SERVING_REVISION_REFUSED/);assert.equal(f.calls.length,0);assert.equal(f.restarted,false);
});
test('never disturbs active user browsers',async()=>{
 const f=fixture({active:1});await assert.rejects(verifyStudioRuntimeReplacement(f.options),/ACTIVE_STATE_REFUSED/);assert.ok(!f.calls.some(c=>c.method==='POST'));assert.equal(f.restarted,false);
});
test('HTTP 200 and recovered-looking responses cannot substitute for a different runtime process',async()=>{
 const f=fixture({unchangedProcess:true});await assert.rejects(verifyStudioRuntimeReplacement(f.options),/PROCESS_REPLACEMENT_UNVERIFIED/);assert.ok(f.calls.some(c=>c.body?.args?.[1]?.includes('fixture_removed')));
});
test('unclassified executions block restart and retain application state',async()=>{
 const f=fixture({userProcesses:1});await assert.rejects(verifyStudioRuntimeReplacement(f.options),/RUNNING_PROCESS_REFUSED/);assert.equal(f.restarted,false);
});
test('rejects arbitrary endpoints before sending any shared credentials',async()=>{
 const f=fixture();await assert.rejects(verifyStudioRuntimeReplacement({...f.options,url:'https://external.example/'}),/CANDIDATE_INVALID/);assert.equal(f.calls.length,0);
});
test('never restarts the shared Admin browser alias even when its canonical traffic is zero',async()=>{
 const f=fixture(),url='https://studio-verify---elevate-studio-browser-fixture.a.run.app';
 await assert.rejects(verifyStudioRuntimeReplacement({...f.options,url,candidateTag:'studio-verify',readTraffic:async()=>[{revisionName:f.options.revision,percent:0,tag:'studio-verify',url},{revisionName:'old',percent:100}]}),/CANDIDATE_INVALID/);
 assert.equal(f.calls.length,0);assert.equal(f.restarted,false);
});
test('rejects a candidate URL belonging to another verification attempt',async()=>{
 const f=fixture();await assert.rejects(verifyStudioRuntimeReplacement({...f.options,candidateTag:'sc-aaaaaaaa-deadbeef'}),/CANDIDATE_INVALID/);assert.equal(f.calls.length,0);
});
test('binds candidate tags to the immutable release commit',async()=>{
 const f=fixture(),candidateTag='sc-bbbbbbbb-1234abcd';
 await assert.rejects(verifyStudioRuntimeReplacement({...f.options,candidateTag,url:f.options.url.replace(f.options.candidateTag,candidateTag)}),/CANDIDATE_INVALID/);assert.equal(f.calls.length,0);
});
