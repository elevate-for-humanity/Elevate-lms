import {describe,it,expect} from 'vitest';
import {nextCourseWork} from '@/lib/ultimate-course-builder/worker/course-cursor';
const result=(id:string,passed:boolean,remaining:boolean,index:number)=>({completed:passed,hasRemaining:remaining,nextIndex:index,lessons:[{competencyId:id}]});
describe('durable course queue fairness',()=>{
 it('continues past one failed lesson and defers its repair',()=>{
  const work=nextCourseWork({},result('a',false,true,1));
  expect(work.payload.nextCompetencyIndex).toBe(1);
  expect(work.payload.repairCompetencyIds).toEqual(['a']);
  expect(work.continue).toBe(true);
 });
 it('repairs deferred lessons after the initial course pass',()=>{
  const work=nextCourseWork({repairCompetencyIds:['a'],lessonRepairCounts:{a:1}},result('b',true,false,2));
  expect(work.payload.repairCompetencyId).toBe('a');
 });
 it('does not loop forever when an external dependency never changes',()=>{
  const work=nextCourseWork({repairCompetencyId:'a',repairCompetencyIds:['a'],lessonRepairCounts:{a:2}},result('a',false,false,1));
  expect(work.continue).toBe(false);expect(work.unresolved).toEqual(['a']);
 });
 it('does not confuse finishing the last repair with all lessons passing',()=>{
  const work=nextCourseWork({repairCompetencyId:'b',repairCompetencyIds:['b'],unresolvedCompetencyIds:['a']},result('b',true,false,1));
  expect(work.unresolved).toEqual(['a']);expect(work.continue).toBe(false);
 });
});
