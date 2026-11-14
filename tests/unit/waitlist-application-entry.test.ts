// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks=vi.hoisted(()=>({insert:vi.fn()}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/audit/withApiAudit',()=>({withApiAudit:(_path:unknown,fn:unknown)=>fn}));
vi.mock('@/lib/api/withRuntime',()=>({withRuntime:(fn:unknown)=>fn}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{
 let inserted=false;const q:any={select:()=>q,eq:()=>q,insert:(value:unknown)=>{inserted=true;mocks.insert(value);return q;},maybeSingle:async()=>({data:inserted?{id:'test-waitlist',position:1}:null,error:null}),then:(resolve:any)=>Promise.resolve({count:0}).then(resolve)};return q;
}})}));
import { POST } from '@/apps/marketing/app/api/waitlist/route';
beforeEach(()=>vi.clearAllMocks());
it.each(['fssa','cna','hvac-technician','medical-assistant','phlebotomy'])('accepts the %s waitlist exposed by the public forms',async(programSlug)=>{
 const response=await POST(new NextRequest('https://www.elevateforhumanity.org/api/waitlist',{method:'POST',body:JSON.stringify({firstName:'Test',lastName:'Applicant',email:'test@example.com',programSlug})}));
 expect(response.status).toBe(200);expect(await response.json()).toMatchObject({success:true,position:1});expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({program_slug:programSlug}));
});
it('rejects unknown programs before writing records',async()=>{
 const response=await POST(new NextRequest('https://www.elevateforhumanity.org/api/waitlist',{method:'POST',body:JSON.stringify({firstName:'Test',lastName:'Applicant',email:'test@example.com',programSlug:'unknown'})}));expect(response.status).toBe(400);expect(mocks.insert).not.toHaveBeenCalled();
});
