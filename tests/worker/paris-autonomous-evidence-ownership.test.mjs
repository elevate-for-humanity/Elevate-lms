import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rememberVerifiedRepairSource,discardChangedRepairSource,repairPlannerObservations}
  from '../../lib/devstudio/paris-source-evidence.mjs';
import {applyOwnedParisRepairTransition} from '../../lib/ai/runtime/paris-owned-transition.mjs';

const sha='a'.repeat(40);
test('verified source evidence survives 13 discovery turns and stays within strict bounds',()=>{
  let evidence=rememberVerifiedRepairSource([],{
    path:'lib/producer.ts',sha,excerpt:'const vulnerable = true;'.repeat(200),
  });
  assert.equal(evidence[0].excerpt.length,2400);
  const diagnostics=Array.from({length:13},(_,i)=>'SEARCH unrelated-'+i);
  const model=repairPlannerObservations(diagnostics,evidence);
  assert.equal(model.length,7);
  assert.match(model.at(-1),/VERIFIED_SOURCE lib\/producer\.ts/);
  assert.match(model.at(-1),/const vulnerable/);
  evidence=rememberVerifiedRepairSource(evidence,{path:'lib/other.ts',sha,excerpt:'second source'});
  evidence=rememberVerifiedRepairSource(evidence,{path:'lib/third.ts',sha,excerpt:'third source'});
  assert.deepEqual(evidence.map(entry=>entry.path),['lib/other.ts','lib/third.ts']);
  evidence=discardChangedRepairSource(evidence,'lib/third.ts');
  assert.equal(evidence.length,1);
  assert.throws(()=>rememberVerifiedRepairSource([],{path:'lib/x.ts',sha:'not-a-sha',excerpt:'x'}),/EVIDENCE_INVALID/);
});
test('only actual source reads are persisted; checkpoint and inference both carry evidence',()=>{
  const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
  assert.match(source,/verifiedSourceExcerpts = rememberVerifiedRepairSource\(verifiedSourceExcerpts,file\)/);
  assert.match(source,/verifiedSourceExcerpts\}\);/);
  assert.match(source,/observations: repairPlannerObservations\(observations,verifiedSourceExcerpts\)/);
  assert.match(source,/verifiedSourceExcerpts = discardChangedRepairSource\(verifiedSourceExcerpts,file\.path\)/);
});
function dbFor(record){
  let row={...record};
  const filters=[];
  const db={from(table){
    assert.equal(table,'paris_code_repairs');
    let patch;
    const query={
      update(values){patch=values;return query;},
      eq(key,value){filters.push([key,value]);return query;},
      select(column){assert.equal(column,'id');return query;},
      async maybeSingle(){
        if(!filters.every(([key,value])=>row[key]===value))return {data:null,error:null};
        row={...row,...patch};
        return {data:{id:row.id},error:null};
      },
    };
    return query;
  }};
  return {db,get:()=>row,filters};
}
test('only signed owning run and exact expected status can transition repair',async()=>{
  const setup=dbFor({id:'repair',workflow_run_id:100,status:'patching'});
  assert.equal(await applyOwnedParisRepairTransition(setup.db,{
    id:'repair',runId:100,expectedStatus:'patching',values:{status:'validating'},now:'2026-11-08T00:00:00Z',
  }),true);
  assert.equal(setup.get().status,'validating');
  assert.equal(setup.get().updated_at,'2026-11-08T00:00:00Z');
  assert.deepEqual(setup.filters.slice(0,3),[
    ['id','repair'],['workflow_run_id',100],['status','patching'],
  ]);
  await assert.rejects(applyOwnedParisRepairTransition(setup.db,{
    id:'repair',runId:99,expectedStatus:'validating',values:{status:'blocked'},
  }),/OWNERSHIP_LOST/);
  assert.equal(await applyOwnedParisRepairTransition(setup.db,{
    id:'repair',runId:100,expectedStatus:'patching',values:{status:'blocked'},allowMissing:true,
  }),false);
  assert.equal(setup.get().status,'validating','late failure cannot overwrite validating');
  await assert.rejects(applyOwnedParisRepairTransition(setup.db,{
    id:'repair',runId:-1,expectedStatus:'validating',values:{status:'verified'},
  }),/TRANSITION_INVALID/);
});
