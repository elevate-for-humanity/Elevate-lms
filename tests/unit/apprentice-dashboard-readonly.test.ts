import { expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({writes:vi.fn(),progressError:null as any}));
vi.mock('@/lib/portal/load-apprentice-portal',()=>({loadApprenticePortalData:async()=>({enrollment:{id:'enrollment',orientation_completed_at:'2026-10-01'},config:{label:'Barber'}})}));
vi.mock('@/lib/apprenticeship/program-dashboard-extras',()=>({getProgramDashboardExtras:()=>({}),complianceLinksForProgram:()=>[]}));
vi.mock('@/lib/course-builder/program-resolver',()=>({resolveCourseIdFromDb:async()=> 'course'}));
vi.mock('@/lib/lms/resolve-course-entry-links',()=>({resolveCourseEntryLinks:async()=>({courseHref:'/course',workbookHref:'/workbook',continueHref:'/resume'})}));
vi.mock('@/lib/apprenticeship/published-lesson-progress',()=>({loadPublishedLessonProgress:async()=>({totalLessons:2,completedLessons:2,percent:100})}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'learner'}}})},from:(table:string)=>{
 const q:any={select:()=>q,eq:()=>q,update:mock.writes,upsert:mock.writes,
 maybeSingle:async()=>({data:table==='lms_courses'?{title:'Course'}:{progress_percent:0,status:'completed'},error:mock.progressError})};return q;
}})}));
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';
it('renders completed progress without writing enrollment or LMS state',async()=>{
 mock.progressError=null;const result=await loadApprenticeshipDashboard('barber-apprenticeship');
 expect(mock.writes).not.toHaveBeenCalled();expect(result.rti?.status).toBe('completed');expect(result.rti?.progressPercent).toBe(100);
});
it('reports failed progress lookup without displaying a fresh zero',async()=>{
 mock.progressError=new Error('unavailable');await expect(loadApprenticeshipDashboard('barber-apprenticeship')).rejects.toThrow('unavailable');mock.progressError=null;
});
