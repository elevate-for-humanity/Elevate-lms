import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({auth:vi.fn(),db:vi.fn(),limit:vi.fn(),enqueue:vi.fn()}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:mocks.auth}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:mocks.db}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:mocks.limit}));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue',()=>({UltimateJobQueue:class{enqueue=mocks.enqueue}}));
import {POST as run} from '@/apps/admin/app/api/admin/ultimate-course-builder/run/route';
import {POST as pause} from '@/apps/admin/app/api/admin/ultimate-course-builder/pause/route';
import {POST as review} from '@/apps/admin/app/api/admin/ultimate-course-builder/review/route';
const id='11111111-1111-4111-8111-111111111111';
const request=(body:unknown)=>new NextRequest('https://admin.example/api',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();mocks.auth.mockResolvedValue({id:'admin'});});
describe('authenticated production controls',()=>{
 it.each([pause,review])('denies unauthenticated writes before opening the database',async endpoint=>{
  mocks.auth.mockResolvedValue({error:new Response(null,{status:401})});
  expect((await endpoint(request({buildId:id}))).status).toBe(401);expect(mocks.db).not.toHaveBeenCalled();
 });
 it('records pause actor without replacing checkpoints, job payload, lease or lifecycle',async()=>{
  const update=vi.fn();const filters:unknown[]=[];
  const q={select:()=>q,eq:(...args:unknown[])=>{filters.push(args);return q;},single:async()=>({data:{id,status:'running',profile:{competencies:[{id:'saved'}]}},error:null}),update:(value:unknown)=>{update(value);return q;},then:(resolve:(v:unknown)=>unknown)=>resolve({data:[{id}],error:null})};
  const from=vi.fn(()=>q);mocks.db.mockResolvedValue({from});
  const response=await pause(request({buildId:id}));expect(response.status).toBe(200);
  expect(update.mock.calls[0][0]).toMatchObject({profile:{ownerPaused:true,competencies:[{id:'saved'}],pauseResumeAudit:{pausedBy:'admin',action:'explicit-admin-pause'}}});
  expect(update.mock.calls[0][0]).not.toHaveProperty('status');
  expect(from.mock.calls.every(([table])=>table==='ultimate_course_builds')).toBe(true);
  expect(filters).toContainEqual(['profile',JSON.stringify({competencies:[{id:'saved'}]})]);
 });
 it('rejects malformed review identity before opening the database',async()=>{
  expect((await review(request({buildId:id,lessonBuildId:id,artifactVersionId:'wrong',action:'approve'}))).status).toBe(400);
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it('stores an append-only decision against the scoped immutable version',async()=>{
  const inserted=vi.fn();const reads:unknown[]=[];
  mocks.db.mockResolvedValue({from:(table:string)=>{
   const q={select:()=>q,eq:(...args:unknown[])=>{reads.push([table,...args]);return q;},single:async()=>({data:table==='ultimate_artifacts'?{id:'artifact'}:{id,version:7,content:{render:{videoUrl:'https://media.example/exact.mp4'}}},error:null}),insert:async(value:unknown)=>{inserted(value);return {error:null};}};return q;
  }});
  const response=await review(request({buildId:id,lessonBuildId:id,artifactVersionId:id,action:'approve'}));
  expect(response.status).toBe(200);expect(inserted).toHaveBeenCalledWith({artifact_version_id:id,action:'approve',reviewer_id:'admin',comment:null});
  expect(reads).toContainEqual(['ultimate_artifacts','build_id',id]);expect(reads).toContainEqual(['ultimate_artifacts','lesson_build_id',id]);
  expect(reads).toContainEqual(['ultimate_artifact_versions','artifact_id','artifact']);
 });
});

it('Resume clears an explicit pause while preserving a freshly leased worker instead of launching a duplicate',async()=>{
 const update=vi.fn();
 const q={select:()=>q,eq:()=>q,in:()=>q,update:(v:unknown)=>{update(v);return q;},single:async()=>({data:{id,status:'running',profile:{ownerPaused:true,competencies:[{id:'saved'}]}},error:null}),then:(resolve:(v:unknown)=>unknown)=>resolve({data:[{id}],error:null})};
 mocks.db.mockResolvedValue({from:()=>q});
 mocks.enqueue.mockResolvedValue({id,status:'running',lease_owner:'assigned-worker',lease_expires_at:new Date(Date.now()+300000).toISOString(),heartbeat_at:new Date().toISOString()});
 const response=await run(request({buildId:id}));expect(response.status).toBe(200);
 expect(await response.json()).toMatchObject({alreadyRunning:true,executionVerified:true});
 expect(update).toHaveBeenCalledWith(expect.objectContaining({profile:expect.objectContaining({ownerPaused:false,pauseResumeAudit:expect.objectContaining({resumedBy:'admin'})})}));
 expect(mocks.enqueue).toHaveBeenCalledTimes(1);
});
it('does not certify execution from an ownerless lease even when its heartbeat is fresh',async()=>{
 const q={select:()=>q,eq:()=>q,in:()=>q,single:async()=>({data:{id,status:'running',profile:{ownerPaused:false}},error:null})};
 mocks.db.mockResolvedValue({from:()=>q});
 mocks.enqueue.mockResolvedValue({id,status:'running',lease_owner:null,lease_expires_at:new Date(Date.now()+300000).toISOString(),heartbeat_at:new Date().toISOString()});
 const response=await run(request({buildId:id}));expect(response.status).toBe(409);
 expect(await response.json()).not.toHaveProperty('executionVerified');
});
