import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {getPartnerClient,PartnerIntegrationUnavailableError,type PartnerType} from '@/lib/partners';
const h=vi.hoisted(()=>({writes:0,failures:[] as any[]}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{id:'existing-enrollment',external_enrollment_id:'original-vendor-receipt',partner_lms_providers:{provider_type:'careersafe'},provider_type:'careersafe',delivery_mode:'api',partner_type:'careersafe',external_course_code:'original-course'}}),
 insert:async(value:any)=>{h.failures.push({table,value});return {error:null};},update:()=>{h.writes++;return q;}};return q;
}})}));
vi.mock('@/lib/audit-context',()=>({setAuditContext:async()=>{}}));
import {enrollInExternalModule} from '@/lib/partners/hybrid-enrollment';
import {autoEnrollPartnerCourse} from '@/lib/automation/partnerEnrollment';
import {syncSingleEnrollment} from '@/lib/automation/progressSync';
beforeEach(()=>{h.writes=0;h.failures=[];});
it.each<PartnerType>(['certiport','careersafe','jri','nrf','nds'])('does not manufacture a client or successful vendor receipt for %s',partner=>{
 expect(()=>getPartnerClient(partner)).toThrow(PartnerIntegrationUnavailableError);
 expect(()=>getPartnerClient(partner)).toThrow('PARTNER_API_NOT_CONNECTED');
});
it('cannot overwrite an existing student progress record with fabricated 50 percent',async()=>{
 await expect(syncSingleEnrollment('existing-enrollment')).rejects.toThrow('PARTNER_API_NOT_CONNECTED');
 expect(h.writes).toBe(0);
});
it('does not leak caller input or credentials through its error',()=>{
 expect(()=>getPartnerClient('token=PRIVATE' as PartnerType)).toThrow(PartnerIntegrationUnavailableError);
 try{getPartnerClient('token=PRIVATE' as PartnerType);}catch(error){expect(String(error)).not.toContain('PRIVATE');}
});

it('enrollment automation returns and persists the exact safe configuration blocker without false enrollment or email',async()=>{
 const result=await autoEnrollPartnerCourse({studentId:'student',partnerId:'provider',courseId:'course'});
 expect(result).toEqual({success:false,error:'PARTNER_API_NOT_CONNECTED'});
 expect(h.failures).toHaveLength(1);
 expect(h.failures[0]).toMatchObject({table:'partner_lms_enrollment_failures',value:{error_message:'PARTNER_API_NOT_CONNECTED'}});
 expect(h.writes).toBe(0);
});

afterEach(()=>vi.unstubAllEnvs());
it('API module failure identifies the API mode and configuration blocker without a false link fallback',async()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test.invalid');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only');
 expect(await enrollInExternalModule({userId:'student',moduleId:'module',courseId:'course'})).toEqual({success:false,mode:'api',error:'PARTNER_API_NOT_CONNECTED'});
 expect(h.writes).toBe(0);
});
