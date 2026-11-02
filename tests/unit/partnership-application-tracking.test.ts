// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ email:'test@example.com', eq:vi.fn(), from:vi.fn() }));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/audit/withApiAudit',()=>({withApiAudit:(_path:unknown, handler:unknown)=>handler}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:state.from})}));
import { GET } from '@/apps/marketing/app/api/applications/track/route';
const id='e1b54b6a-ad2a-4e43-89f7-a6ef0f3e217b';
beforeEach(()=>{
 vi.clearAllMocks(); state.email='test@example.com';
 state.from.mockImplementation((table:string)=>{
  const q:any={select:vi.fn(()=>q),eq:vi.fn((key:string,value:string)=>{state.eq(key,value);return q;}),in:vi.fn(()=>q),order:vi.fn(()=>q),limit:vi.fn(()=>q),maybeSingle:async()=>({data:table==='application_intake'&&state.email==='test@example.com'?{id,application_type:'employer',created_at:'2026-11-02'}:null,error:null})};return q;
 });
});
it('tracks employer receipts with both reference and verified email without exposing payload',async()=>{
 const response=await GET(new NextRequest(`https://www.elevateforhumanity.org/api/applications/track?id=${id}&email=test@example.com`));
 expect(response.status).toBe(200); expect(state.eq).toHaveBeenCalledWith('payload->>email','test@example.com');
 const body=await response.json();expect(body.application).toMatchObject({reference_number:id,status:'under_review',program_interest:'Employer Partnership'});expect(body.application).not.toHaveProperty('payload');expect(body.application).not.toHaveProperty('email');
});
it('does not reveal an intake record when credentials cannot be verified',async()=>{
 state.email='wrong@example.com';const response=await GET(new NextRequest(`https://www.elevateforhumanity.org/api/applications/track?id=${id}&email=wrong@example.com`));expect(response.status).toBe(404);
});
it('requires email before looking up a reference',async()=>{
 const response=await GET(new NextRequest(`https://www.elevateforhumanity.org/api/applications/track?id=${id}`));expect(response.status).toBe(400);expect(state.from).not.toHaveBeenCalled();
});
