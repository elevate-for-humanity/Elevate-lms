import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/ultimate-course-builder/credential/appendix-a-source',()=>({UltimateAppendixAStandardsSource:class {
 supports(input:{programSlug:string}){return input.programSlug==='registered-course';}
 async load(){return {id:'registered',title:'Registered',authority:'DOL',standardVersion:'1',sourceDocuments:['Appendix A'],competencies:[{id:'lesson-1',title:'Client consultation',description:'Consult before proceeding',type:'practical_skill',authorityRequirementIds:['lesson-1'],requiresDemonstration:true,requiresPracticalEvidence:true}]};}
}}));
import {buildUltimateProfile, hydrateUltimateProfileSources} from '@/lib/ultimate-course-builder/core/course-profile';
function dbWithLesson(failure=false, content:any={html:'Pause the service and consult the supervisor.',scenario:{correctAction:'consult'}}) {
 return {from(table:string){let columns=''; const q={select(value:string){columns=value;return q;},eq(){return q;},or(){return q;},limit(){return q;},async maybeSingle(){return {data:null,error:failure?new Error('database unavailable'):null};},order(){return table==='apprenticeship_standard_versions'?q:Promise.resolve({data:[{id:'lesson-1',title:'Client consultation',learning_objectives:['Ask before proceeding'],content}],error:null});}};return q;}};
}
describe('shared Ultimate profile used by Studio and builder',()=>{
 it('preserves an explicitly approved reference and presentation during resume',async()=>{
  const reference={assetId:'9ae74de2-2fd2-45df-9c54-59c9e3c5c07c',sha256:'a'.repeat(64)};
  const profile={id:'owner-course',sourcePolicy:'frozen-reference-v1',competencies:[],lessonPresentation:'approved-premium-v1',presentationContract:{approvedReferenceVideo:reference}};
  const result=await hydrateUltimateProfileSources(dbWithLesson() as never,'owner-course',profile as never);
  expect(result.lessonPresentation).toBe('approved-premium-v1');
  expect(result.presentationContract?.approvedReferenceVideo).toEqual(reference);
 });
 it('teaches the current correction while retaining historical evidence in storage',async()=>{
  const content={html:'Follow the product label contact time.',production_content_repairs:[{previous_html:'Incorrect archived contact time.'}],previous_sanitation_html:'Incorrect archived instruction.'};
  const p=await buildUltimateProfile(dbWithLesson(false,content) as never,{courseId:'course',programSlug:'registered-course',title:'Registered course'});
  const source=p.instructionalSources?.[0]?.text;
  expect(source).toContain('Follow the product label contact time.');
  expect(source).not.toContain('Incorrect archived');
  expect(content.production_content_repairs).toHaveLength(1);
 });
 it('preserves lesson-scoped instructional content and canonical lesson identities',async()=>{
  const p=await buildUltimateProfile(dbWithLesson() as never,{courseId:'course',programSlug:'cosmetology-apprenticeship',title:'Cosmetology'});
  expect(p.competencies[0].id).toBe('lesson-1');
  expect(p.instructionalSources?.[0]?.id).toBe('course-lesson:lesson-1');
  expect(p.instructionalSources?.[0]?.text).toContain('Pause the service and consult the supervisor.');
  expect(p.instructionalSources?.[0]?.text).toContain('"correctAction":"consult"');
 });
 it('hydrates the registered profile from its matching canonical LMS lesson',async()=>{
  const p=await buildUltimateProfile(dbWithLesson() as never,{courseId:'course',programSlug:'registered-course',title:'Registered course'});
  expect(p.sourceDocuments).toEqual(['Appendix A']);
  expect(p.instructionalSources?.[0]?.id).toBe('course-lesson:lesson-1');
  expect(p.instructionalSources?.[0]?.text).toContain('Pause the service and consult the supervisor.');
 });
 it('propagates source lookup failure instead of constructing an empty successful request',async()=>{
  await expect(buildUltimateProfile(dbWithLesson(true) as never,{courseId:'course',programSlug:'business-administration',title:'Business'})).rejects.toThrow('database unavailable');
 });
});
