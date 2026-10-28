import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync(new URL('../lib/ai/tools/executor.ts',import.meta.url),'utf8');
const compile=text=>stripTypeScriptTypes(text).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
function fixture(body,{classification='write',httpStatus=200,raw=false}={}) {
  const rows=[],events=[],calls=[];
  const tool={name:'fixture.action',method:'POST',path:'/api/fixture',
    classification,risk:'low',scope:'user',allowedAgents:['PARIS'],
    allowedRoles:['admin'],approvalRequired:false,idempotent:false,
    timeoutMs:5000,retryAttempts:1,audit:true};
  const db={from:()=>({insert:row=>{rows.push(row);return {select:()=>({maybeSingle:async()=>({data:{id:'receipt'}})})};}})};
  const factory=new Function('NextRequest','requireAdminClient','emitPlatformEvent','logger',
    'getPlatformHealth','getGitHubToken','dispatchGoogleDeployment','canAgentUseTool','getAITool','fetch',
    compile(source)+'\nreturn executeRegisteredAITool;');
  const execute=factory(Request,async()=>db,async(_db,event)=>{events.push(event);return {id:'event'};},
    {warn(){},error(){}},async()=>({}),async()=>null,async()=>({}),()=>true,()=>tool,
    async(url,init)=>{calls.push({url,init});return raw
      ? new Response(body,{status:httpStatus,headers:{'content-type':'application/json'}})
      : Response.json(body,{status:httpStatus});});
  return {rows,events,calls,run:()=>execute(tool.name,{},{
    agent:'PARIS',actorId:'operator',actorRoles:['admin'],
    adminOrigin:'https://admin.invalid',appOrigin:'https://app.invalid',
  })};
}
test('HTTP 200 with explicit failure never becomes completed',async()=>{
  for(const body of [{success:false,message:'Not saved'},{ok:false,error:'Not sent'},{status:'failed'},{status:'rejected'},{status:'cancelled'}]){
    const f=fixture(body),result=await f.run();
    assert.equal(result.ok,false);
    assert.equal(result.status,'failed');
    assert.equal(f.rows.at(-1).status,'failed');
    assert.equal(f.events.at(-1).eventType,'ai.tool.failed');
    assert.equal(f.calls.length,1);
  }
});
test('blocked and approval outcomes survive a successful transport response',async()=>{
  for(const status of ['blocked','approval_required']){
    const f=fixture({status}),result=await f.run();
    assert.equal(result.ok,false);
    assert.equal(result.status,status);
    assert.equal(f.rows.at(-1).status,status);
    if(status==='approval_required')assert.equal(f.rows.at(-1).completed_at,null);
  }
});
test('explicit failure takes precedence over HTTP 202 acceptance',async()=>{
  const f=fixture({success:false,error:'Not enqueued'},{httpStatus:202});
  assert.equal((await f.run()).status,'failed');
});
test('malformed JSON cannot create a completed receipt or replay a mutation',async()=>{
  const f=fixture('invalid-json',{raw:true}),result=await f.run();
  assert.equal(result.ok,false);
  assert.equal(result.status,'failed');
  assert.equal(result.error,'Tool returned invalid JSON.');
  assert.equal(f.calls.length,1);
  assert.ok(!f.rows.some(row=>row.status==='completed'));
});
test('all asynchronous write states stay accepted without completion timestamp',async()=>{
  for(const status of ['queued','running','accepted','pending','dispatched','processing','scheduled']){
    const f=fixture({status}),result=await f.run();
    assert.equal(result.ok,true);
    assert.equal(result.status,'accepted');
    assert.equal(f.rows.at(-1).status,'accepted');
    assert.equal(f.rows.at(-1).completed_at,null);
  }
});
test('reading a failed job is a completed read, not a failed action',async()=>{
  const f=fixture({status:'failed',jobId:'job'},{classification:'read'}),result=await f.run();
  assert.equal(result.ok,true);
  assert.equal(result.status,'completed');
});
test('a successful action retains its real payload and completed receipt',async()=>{
  const f=fixture({success:true,id:'saved-record'}),result=await f.run();
  assert.equal(result.ok,true);
  assert.equal(result.status,'completed');
  assert.equal(result.payload.id,'saved-record');
  assert.ok(f.rows.at(-1).completed_at);
});
