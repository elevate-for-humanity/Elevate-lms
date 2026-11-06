import { expect,it,vi } from 'vitest';
import type {NextRequest} from 'next/server';
const privileged=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'learner'}}})}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:privileged}));
vi.mock('@/lib/ocr/tesseract-ocr',()=>({autoExtract:vi.fn()}));
vi.mock('@/lib/audit-context',()=>({setAuditContext:vi.fn()}));
import {POST as learnerUpload} from '@/apps/lms/app/api/learner/documents/route';
import {POST as partnerUpload} from '@/apps/marketing/app/api/partner-upload/route';
it('rejects an empty learner document before querying or writing private records',async()=>{
 const form=new FormData();form.set('requirement_id','owned-requirement');form.set('file',new File([],'identity.pdf',{type:'application/pdf'}));
 expect((await learnerUpload({formData:async()=>form} as NextRequest)).status).toBe(400);expect(privileged).not.toHaveBeenCalled();
});
it('does not let a predictable onboarding step act as an anonymous upload credential',async()=>{
 const form=new FormData();form.set('partnerId','11111111-1111-4111-8111-111111111111');form.set('token','documents');form.set('documentType','insurance');form.set('file',new File(['pdf'],'insurance.pdf',{type:'application/pdf'}));
 expect((await partnerUpload({formData:async()=>form} as Request)).status).toBe(400);expect(privileged).not.toHaveBeenCalled();
});
