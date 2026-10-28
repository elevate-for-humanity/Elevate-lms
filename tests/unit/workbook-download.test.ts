import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m=vi.hoisted(()=>({user:{id:'buyer'} as any,book:{id:'book',pdf_storage_path:'private/original.pdf'} as any,error:null as any,download:vi.fn(),admin:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:m.user},error:null})},from:()=>{
 const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:m.book,error:m.error})};return q;
}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>{m.admin();return {storage:{from:(bucket:string)=>{expect(bucket).toBe('documents');return {download:m.download};}}};}}));
import { GET } from '@/apps/lms/app/api/workbooks/[slug]/download/route';
const get=(slug='prestige-elevation-cosmetology')=>GET(new NextRequest('https://app.elevateforhumanity.org/api/workbooks/'+slug+'/download'),{params:Promise.resolve({slug})});
beforeEach(()=>{vi.clearAllMocks();m.user={id:'buyer'};m.book={id:'book',pdf_storage_path:'private/original.pdf'};m.error=null;m.download.mockResolvedValue({data:new Blob(['%PDF-original']),error:null});});
it('requires sign-in before any privileged file access',async()=>{m.user=null;expect((await get()).status).toBe(401);expect(m.admin).not.toHaveBeenCalled();});
it('never reads private storage when session RLS denies the workbook',async()=>{m.book=null;expect((await get()).status).toBe(404);expect(m.admin).not.toHaveBeenCalled();});
it('fails closed when access verification fails',async()=>{m.error={message:'test'};expect((await get()).status).toBe(503);expect(m.admin).not.toHaveBeenCalled();});
it('delivers original PDF bytes privately from the saved path',async()=>{const r=await get();expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('private, no-store');expect(r.headers.get('content-type')).toBe('application/pdf');expect(r.headers.get('content-disposition')).toContain('attachment;');expect(await r.text()).toBe('%PDF-original');expect(m.download).toHaveBeenCalledWith('private/original.pdf');});
it('rejects path traversal before storage access',async()=>{expect((await get('../other')).status).toBe(404);expect(m.admin).not.toHaveBeenCalled();});
it('reports a missing original without substituting another file',async()=>{m.download.mockResolvedValue({data:null,error:{message:'missing'}});expect((await get()).status).toBe(503);});
