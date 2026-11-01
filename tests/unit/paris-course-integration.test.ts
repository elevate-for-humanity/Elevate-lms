import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {routeSelectiveRepairs} from '@/lib/ultimate-course-builder/core/repair-router';
import {lessonPreview} from '@/lib/ultimate-course-builder/core/lesson-preview';
import {getAITool} from '@/lib/ai/tools/registry';
import {planAIToolFromCommand} from '@/lib/ai/tools/planner';
it('routes the actual saved freeze failure to rendering rather than repeating QA on the same video',()=>{
 expect(routeSelectiveRepairs([{step:'finished_media_qa',severity:'error',code:'Media quality gate failed',message:'Media quality gate failed: frozen interval 10.60s exceeds 4s'}])).toMatchObject([{step:'lesson_film_render'}]);
});
it('saved video is present in preview without a diagnostic request and is not falsely approved',()=>{
 expect(lessonPreview({lesson_film_render:{render:{mediaUrl:'https://example.com/lesson.mp4'}}})).toMatchObject({videoUrl:'https://example.com/lesson.mp4',mediaApproved:false});
});
it('all four agents inspect the same course state and PARIS uses the governed builder and container',()=>{
 expect(getAITool('courses.status')?.allowedAgents).toEqual(expect.arrayContaining(['PARIS','ELLIE','LIZZY','ZORA']));
 expect(getAITool('courses.generate')?.allowedAgents).toContain('PARIS');
 expect(getAITool('courses.generate')).toMatchObject({approvalRequired:false,allowedRoles:['admin','super_admin']});
 expect(getAITool('courses.publish')?.approvalRequired).toBe(true);
 expect(getAITool('studio.runtime.files')?.allowedAgents).toContain('PARIS');
 expect(planAIToolFromCommand('check course builder progress',{buildId:'build'})).toEqual({name:'courses.status',input:{buildId:'build'}});
});

it('a replacement queue job inherits PARIS monitoring without overwriting its worker payload',async()=>{
 const {UltimateJobQueue}=await import('@/lib/ultimate-course-builder/worker/job-queue');
 let inserted:any;
 const monitor={enabled:true,coordinator:'PARIS',recoveries:1};
 const db:any={rpc:async(name:string,args:any)=>{
  expect(name).toBe('enqueue_ultimate_build_job');
  inserted={monitor:args.p_monitor,payload:args.p_payload};
  return {data:[{id:'new-job'}],error:null};
 },from:(table:string)=>{
  let selection='',mutation=false;
  const q:any={select:(s:string)=>{selection=s;return q;},eq:()=>q,in:()=>q,order:()=>q,limit:()=>q,
   maybeSingle:async()=>({data:selection.split(',').includes('monitor')?{monitor,status:'failed',payload:{nextCompetencyIndex:1}}:null}),
   insert:(value:any)=>{inserted=value;return q;},single:async()=>({data:{id:'new-job'}}),
   update:()=>{mutation=true;return q;},then:(resolve:any)=>resolve({data:mutation?[{id:'build'}]:null,error:null})};return q;
 }};
 await new UltimateJobQueue(db).enqueue('build',{nextCompetencyIndex:2});
 expect(inserted.monitor).toEqual(expect.objectContaining({...monitor,agents:expect.objectContaining({PARIS:expect.any(String),ELLIE:expect.any(String),LIZZY:expect.any(String),ZORA:expect.any(String)})}));
 expect(inserted.payload).toEqual({nextCompetencyIndex:2});
});
