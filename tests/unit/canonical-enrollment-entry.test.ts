import { beforeEach, expect, it, vi } from 'vitest';
const canonical = vi.hoisted(()=>vi.fn(async(_props:{searchParams:Promise<{program:string;intent:string;session_id?:string}>})=>null));
vi.mock('@/apps/marketing/app/apply/student/form/page',()=>({default:canonical}));
import CnaEnrollment from '@/apps/marketing/app/programs/cna/enroll/page';
import MedicalEnrollment from '@/apps/marketing/app/programs/medical-assistant/enroll/page';
beforeEach(()=>vi.clearAllMocks());
it.each([[CnaEnrollment,'cna'],[MedicalEnrollment,'medical-assistant']] as const)('uses the canonical intake service for a bookmarked program enrollment',async(Page,program)=>{
 await Page({searchParams:Promise.resolve({session_id:'verified-session'})});
 expect(canonical).toHaveBeenCalledOnce();expect(await canonical.mock.calls[0][0].searchParams).toEqual({program,intent:'enrollment',session_id:'verified-session'});
});
