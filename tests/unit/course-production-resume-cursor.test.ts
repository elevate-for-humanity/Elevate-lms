import {expect,it,vi} from 'vitest';
import {UltimateJobQueue} from '@/lib/ultimate-course-builder/worker/job-queue';
function database(previous:unknown) {
 const insert=vi.fn();let reads=0;
 const db={rpc:async(name:string,args:any)=>{
  expect(name).toBe('enqueue_ultimate_build_job');
  insert({payload:args.p_payload,monitor:args.p_monitor});
  return {data:[{id:'new-job',status:'queued'}],error:null};
 },from:()=>{
  const q={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,limit:()=>q,
   maybeSingle:async()=>({data:reads++===0?null:previous,error:null})};return q;
 }};return {db,insert};
}
it('Resume preserves the failed job lesson cursor and targeted repair while refreshing the requesting actor',async()=>{
 const {db,insert}=database({status:'failed',monitor:{enabled:true},payload:{nextCompetencyIndex:7,checkpointRepair:{fromStep:'lesson_film_render'},requestedBy:'previous-admin',progress:{phase:'old-phase'}}});
 await new UltimateJobQueue(db as never).enqueue('build',{requestedBy:'current-admin'});
 expect(insert).toHaveBeenCalledWith(expect.objectContaining({payload:{nextCompetencyIndex:7,checkpointRepair:{fromStep:'lesson_film_render'},requestedBy:'current-admin'},monitor:expect.objectContaining({enabled:true,coordinator:'PARIS',agents:expect.objectContaining({PARIS:expect.any(String),ELLIE:expect.any(String),LIZZY:expect.any(String),ZORA:expect.any(String)})})}));
});
it('a finished one-lesson preview does not trap a full-course Resume in preview-only mode',async()=>{
 const {db,insert}=database({status:'completed',payload:{ownerPreview:true,lessonBuildId:'preview-only'},monitor:{enabled:true}});
 await new UltimateJobQueue(db as never).enqueue('build',{requestedBy:'admin'});
 expect(insert.mock.calls[0][0].payload).toEqual({requestedBy:'admin'});
});

it('retains a deferred authenticated checkpoint repair recorded before a pause',async()=>{
 const {db,insert}=database({status:'failed',payload:{nextCompetencyIndex:7},pending_dependency_resume:{nextCompetencyIndex:3,pendingCheckpointRepairs:{lesson:{fromStep:'natural_narration'}}}});
 await new UltimateJobQueue(db as never).enqueue('build',{requestedBy:'admin'});
 expect(insert.mock.calls[0][0].payload).toEqual({nextCompetencyIndex:3,pendingCheckpointRepairs:{lesson:{fromStep:'natural_narration'}},requestedBy:'admin'});
});
