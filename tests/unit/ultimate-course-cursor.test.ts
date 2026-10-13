import {describe,it,expect} from 'vitest';
import {nextCourseWork} from '@/lib/ultimate-course-builder/worker/course-cursor';
const result=(passed:boolean,remaining=true)=>({completed:passed,hasRemaining:remaining,nextIndex:1,lessons:[{competencyId:'a'}],findings:[]});
describe('complete each lesson before advancing',()=>{
 it('repairs the same failed lesson',()=>expect(nextCourseWork({nextCompetencyIndex:0},result(false)).payload.nextCompetencyIndex).toBe(0));
 it('advances only on success',()=>expect(nextCourseWork({nextCompetencyIndex:0},result(true)).payload.nextCompetencyIndex).toBe(1));
 it('stops on exhausted repairs',()=>expect(nextCourseWork({lessonRepairCounts:{a:2}},result(false)).continue).toBe(false));
 it('stops on external prerequisites',()=>expect(nextCourseWork({}, {...result(false),findings:[{code:'ULTIMATE_GOOGLE_AUTHORING_HTTP_403'}]}).continue).toBe(false));
});
