import {beforeEach,expect,it,vi} from 'vitest';
import {getPartnerClient,PartnerIntegrationUnavailableError,type PartnerType} from '@/lib/partners';
const h=vi.hoisted(()=>({writes:0}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{
 const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{id:'existing-enrollment',external_enrollment_id:'original-vendor-receipt',partner_lms_providers:{provider_type:'careersafe'}}}),
 update:()=>{h.writes++;return q;}};return q;
}})}));
import {syncSingleEnrollment} from '@/lib/automation/progressSync';
beforeEach(()=>{h.writes=0;});
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
