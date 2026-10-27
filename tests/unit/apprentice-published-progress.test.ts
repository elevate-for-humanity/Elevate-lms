import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
import { loadPublishedLessonProgress } from '@/lib/apprenticeship/published-lesson-progress';
it('counts all published lessons and deduplicates only their completed records', async () => {
 const calls: any[]=[];
 const db: any={from(table:string) {
  const q:any={select:()=>q,eq:(k:string,v:any)=>{calls.push([table,k,v]);return q;},order:()=>q,
   range:async (a:number,b:number)=>({error:null,data:(table==='course_lessons'?
    Array.from({length:1001},(_,i)=>({id:`l${i}`})):
    [{lesson_id:'l0'},{lesson_id:'l0'},{lesson_id:'unpublished'},{lesson_id:'l1000'}]).slice(a,b+1)})};return q;
 }};
 const result=await loadPublishedLessonProgress(db,'course','learner');
 expect(result.totalLessons).toBe(1001);expect(result.completedLessons).toBe(2);
 expect(calls).toContainEqual(['course_lessons','is_published',true]);
 expect(calls).toContainEqual(['lesson_progress','user_id','learner']);
});
it('fails visibly instead of turning an unavailable ledger into zero completion', async()=>{
 const q:any={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:null,error:new Error('offline')})};
 await expect(loadPublishedLessonProgress({from:()=>q} as any,'course','learner')).rejects.toThrow('offline');
});
