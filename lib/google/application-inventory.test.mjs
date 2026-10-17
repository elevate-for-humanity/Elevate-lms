import test from 'node:test';
import assert from 'node:assert/strict';
import {getApplicationInventory,summarizeApplication} from './application-inventory.mjs';
test('serving resources come from actual revisions and omit all runtime secrets',()=>{
 const name='projects/p/locations/r/services/store/revisions/ready';
 const result=summarizeApplication({kind:'service',name:'store',region:'r',template:{containers:[{resources:{limits:{cpu:'1',memory:'2Gi'}}}]},trafficStatuses:[{revision:name,percent:100}],terminalCondition:{state:'CONDITION_SUCCEEDED'}},[{name,containers:[{resources:{limits:{cpu:'4',memory:'8Gi'}},env:[{name:'SECRET',value:'private-credential'},{name:'NF_GIT_SHA',value:'a'.repeat(40)}]}]}]);
 assert.equal(result.serving[0].cpu,'4');assert.equal(result.serving[0].memory,'8Gi');assert.equal(result.serving[0].commit,'a'.repeat(40));
 assert.equal(result.observedUsage,null);assert.equal(result.ready,true);assert.equal(JSON.stringify(result).includes('private-credential'),false);
});
test('metadata failure returns unknown applications without querying external APIs',async()=>{
 let calls=0;const result=await getApplicationInventory({request:async()=>{calls++;throw Error('sensitive internal detail');}});
 assert.equal(calls,1);assert.equal(result.applications.length,0);assert.equal(result.expected[0].status,'inventory_unavailable');
 assert.equal(JSON.stringify(result).includes('sensitive internal detail'),false);
});
test('inventory uses GET only and distinguishes absent deployments from incomplete inventory',async()=>{
 const calls=[];
 const result=await getApplicationInventory({request:async(url,options)=>{
  calls.push({url,options});
  if(url.startsWith('http://metadata.'))return new Response(JSON.stringify({access_token:'private-token'}),{headers:{'Metadata-Flavor':'Google'}});
  if(url.includes('/us-east1/'))return new Response('{}',{status:403});
  return new Response(JSON.stringify({services:[],jobs:[]}));
 }});
 assert.equal(calls.length,5);assert.ok(calls.every(c=>!c.options.method&&!c.options.body));
 assert.equal(result.expected.find(r=>r.label==='Legacy 83').status,'not_verified');assert.equal(result.failures.length,2);
 assert.equal(JSON.stringify(result).includes('private-token'),false);
});

test('serving revision identity recognizes the actual Google container commit variables',()=>{
 for(const key of ['GIT_SHA','GITHUB_SHA','NEXT_PUBLIC_GIT_SHA']){
  const name='projects/p/locations/r/services/store/revisions/ready';
  const result=summarizeApplication({kind:'service',name:'store',trafficStatuses:[{revision:name,percent:100}]},[{name,containers:[{env:[{name:key,value:'c'.repeat(40)}]}]}]);
  assert.equal(result.serving[0].commit,'c'.repeat(40));
 }
});
