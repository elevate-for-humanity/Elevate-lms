import { describe, expect, it, vi } from 'vitest';
import { isAssignedCourseInstructor } from '@/lib/lms/instructor-course-access';
function database(data: unknown, error: unknown = null) {
  const filters: unknown[][] = [];
  const query: any = { select: vi.fn(() => query), eq: (column: string, value: unknown) => { filters.push([column, value]); return query; }, limit: () => query, maybeSingle: async () => ({ data, error }) };
  return { filters, from: vi.fn(() => query) };
}
describe('instructor assignment authorization', () => {
  it('requires an active assignment for the exact actor and course', async () => {
    const db = database({ id: 'assignment' });
    expect(await isAssignedCourseInstructor(db as any, 'instructor', 'course')).toBe(true);
    expect(db.from).toHaveBeenCalledWith('instructor_assignments');
    expect(db.filters).toEqual([['instructor_id', 'instructor'], ['course_id', 'course'], ['active', true]]);
  });
  it('denies an unassigned instructor', async () => {
    expect(await isAssignedCourseInstructor(database(null) as any, 'other', 'course')).toBe(false);
  });
  it('surfaces database outages without granting access', async () => {
    await expect(isAssignedCourseInstructor(database(null, { message: 'offline' }) as any, 'instructor', 'course')).rejects.toThrow('Instructor assignment unavailable');
  });
});

import { loadAssignedInstructorCourses } from '@/lib/lms/instructor-course-access';
it('lists courses through active assignments without a phantom instructor column',async()=>{
 const reads:any[]=[];
 const db:any={from:(table:string)=>{const q:any={select:(columns:string)=>{reads.push([table,'select',columns]);return q;},eq:(key:string,value:any)=>{reads.push([table,key,value]);return q;},in:(key:string,value:any)=>{reads.push([table,key,value]);return q;},order:()=>q,range:()=>q,then:(done:any)=>Promise.resolve(table==='instructor_assignments'?{data:[{id:'assigned',course_id:'course'}],error:null}:{data:[{id:'course',title:'Saved Course'}],error:null}).then(done)};return q;}};
 expect((await loadAssignedInstructorCourses(db,'teacher')).data).toEqual([{id:'course',title:'Saved Course'}]);
 expect(reads).toContainEqual(['instructor_assignments','active',true]);expect(reads).toContainEqual(['lms_courses','id',['course']]);
 expect(reads).not.toContainEqual(['lms_courses','instructor_id','teacher']);
});
it('returns an assignment outage as unavailable without querying courses',async()=>{
 const from=vi.fn(()=>{const q:any={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:null,error:{message:'offline'}})};return q;});
 const result=await loadAssignedInstructorCourses({from} as any,'teacher');expect(result.data).toBeNull();expect(result.error.message).toBe('offline');expect(from).toHaveBeenCalledTimes(1);
});
