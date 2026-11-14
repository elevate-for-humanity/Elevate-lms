// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), insert: vi.fn(), provision: vi.fn(), notify: vi.fn(), existing: false }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/partners/provision-host-shop-application', () => ({ provisionHostShopApplication: mocks.provision }));
vi.mock('@/lib/applications/submission-notifications', () => ({ notifyApplicationSubmission: mocks.notify }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
 storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
 from: (table: string) => {
  const chain = { select: () => chain, eq: () => chain, ilike: () => chain, limit: () => chain,
   maybeSingle: async () => ({ data: mocks.existing ? { id: 'existing-application' } : null, error: null }),
   single: async () => ({ data: { id: 'saved-application' }, error: null }),
   insert: (row: unknown) => { mocks.insert(table, row); return chain; },
  }; return chain;
 },
}) }));
import { POST } from '@/apps/marketing/app/api/host-shop/apply-multipart/route';
function form() {
 const f = new FormData();
 const fields = { legalBusinessName: 'Fixture Salon', ownerName: 'Fixture Owner', contactName: 'Fixture Owner', email: 'fixture@example.com', phone: '3175550100', address1: '100 Main St', city: 'Indianapolis', state: 'Indiana', zip: '46222', industryType: 'salon', licenseNumber: 'FIXTURE', supervisorName: 'Fixture Supervisor', supervisorLicenseNumber: 'FIXTURE2', supervisorYearsLicensed: '2', canSuperviseAndVerify: 'yes', hasInsurance: 'yes', workersCompStatus: 'covered', compensationModel: 'hourly', signerName: 'Fixture Owner', signatureAcknowledged: 'on', mouAcknowledged: 'on', consentAcknowledged: 'on', programs: 'cosmetology' };
 for (const [k,v] of Object.entries(fields)) f.set(k,v);
 for (const key of ['shopLicense','insurance','workersComp','supervisorLicense','ein']) f.set(key,new File(['fixture evidence'],key+'.pdf',{type:'application/pdf'}));
 return f;
}
function request(f = form()) { return new NextRequest('https://www.elevateforhumanity.org/api/host-shop/apply-multipart',{method:'POST',body:f}); }
beforeEach(() => { vi.clearAllMocks(); mocks.existing=false; mocks.upload.mockResolvedValue({error:null});mocks.remove.mockResolvedValue({error:null});mocks.provision.mockResolvedValue({partnerId:'shop',portalUrl:'https://app.elevateforhumanity.org/host-shop/login'});mocks.notify.mockResolvedValue({applicant:'sent'}); });
it('saves all five documents and a submitted application before creating scoped onboarding and sending acknowledgment', async () => {
 const response=await POST(request());expect(response.status).toBe(201);
 expect((await response.json()).portalProvisioned).toBe(true);
 expect(mocks.upload).toHaveBeenCalledTimes(5);
 expect(mocks.insert).toHaveBeenCalledWith('host_shop_applications',expect.objectContaining({status:'submitted',email:'fixture@example.com',intake:expect.objectContaining({programs:['cosmetology']})}));
 expect(mocks.provision).toHaveBeenCalledWith(expect.objectContaining({applicationId:'saved-application',programs:['cosmetology'],documents:expect.objectContaining({ein:expect.any(String)})}));
 expect(mocks.notify).toHaveBeenCalledTimes(1);expect(mocks.remove).not.toHaveBeenCalled();
});
it('preserves saved evidence and returns the saved reference if a later notification fails', async () => {
 mocks.notify.mockRejectedValue(new Error('fixture mail outage'));
 const response=await POST(request());expect(response.status).toBe(201);
 expect(await response.json()).toMatchObject({ok:true,referenceNumber:'saved-application',notificationStatus:'unconfirmed'});
 expect(mocks.remove).not.toHaveBeenCalled();
});
it('rejects incomplete uploads before saving or provisioning', async () => {
 const f=form();f.delete('ein');const response=await POST(request(f));expect(response.status).toBe(400);
 expect(mocks.upload).not.toHaveBeenCalled();expect(mocks.insert).not.toHaveBeenCalled();expect(mocks.provision).not.toHaveBeenCalled();
});
it('sends returning shops to authenticated onboarding without uploading duplicates', async () => {
 mocks.existing=true;const response=await POST(request());expect(response.status).toBe(409);
 expect(mocks.upload).not.toHaveBeenCalled();expect(mocks.insert).not.toHaveBeenCalled();
});
it('cleans up uncommitted uploads after a storage failure', async () => {
 mocks.upload.mockResolvedValueOnce({error:null}).mockResolvedValueOnce({error:{message:'fixture storage outage'}});
 expect((await POST(request())).status).toBe(500);
 expect(mocks.remove).toHaveBeenCalledWith([expect.any(String)]);expect(mocks.insert).not.toHaveBeenCalled();
});
