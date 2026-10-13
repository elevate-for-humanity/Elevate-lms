import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/ultimate-course-builder/core/course-profile',()=>({buildUltimateProfile:vi.fn()}));
vi.mock('@/lib/ultimate-course-builder/release/release-service',()=>({UltimateReleaseService:class{}}));
import {DevStudioUltimateCourseControl} from '@/lib/devstudio/ultimate-course-control';
import {buildUltimateProfile} from '@/lib/ultimate-course-builder/core/course-profile';
function database(failure=false,missingJob=false){
 const calls:string[]=[];
 const api={from(table:string){calls.push(table);const q={select(){return q;},eq(){return q;},neq(){return q;},in(){return q;},order(){return q;},limit(){return q;},
  async single(){return {data:table==='courses'?{id:'course',title:'Cosmetology'}:{id:'existing-build',course_id:'course',status:'running'},error:null};},
  async maybeSingle(){return table==='ultimate_build_jobs'?{data:missingJob?null:{id:'existing-job',status:'running'},error:null}:{data:{id:'existing-build',status:'running',current_step:'visual_assignment'},error:failure?new Error('lookup failed'):null};},
  insert(){return {select(){return {async single(){return {data:null,error:new Error('queue write failed')};}}}};}};return q;}};return {api,calls};
}
describe('Studio command to existing Ultimate worker queue',()=>{
 it('reuses the same build, blueprint and active job across commands',async()=>{
  vi.mocked(buildUltimateProfile).mockClear();const {api,calls}=database();
  const result=await new DevStudioUltimateCourseControl(api as never).queueCourse({courseId:'course',programSlug:'cosmetology-apprenticeship',actorId:'admin'});
  expect(result.build.id).toBe('existing-build');expect(result.job.id).toBe('existing-job');
  expect(result.reused).toBe(true);expect(buildUltimateProfile).not.toHaveBeenCalled();
  expect(calls).toContain('ultimate_build_jobs');expect(calls).not.toContain('agentic_build_runs');
 });
 it('propagates build lookup failures instead of creating a duplicate',async()=>{
  const {api}=database(true);await expect(new DevStudioUltimateCourseControl(api as never).queueCourse({courseId:'course',programSlug:'barber-apprenticeship',actorId:'admin'})).rejects.toThrow('lookup failed');
 });
 it('cannot report queued when persistence fails',async()=>{
  const {api}=database(false,true);await expect(new DevStudioUltimateCourseControl(api as never).queue('existing-build','admin')).rejects.toThrow('queue write failed');
 });
});
