import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const fixture=vi.hoisted(()=>({selected:'partner-a' as string|undefined,filters:[] as any[]}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>fixture.selected?{value:fixture.selected}:undefined})}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})}})}));
vi.mock('@/lib/admin/portal-preview',()=>({resolvePortalPreviewSubject:async()=>({previewing:true,userId:'shop-owner'})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const q:any={};for(const method of ['select','eq','neq','is','order','range','in']) q[method]=(...args:any[])=>{fixture.filters.push([table,method,...args]);return q;};
 const result=()=>({data:table==='profiles'?{role:'admin'}:table==='shops'?[{id:'shop-a'}]:[],error:null,count:0});
 q.maybeSingle=async()=>result();q.then=(resolve:any)=>Promise.resolve(result()).then(resolve);return q;
}})}));
import { GET } from '@/apps/lms/app/api/host-shop/match-requests/route';
describe('Host Shop matching preview scope',()=>{
 beforeEach(()=>{fixture.selected='partner-a';fixture.filters=[];});
 it('scopes owner-account previews to the selected shop, not to owner as apprentice',async()=>{
  const r=await GET(new NextRequest('https://app.elevateforhumanity.org/api/host-shop/match-requests?status=all'));
  expect(r.status).toBe(200);
  expect(fixture.filters).toContainEqual(['shops','eq','partner_id','partner-a']);
  expect(fixture.filters).toContainEqual(['host_shop_match_requests','in','host_shop_id',['shop-a']]);
  expect(fixture.filters).not.toContainEqual(['host_shop_match_requests','eq','apprentice_id','shop-owner']);
  expect(fixture.filters).not.toContainEqual(['host_shop_match_requests','eq','status','all']);
 });
});
