// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { recordRuntimeIntegrationEvidence } from '@/lib/integrations/runtime-evidence';
import { probePlatformService } from '@/lib/control-plane/service-probe';
afterEach(()=>vi.unstubAllEnvs());
it('persists all providers without treating configuration as authentication or swallowing writes',async()=>{
 vi.stubEnv('SEZZLE_MERCHANT_ID','private');vi.stubEnv('SEZZLE_PUBLIC_KEY','private');vi.stubEnv('SEZZLE_PRIVATE_KEY','private');vi.stubEnv('SEZZLE_WEBHOOK_SECRET','private');
 const rpc=vi.fn().mockResolvedValue({error:null});
 const result=await recordRuntimeIntegrationEvidence({rpc} as any,{checkedAt:new Date().toISOString(),overallStatus:'healthy',services:[]});
 expect(result.recorded).toBe(20);expect(rpc).toHaveBeenCalledTimes(20);
 expect(result.observations.find(x=>x.provider==='sezzle')).toMatchObject({configured:true,authenticated:false});
 expect(JSON.stringify(rpc.mock.calls)).not.toContain('private');
 rpc.mockResolvedValue({error:{message:'private-db'}});
 await expect(recordRuntimeIntegrationEvidence({rpc} as any,{checkedAt:'now',overallStatus:'healthy',services:[]})).rejects.toThrow('could not be saved');
});
it('rejects provider homepages, redirect/login success and malformed runtime health',async()=>{
 const request=vi.fn().mockResolvedValue(Response.json({healthy:true}));
 expect((await probePlatformService({url:'https://supabase.com/dashboard'},request)).status).toBe('warning');expect(request).not.toHaveBeenCalled();
 expect((await probePlatformService({url:'https://admin.elevateforhumanity.org/api/health'},request)).status).toBe('fail');
 request.mockResolvedValue(Response.json({service:'admin',healthy:true,ready:true,commit:'a'.repeat(40),dependencies:{supabase:{ok:true}}}));
 expect((await probePlatformService({url:'https://admin.elevateforhumanity.org/api/health'},request)).status).toBe('pass');
});

it('uses the actual email transport and one complete Calendar OAuth client',async()=>{
 const {runtimeConfiguration,RUNTIME_INTEGRATIONS}=await import('@/lib/integrations/runtime-status');
 expect(RUNTIME_INTEGRATIONS.find(row=>row.id==='student-enrollment-delivery')?.required).toContain('SENDGRID_API_KEY');
 vi.stubEnv('GOOGLE_CALENDAR_CLIENT_ID','calendar-id');vi.stubEnv('GOOGLE_CALENDAR_CLIENT_SECRET','calendar-secret');
 expect(runtimeConfiguration('google').configured).toBe(true);
 vi.stubEnv('GOOGLE_CALENDAR_CLIENT_SECRET','');vi.stubEnv('GOOGLE_CLIENT_SECRET','other-client-secret');
 expect(runtimeConfiguration('google').configured).toBe(false);
});
