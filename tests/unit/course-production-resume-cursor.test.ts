import {expect,it,vi} from 'vitest';
import {UltimateJobQueue} from '@/lib/ultimate-course-builder/worker/job-queue';
function database(previous:unknown) {
 const insert=vi.fn();let reads=0;
 const db={from:(table:string)=>{
  const q={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,limit:()=>q,
   maybeSingle:async()=>({data:reads++===0?null:previous,error:null}),
   insert:(value:unknown)=>{insert(value);return q;},
   single:async()=>({data:{id:'new-job'},error:null}),update:()=>q,
   then:(resolve:(v:unknown)=>unknown)=>resolve({error:null})};return q;
 }};return {db,insert};
}
it('Resume preserves the failed job lesson cursor and targeted repair while refreshing the requesting actor',async()=>{
 const {db,insert}=database({status:'failed',monitor:{enabled:true},payload:{nextCompetencyIndex:7,checkpointRepair:{fromStep:'lesson_film_render'},requestedBy:'previous-admin',progress:{phase:'old-phase'}}});
 await new UltimateJobQueue(db as never).enqueue('build',{requestedBy:'current-admin'});
 expect(insert).toHaveBeenCalledWith(expect.objectContaining({payload:{nextCompetencyIndex:7,checkpointRepair:{fromStep:'lesson_film_render'},requestedBy:'current-admin'},monitor:{enabled:true}}));
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
