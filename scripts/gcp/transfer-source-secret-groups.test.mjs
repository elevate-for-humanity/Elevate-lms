import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transferGroups } from './transfer-source-secret-groups.mjs';
function fixture() {
  const payload = 'private-value\nsecond-line';
  const request = async url => ({ ok: true, json: async () => ({ data:
    url.endsWith('/projects') ? [{id:'platform'},{id:'gpu'}] :
    url.endsWith('/secrets') ? [{id:'credentials'}] :
    {secrets:{variables:{TOKEN:payload},files:{key:{data:'private-file'}}}} }) });
  return { payload, request, env:{NORTHFLANK_API_TOKEN:'private-api'} };
}
test('copies detached groups across every project, verifies exact version and logs no payload',async()=>{
  const f=fixture();const stored=new Map();const calls=[];
  const run=(args,input)=>{
    calls.push({args,input});const name=args[2];
    if(args[1]==='describe') {const e=new Error();e.code='not_found';throw e;}
    if(args[1]==='create') return '';
    if(args[2]==='list') return '';
    if(args[2]==='add') {stored.set(args[3],input);return JSON.stringify({name:'projects/p/secrets/'+args[3]+'/versions/7'});}
    if(args[2]==='access') {assert.equal(args[3],'7');return stored.get(args[5]);}
    throw Error('unexpected operation');
  };
  const report=await transferGroups({...f,run});assert.equal(report.passed,true);assert.equal(report.groups.length,2);
  assert.equal(report.sourceDeleted,false);assert.equal(JSON.stringify(report).includes(f.payload),false);
  assert.equal(JSON.stringify(report).includes('private-file'),false);
  for(const raw of stored.values()){assert.equal(JSON.parse(raw).secrets.variables.TOKEN,f.payload);assert.ok(JSON.parse(raw).secrets.files.key);}
});
test('permission errors are reported without exposing CLI diagnostics',async()=>{
  const f=fixture();const report=await transferGroups({...f,run:()=>{const e=new Error(f.payload);e.code='permission_denied';throw e;}});
  assert.equal(report.passed,false);assert.ok(report.groups.every(x=>x.reason==='permission_denied'));
  assert.equal(JSON.stringify(report).includes('private-value'),false);
});
test('an existing different Google payload is never overwritten',async()=>{
  const f=fixture();const mutations=[];
  const run=args=>{if(args[1]==='describe')return 'exists';if(args[2]==='list')return 'versions/2';if(args[2]==='access')return 'different';mutations.push(args);};
  const report=await transferGroups({...f,run});assert.equal(report.passed,false);assert.equal(mutations.length,0);
  assert.ok(report.groups.every(x=>x.reason==='existing_google_payload_differs'));
});
