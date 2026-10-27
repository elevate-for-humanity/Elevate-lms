import {describe,expect,it,vi} from 'vitest';
import {UltimateLmsPublisher} from '@/lib/ultimate-course-builder/release/lms-publisher';
vi.mock('@/lib/ultimate-course-builder/core/lesson-contract',()=>({assertCompleteLesson:vi.fn()}));
vi.mock('@/lib/ultimate-course-builder/release/lms-package',()=>({validateLmsCoursePackage:()=>({pass:true,missing:[]})}));
describe('single canonical publication owner',()=>{
 it('cannot publish a bare legacy package through separate lesson/course writes',async()=>{
  const from=vi.fn(()=>{throw Error('unexpected nontransactional write');});
  const publisher=new UltimateLmsPublisher({from} as never);
  await expect(publisher.publish('course',{lessons:[{contractArtifacts:{}}]} as never)).rejects.toThrow('ULTIMATE_ATOMIC_RELEASE_REQUIRED');
  expect(from).not.toHaveBeenCalled();
 });
});
