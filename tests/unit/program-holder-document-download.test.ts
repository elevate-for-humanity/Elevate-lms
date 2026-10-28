import { afterEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({document:{file_url:'program-holders/holder/testing_evidence/report.pdf',storage_bucket:'documents'} as any,sign:vi.fn(async()=>({data:{signedUrl:'https://storage.example/signed'},error:null}))}));
vi.mock('@/lib/auth/require-program-holder',()=>({requireProgramHolder:async()=>({mode:'holder',holderId:'holder',profile:{id:'owner'},db:{from:()=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:state.document,error:null})};return q;},storage:{from:()=>({createSignedUrl:state.sign})}}})}));
import { GET } from '@/apps/lms/app/api/program-holder/documents/[id]/download/route';
const params={params:Promise.resolve({id:'11111111-1111-4111-8111-111111111111'})};
afterEach(()=>{vi.unstubAllEnvs();state.sign.mockClear();state.document={file_url:'program-holders/holder/testing_evidence/report.pdf',storage_bucket:'documents'};});
it('signs an owned curriculum record without caching the private redirect',async()=>{
 const result=await GET({} as Request,params);expect(result.status).toBe(307);expect(result.headers.get('cache-control')).toBe('private, no-store');expect(state.sign).toHaveBeenCalledWith(state.document.file_url,60);
});
it.each([
 ['program-holders/another-holder/testing_evidence/report.pdf','documents',404],
 ['program-holders/holder/../other/report.pdf','documents',409],
 ['protected/report.pdf','private-financial-secrets',409],
 ['https://%invalid','documents',409],
 ['https://untrusted.example/storage/v1/object/public/documents/file.pdf','documents',409],
 ['https://project.supabase.co/storage/v1/object/public/documents/%ZZ','documents',409],
])('rejects an unsafe stored reference %s',async(file_url,storage_bucket,status)=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://project.supabase.co');state.document={file_url,storage_bucket};expect((await GET({} as Request,params)).status).toBe(status);expect(state.sign).not.toHaveBeenCalled();
});
it('rejects malformed IDs before storage lookup',async()=>{expect((await GET({} as Request,{params:Promise.resolve({id:'-'.repeat(36)})})).status).toBe(400);expect(state.sign).not.toHaveBeenCalled();});
