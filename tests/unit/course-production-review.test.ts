import {beforeEach,describe,expect,it,vi} from 'vitest';
import {renderReview} from '@/lib/ultimate-course-builder/authoring/render-review';
const state=vi.hoisted(()=>({review:vi.fn()}));
vi.mock('@/lib/ultimate-course-builder/core/lesson-contract',()=>({assertCompleteLesson:vi.fn(),ULTIMATE_LESSON_CONTRACT_VERSION:'test'}));
// The lookup itself is tested through real version and decision matching below.
import {UltimateReleaseService} from '@/lib/ultimate-course-builder/release/release-service';
function database(decision='approve', mediaPass=true) {
 const filters:unknown[]=[];
 const db={from:(table:string)=>{
  const q={select:()=>q,eq:(...args:unknown[])=>{filters.push([table,...args]);return q;},in:()=>q,order:()=>q,limit:()=>q,
   maybeSingle:async()=>result(),single:async()=>result(),then:(resolve:(v:unknown)=>unknown)=>resolve(result())};
  function result(){return {error:null,data:table==='ultimate_artifacts'?{id:'film'}:table==='ultimate_artifact_versions'?[{id:'new',version:2,content:{render:{videoUrl:'https://media.example/new.mp4'}}},{id:'old',version:1,content:{render:{videoUrl:'https://media.example/old.mp4'}}}]:table==='ultimate_review_decisions'?{action:decision}:table==='ultimate_course_builds'?{id:'build',course_id:'course',status:'built',profile:{publicationPolicy:'owner-review-required',competencies:[{id:'lesson'}]}}:[{id:'lesson-build',lesson_key:'lesson',competency_id:'lesson',status:'built',artifacts:{finished_media_qa:{mediaQA:{pass:mediaPass}},lesson_film_render:{render:{videoUrl:'https://media.example/new.mp4'}}}}]};}
  return q;
 }};return {db,filters};
}
describe('immutable video review and publication',()=>{
 it('still refuses publication when automated media QA fails',async()=>{
  await expect(new UltimateReleaseService(database('pending',false).db as never).derive('build')).rejects.toThrow('ULTIMATE_LESSONS_NOT_RELEASE_READY');
 });
 it('looks up the decision for the exact selected film version',async()=>{
  const {db,filters}=database();
  expect(await renderReview(db as never,'build','lesson-build','https://media.example/new.mp4')).toEqual({artifactVersionId:'new',version:2,decision:'approve',comment:null});
  expect(filters).toContainEqual(['ultimate_review_decisions','artifact_version_id','new']);
 });
 it('does not attach approval to an unknown or regenerated video URL',async()=>{
  expect(await renderReview(database().db as never,'build','lesson-build','https://media.example/third.mp4')).toBeNull();
 });
 it('releases a verified build without a manual decision, including legacy owner-review profiles',async()=>{
  const {db,filters}=database('pending');
  await expect(new UltimateReleaseService(db as never).derive('build')).resolves.toMatchObject({buildId:'build'});
  expect(filters.some((filter:any)=>filter[0]==='ultimate_review_decisions')).toBe(false);
 });
 it('allows release derivation once the same render is approved and automated checks pass',async()=>{
  await expect(new UltimateReleaseService(database().db as never).derive('build')).resolves.toMatchObject({buildId:'build',lessons:[{sourceLessonBuildId:'lesson-build'}]});
 });
});

