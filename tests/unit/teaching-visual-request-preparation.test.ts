import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks=vi.hoisted(()=>({selected:vi.fn(),reference:vi.fn()}));
vi.mock('@/lib/ultimate-course-builder/adapters/selected-course-stills.mjs',()=>({courseSelectedStill:mocks.selected}));
vi.mock('@/lib/ultimate-course-builder/adapters/approved-reference-photos.mjs',()=>({approvedReferencePhotoPicker:mocks.reference}));
import {prepareTeachingPhotos} from '@/lib/ultimate-course-builder/adapters/teaching-photos';
import {bindTeachingPhotoAssignments} from '@/lib/ultimate-course-builder/adapters/teaching-photo-assignments.mjs';
function fixture(){
 const scene={id:'ownership',dialogue:'Compare ownership and responsibility.',teachingVisual:{steps:[{label:'Ownership',value:'Compare ownership and responsibility.',narrationQuote:'Compare ownership and responsibility.'}]}};
 return {lessonId:'lesson',courseTitle:'Business',artifacts:{storyboard:{storyboard:{scenes:[scene]}},visual_assignment:{media:{readyAssets:[],assignments:[{sceneId:scene.id,assetId:'instructional-visual-request:'+scene.id,assignmentMethod:'instructional-visual-request',requestedInstructionalVisual:true}]}}}};
}
function database(){
 const q={data:[],error:null,select(){return q;},eq(){return q;}};
 return {from:()=>q} as unknown as Parameters<typeof prepareTeachingPhotos>[1];
}
beforeEach(()=>{
 vi.resetAllMocks();mocks.reference.mockResolvedValue(null);
 mocks.selected.mockImplementation(async(_input,_db,_scene,index,step)=>({
  imageUrl:'https://media.example/verified-'+index+'.jpg',storagePath:'approved-teaching-photos/'+index+'.jpg',
  sha256:String(index+1).repeat(64),narrationQuote:step.narrationQuote,provider:'envato',illustration:true,
 }));
});
describe('shared visual request preparation',()=>{
 it('materializes a non-premium scene request using the existing selected course assets',async()=>{
  const input=fixture();const prepared=await prepareTeachingPhotos(input,database());
  expect(mocks.reference).not.toHaveBeenCalled();expect(mocks.selected).toHaveBeenCalledTimes(2);
  expect(prepared.teachingPhotos.ownership).toHaveLength(2);
  expect(prepared.teachingPhotos.ownership.every((photo:{isRecap:boolean})=>photo.isRecap===false)).toBe(true);
  const bound=bindTeachingPhotoAssignments(prepared);
  expect(bound.artifacts.visual_assignment.media.readyAssets).toHaveLength(1);
  expect(bound.artifacts.visual_assignment.media.assignments[0].assetId).not.toBe('instructional-visual-request:ownership');
  expect(input.artifacts.visual_assignment.media.readyAssets).toEqual([]);
 });
 it('does not process scenes already assigned to licensed media',async()=>{
  const input=fixture();input.artifacts.storyboard.storyboard.scenes.push({id:'licensed-scene',dialogue:'Existing licensed footage',teachingVisual:{steps:[]}});
  const prepared=await prepareTeachingPhotos(input,database());
  expect(Object.keys(prepared.teachingPhotos)).toEqual(['ownership']);
 });
 it('leaves courses without a shared request untouched',async()=>{
  const input=fixture();input.artifacts.visual_assignment.media.assignments=[];
  expect(await prepareTeachingPhotos(input,database())).toBe(input);expect(mocks.selected).not.toHaveBeenCalled();
 });
 it('retains the premium recap requirement',async()=>{
  await expect(prepareTeachingPhotos({...fixture(),lessonPresentation:'approved-premium-v1'},database())).rejects.toThrow('TEACHING_MOMENT_RECAP_REQUIRED');
 });
 it('preserves a licensing failure instead of substituting an unverified image',async()=>{
  mocks.selected.mockRejectedValue(new Error('LICENSE_APPROVAL_REQUIRED'));
  await expect(prepareTeachingPhotos(fixture(),database())).rejects.toThrow('LICENSE_APPROVAL_REQUIRED');
 });
});
