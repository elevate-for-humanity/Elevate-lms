// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state=vi.hoisted(()=>({select:vi.fn(),enrolled:true}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/audit/withApiAudit',()=>({withApiAudit:(_name:string,handler:unknown)=>handler}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'student'}}})},from:(table:string)=>{
 const result=()=>({data:table==='course_enrollments'?(state.enrolled?{id:'enrolled'}:null):table==='courses'?{id:'course',title:'Course'}:table==='course_lessons'?[{id:'lesson',title:'Future lesson'}]:[],error:null});
 const query={select:(fields:string)=>{state.select(fields);return query},eq:()=>query,in:()=>query,limit:()=>query,order:()=>query,maybeSingle:async()=>result(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve(result()))};return query;
}})}));
import {GET} from '@/apps/lms/app/api/courses/[courseId]/lessons/public/route';
beforeEach(()=>{vi.clearAllMocks();state.enrolled=true;});
it.each([true,false])('never bulk-loads protected lesson bodies or raw media for enrolled=%s',async enrolled=>{
 state.enrolled=enrolled;
 const r=await GET(new NextRequest('https://app.elevateforhumanity.org/api/courses/course/lessons/public'),{params:Promise.resolve({courseId:'course'})});
 expect(r.status).toBe(200);
 const data=await r.json();expect(data.lessons[0].title).toBe('Future lesson');
 expect(state.select.mock.calls.flat().join(',')).not.toMatch(/video_url|quiz_questions|\bcontent\b|resources/);
 expect(data.lessons[0].video_url).toBeUndefined();
});
