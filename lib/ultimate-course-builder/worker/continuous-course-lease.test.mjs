import test from 'node:test';
import assert from 'node:assert/strict';
import {continuousCourseLease,checkpointContinuousLesson} from './continuous-course-lease.mjs';
const course='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
test('continuous production is scoped and bounded; targeted previews remain single lesson',()=>{
  assert.equal(continuousCourseLease(course,{},0),true);
  assert.equal(continuousCourseLease(course,{},90*60_000),false);
  assert.equal(continuousCourseLease(course,{},NaN),false);
  assert.equal(continuousCourseLease('another',{},0),false);
  for(const key of ['ownerPreview','acceptance','competencyId','lessonBuildId'])
    assert.equal(continuousCourseLease(course,{[key]:true},0),false);
});
function database(result){
  const filters=[];let values;
  const q={update:v=>{values=v;return q;},eq:(...v)=>{filters.push(v);return q;},
    gt:(...v)=>{filters.push(['gt',...v]);return q;},is:(...v)=>{filters.push(['is',...v]);return q;},
    select:async()=>result};
  return {db:{from:()=>q},filters,values:()=>values};
}
test('next cursor is saved with all lease fences and without releasing or resetting the claim',async()=>{
  const x=database({data:[{id:'job'}],error:null});
  assert.equal(await checkpointContinuousLesson({db:x.db,jobId:'job',workerId:'worker',generation:7,payload:{nextCompetencyIndex:9}}),true);
  assert.deepEqual(x.values().payload,{nextCompetencyIndex:9});
  for(const key of ['status','lease_owner','lease_expires_at','execution_generation','attempts','pending_dependency_resume'])
    assert.equal(Object.hasOwn(x.values(),key),false);
  for(const filter of [['id','job'],['lease_owner','worker'],['execution_generation',7],['status','running'],['is','pending_dependency_resume',null]])
    assert.ok(x.filters.some(v=>JSON.stringify(v)===JSON.stringify(filter)));
  assert.ok(x.filters.some(v=>v[0]==='gt'&&v[1]==='lease_expires_at'));
});
test('unacknowledged checkpoints or concurrent wakeups never authorize continuation',async()=>{
  const x=database({data:[],error:null});
  assert.equal(await checkpointContinuousLesson({db:x.db}),false);
  const failed=database({data:null,error:new Error('timeout')});
  await assert.rejects(checkpointContinuousLesson({db:failed.db}),/timeout/);
});
