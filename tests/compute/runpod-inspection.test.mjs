import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRunpod} from '../../scripts/compute/inspect-runpod.mjs';

const key = 'fixture-runpod-key-not-a-real-credential';
const page = (name,items) => ({[name]:items,pagination:{hasNextPage:false,nextCursor:null}});
function fixture(url) {
  switch (new URL(url).pathname) {
    case '/v2/pods': return page('pods',[{id:'pod-one',name:'PARIS',status:'EXITED',cost:0.59,env:{PRIVATE_TOKEN:'must-not-appear'},args:'secret-command',gpu:{id:'NVIDIA A40',count:1}}]);
    case '/v2/serverless': return page('endpoints',[{id:'endpoint-one',name:'course',env:{TOKEN:'must-not-appear'}}]);
    case '/v2/network-volumes': return page('networkVolumes',[{id:'volume-one',name:'workspace',size:50,dataCenter:'US-KS-2',type:'STANDARD'}]);
    case '/v2/catalog/cpus': return {cpus:[{id:'cpu3g',name:'General',vcpu:{min:2,max:32},ramGbPerVcpu:4,price:{securePerVcpu:0.04},availability:'HIGH'}]};
    case '/v2/catalog/gpus': return {gpus:[{id:'NVIDIA A40',memory:48,secure:true,price:{secure:0.59},availability:'HIGH'},{id:'too-large',memory:80,secure:true}]};
    default: throw Error('unexpected endpoint');
  }
}
test('inspection uses only fixed RunPod v2 GETs and excludes credentials from receipts',async()=>{
  const calls=[];
  const result=await inspectRunpod({apiKey:key,request:async(url,options)=>{
    calls.push([url,options]); assert.equal(url.origin,'https://api.runpod.io');
    assert.equal(options.method,'GET'); assert.equal(options.redirect,'error');
    assert.equal(options.headers.Authorization,`Bearer ${key}`);
    return Response.json(fixture(url));
  }});
  assert.equal(calls.length,5); assert.equal(result.resourcesCreated,0); assert.equal(result.productionActivated,false);
  assert.equal(result.pods[0].quotedComputeUsdPerHour,0.59); assert.equal(result.pods[0].status,'EXITED');
  assert.equal(result.cpuOptions[0].usdPerVcpuHour,0.04); assert.equal(result.gpuOptions.length,1);
  assert.doesNotMatch(JSON.stringify(result),/must-not-appear|secret-command|fixture-runpod-key|Authorization/);
  const gpuUrl=calls.find(([url])=>url.pathname.endsWith('/gpus'))[0];
  assert.equal(gpuUrl.searchParams.get('countryCodes'),'US');
  assert.equal(gpuUrl.searchParams.get('count'),'1');
});
test('missing key fails before any request',async()=>{
  let calls=0;
  await assert.rejects(inspectRunpod({request:async()=>{calls++;}}),/KEY_REQUIRED/);
  assert.equal(calls,0);
});
test('pagination is complete and cursor content cannot change the destination',async()=>{
  const cursor='https://elsewhere.invalid/?key=private'; let pages=0;
  const result=await inspectRunpod({apiKey:key,request:async(url)=>{
    assert.equal(url.origin,'https://api.runpod.io');
    if(url.pathname==='/v2/pods'){
      pages++;
      if(!url.searchParams.has('cursor'))return Response.json({pods:[{id:'first'}],pagination:{hasNextPage:true,nextCursor:cursor}});
      assert.equal(url.searchParams.get('cursor'),cursor);return Response.json(page('pods',[{id:'second'}]));
    }
    return Response.json(fixture(url));
  }});
  assert.equal(pages,2); assert.deepEqual(result.pods.map(p=>p.id),['first','second']);
});
test('denied access does not leak raw provider errors or key values',async()=>{
  await assert.rejects(inspectRunpod({apiKey:key,request:async()=>new Response(key,{status:403})}),error=>{
    assert.equal(error.message,'RUNPOD_INSPECTION_HTTP_403');return true;
  });
});
test('network failures are redacted and not retried',async()=>{
  let calls=0;
  await assert.rejects(inspectRunpod({apiKey:key,request:async()=>{calls++;throw Error(key);}}),/REQUEST_FAILED/);
  assert.equal(calls,5);
});
test('invalid lists and repeating cursors cannot certify an empty account',async()=>{
  for(const invalid of [{pods:[]},{pods:[],pagination:{hasNextPage:true,nextCursor:'same'}}]){
    await assert.rejects(inspectRunpod({apiKey:key,request:async(url)=>Response.json(url.pathname==='/v2/pods'?invalid:fixture(url))}),/INVALID_PAGE|INVALID_CURSOR/);
  }
});
