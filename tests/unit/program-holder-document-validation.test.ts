import { expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({context:{mode:'holder',user:{id:'owner'},holderId:'holder'}}));
vi.mock('@/lib/auth/require-program-holder',()=>({requireProgramHolder:async()=>state.context}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
import { POST } from '@/apps/lms/app/api/program-holder/documents/route';
it('rejects video submitted as testing evidence before any database or storage write',async()=>{
 const file=new File(['video'],'evidence.mp4',{type:'video/mp4'});
 const response=await POST({formData:async()=>({get:(key:string)=>key==='file'?file:key==='documentType'?'testing_evidence':null})} as any);
 expect(response.status).toBe(400);expect((await response.json()).error).toContain('PDF, JPG, or PNG');
});
it('handles a malformed multipart body as a validation error',async()=>{
 expect((await POST({formData:async()=>{throw Error('malformed');}} as any)).status).toBe(400);
});
