import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/ultimate-course-builder/credential/appendix-a-source',()=>({UltimateAppendixAStandardsSource:class {supports(){return false;}}}));
import {buildUltimateProfile} from '@/lib/ultimate-course-builder/core/course-profile';
function dbWithLesson(failure=false) {
 return {from(table:string){let columns=''; const q={select(value:string){columns=value;return q;},eq(){return q;},limit(){return q;},async maybeSingle(){return {data:null,error:failure?new Error('database unavailable'):null};},order(){return table==='apprenticeship_standard_versions'?q:Promise.resolve({data:[{id:'lesson-1',title:'Client consultation',learning_objectives:['Ask before proceeding'],content:{html:'Pause the service and consult the supervisor.',scenario:{correctAction:'consult'}}}],error:null});}};return q;}};
}
describe('shared Ultimate profile used by Studio and builder',()=>{
 it('preserves lesson-scoped instructional content and canonical lesson identities',async()=>{
  const p=await buildUltimateProfile(dbWithLesson() as never,{courseId:'course',programSlug:'cosmetology-apprenticeship',title:'Cosmetology'});
  expect(p.competencies[0].id).toBe('lesson-1');
  expect(p.instructionalSources?.[0]?.id).toBe('course-lesson:lesson-1');
  expect(p.instructionalSources?.[0]?.text).toContain('Pause the service and consult the supervisor.');
  expect(p.instructionalSources?.[0]?.text).toContain('"correctAction":"consult"');
 });
 it('propagates source lookup failure instead of constructing an empty successful request',async()=>{
  await expect(buildUltimateProfile(dbWithLesson(true) as never,{courseId:'course',programSlug:'business-administration',title:'Business'})).rejects.toThrow('database unavailable');
 });
});
