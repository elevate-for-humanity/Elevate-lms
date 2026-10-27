import test from 'node:test';
import assert from 'node:assert/strict';
import {repairScope,validateInstance,guardResult,VM_PERMISSIONS,CLOUD_SCOPE,INSTANCE} from './repair-pbx-scope.mjs';
const startup='#!/bin/bash\n# preserved bootstrap\n';
function fixture({missing=false,failSet=false,concurrent=false,active=false}={}){
  const vm={id:'1',name:'elevate-pbx',status:'RUNNING',zone:'https://compute.googleapis.com/compute/v1/projects/elegant-racer-299721/zones/us-central1-a',
    networkInterfaces:[{accessConfigs:[{natIP:'107.178.216.162'}]}],metadata:{fingerprint:'one',items:[{key:'startup-script',value:startup}]},
    serviceAccounts:[{email:'pbx@elegant-racer-299721.iam.gserviceaccount.com',scopes:['https://www.googleapis.com/auth/logging.write']}]};
  const addresses={items:[{address:'107.178.216.162',addressType:'EXTERNAL',status:'IN_USE',users:[INSTANCE]}]};
  const mutations=[];let reads=0;let guardCalls=0;
  const request=async(url,init={})=>{
    if(url===INSTANCE){reads++;if(concurrent && reads===2)vm.metadata.items.push({key:'unreviewed-setting',value:'changed'});return structuredClone(vm);}
    if(url.endsWith('/regions/us-central1/addresses'))return addresses;
    if(url.endsWith('/testIamPermissions'))return {permissions:missing?[]:VM_PERMISSIONS};
    if(url.endsWith(':testIamPermissions'))return {permissions:['iam.serviceAccounts.actAs']};
    if(url.includes('/operations/'))return {status:'DONE'};
    if(url.endsWith('/stop')){mutations.push('stop');vm.status='TERMINATED';return {name:'stop-1'};}
    if(url.endsWith('/setServiceAccount')){
      mutations.push('set');if(failSet)throw Error('google_http_403');
      vm.serviceAccounts=[JSON.parse(init.body)];return {name:'set-1'};
    }
    if(url.endsWith('/start')){mutations.push('start');vm.status='RUNNING';return {name:'start-1'};}
    return {commonInstanceMetadata:{items:[]}};
  };
  const guard=async()=>{guardCalls++;return {result:'PASS',activeCalls:active?1:0,endpoints:0,containers:[{id:'fixed-image-container'}],configurationSha256:'fixed-hash'};};
  return {vm,addresses,mutations,request,guard,startup,apply:true,wait:async()=>{},get guardCalls(){return guardCalls;}};
}
test('missing scope permissions cause no restart or remote mutation',async()=>{
  const f=fixture({missing:true});const result=await repairScope(f);
  assert.equal(result.result,'BLOCKED');assert.deepEqual(result.missing,VM_PERMISSIONS);
  assert.deepEqual(f.mutations,[]);assert.equal(f.guardCalls,0);
});
test('preserves existing scopes, identity, containers and configuration during idle scope repair',async()=>{
  const f=fixture();const result=await repairScope(f);
  assert.equal(result.result,'PASS');assert.equal(result.changed,true);
  assert.deepEqual(f.mutations,['stop','set','start']);
  assert.deepEqual(f.vm.serviceAccounts[0].scopes,['https://www.googleapis.com/auth/logging.write',CLOUD_SCOPE]);
  assert.equal(f.guardCalls,2);
});
test('failed scope update still starts the original VM',async()=>{
  const f=fixture({failSet:true});await assert.rejects(repairScope(f),/google_http_403/);
  assert.deepEqual(f.mutations,['stop','set','start']);assert.equal(f.vm.status,'RUNNING');
  assert.equal(f.vm.serviceAccounts[0].scopes.includes(CLOUD_SCOPE),false);
});
test('no restart when active calls or concurrent metadata change appear',async()=>{
  for(const options of [{active:true},{concurrent:true}]){
    const f=fixture(options);await assert.rejects(repairScope(f));assert.deepEqual(f.mutations,[]);
  }
});
test('unreserved IP, changed bootstrap, or unexpected VM cannot be restarted',()=>{
  const f=fixture();
  assert.throws(()=>validateInstance(f.vm,{}, {items:[]},startup),/reserved_ip/);
  assert.throws(()=>validateInstance(f.vm,{},f.addresses,'#!/bin/bash\nother'),/startup_guard/);
  assert.throws(()=>validateInstance({...f.vm,name:'another'},{},f.addresses,startup),/identity/);
});
test('already scoped VM is not restarted',async()=>{
  const f=fixture();f.vm.serviceAccounts[0].scopes.push(CLOUD_SCOPE);
  const result=await repairScope(f);assert.equal(result.result,'PASS');assert.equal(result.changed,false);assert.deepEqual(f.mutations,[]);
});
test('remote guard failures retain exact allowlisted causes without leaking CLI output',()=>{
  assert.throws(()=>guardResult({status:1,stdout:'PBX_RESTART_GUARD '+JSON.stringify({result:'BLOCKED',code:'configured_endpoints_require_maintenance_review'})}),/configured_endpoints_require_maintenance_review/);
  assert.throws(()=>guardResult({status:1,stdout:'private credentials',stderr:'Permission denied: private details'}),/^Error: restart_guard_permission_denied$/);
});
test('SSH key-generation banners do not hide a successful explicit guard record',()=>{
  const evidence={result:'PASS',activeCalls:0,endpoints:0};
  const stdout='Generating public/private rsa key pair.\nPBX_RESTART_GUARD '+JSON.stringify(evidence)+'\n';
  assert.deepEqual(guardResult({status:0,stdout,stderr:'WARNING: The private SSH key file for gcloud does not exist.'}),evidence);
  assert.throws(()=>guardResult({status:0,stdout:stdout+stdout}),/ambiguous_evidence/);
  assert.throws(()=>guardResult({status:0,stdout:'PBX_RESTART_GUARD invalid JSON\n'}),/restart_guard_command_failed/);
});
