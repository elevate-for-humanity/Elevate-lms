import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStudioConnectedRuntime} from './verify-studio-connected-runtime.mjs';
const sha='a'.repeat(40),url='https://elevate-studio-browser-example-uc.a.run.app';
function fixture(overrides={}){
 const key='test-key-no-production-access';
 const revision=(name)=>({metadata:{name:name+'-00001-aaa',labels:{'serving.knative.dev/service':name}},spec:{containers:[{env:[{name:'STUDIO_BROWSER_SECRET',value:key},{name:'GIT_SHA',value:sha},...(name.includes('admin')?[{name:'STUDIO_BROWSER_URL',value:overrides.binding??url},{name:'STUDIO_BROWSER_PUBLIC_URL',value:url}]:[])]}]}});
 const calls=[];
 const run=args=>{
  if(args[1]==='services')return JSON.stringify({metadata:{name:args[3]},status:{url,traffic:[{revisionName:args[3]+'-00001-aaa',percent:100}]}});
  const name=args[3].startsWith('elevate-admin')?'elevate-admin-migration':'elevate-studio-browser';
  const r=revision(name);if(overrides.keyMismatch&&name.includes('admin'))r.spec.containers[0].env[0].value='different-test-key-no-production-access';
  return JSON.stringify(r);
 };
 const request=async(address,options={})=>{
  calls.push({address,options});
  if(address.includes('admin.elevate'))return Response.json({healthy:true,ready:true,revision:'elevate-admin-migration-00001-aaa',dependencies:{supabase:{ok:true}}});
  if(address.endsWith('/health'))return Response.json({ready:true,commit:overrides.commit??sha,providerAuthStorage:{persistent:true},workspaceRecovery:{ready:true,storage:{persistent:overrides.persistent??true}},browserWorkspaceRecovery:{persistent:true},terminalRecovery:{persistent:true}});
  if(address.endsWith('/workspace/files'))return new Response('{}',{status:options.headers?200:overrides.anonymous??401});
  return Response.json({passed:overrides.foundation??true,commit:sha,checks:[{name:'keyboard_and_pointer',passed:true}]});
 };
 return {run,request,calls,key};
}
test('connects serving Admin binding, both credentials, persistence, workspace permissions and browser controls',async()=>{
 const f=fixture(),result=await verifyStudioConnectedRuntime(f);
 assert.equal(result.passed,true);assert.equal(result.browserCommit,sha);assert.equal(result.adminBinding,true);
 assert.ok(!JSON.stringify(result).includes(f.key));
 assert.ok(f.calls.some(c=>c.address.endsWith('/foundation-test')&&c.options.method==='POST'));
});
test('a healthy browser cannot certify an Admin revision bound to another service',async()=>{
 const f=fixture({binding:'https://other.run.app'});await assert.rejects(verifyStudioConnectedRuntime(f),/BINDING_NOT_SERVING/);assert.equal(f.calls.length,0);
});
test('different Admin and browser keys fail before any credential is transmitted',async()=>{
 const f=fixture({keyMismatch:true});await assert.rejects(verifyStudioConnectedRuntime(f),/KEY_MISMATCH/);assert.equal(f.calls.length,0);
});
for(const [overrides,error] of [[{persistent:false},/STORAGE_OR_REVISION/],[{commit:'b'.repeat(40)},/STORAGE_OR_REVISION/],[{anonymous:200},/ANONYMOUS_WORKSPACE_EXPOSED/],[{foundation:false},/FOUNDATION_FAILED/]]){
 test('rejects incomplete connected evidence '+JSON.stringify(overrides),async()=>{await assert.rejects(verifyStudioConnectedRuntime(fixture(overrides)),error);});
}
