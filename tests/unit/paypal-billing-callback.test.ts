// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const f=vi.hoisted(()=>({verify:vi.fn(),sync:vi.fn(),payment:vi.fn(),reserve:vi.fn(),write:vi.fn(),prior:vi.fn(),admin:vi.fn()}));
vi.mock('@/lib/integrations/paypal-client',()=>({verifyPayPalBillingWebhook:f.verify}));
vi.mock('@/lib/billing/paypal-payment-sync',()=>({syncPayPalSubscriptionState:f.sync,syncPayPalPaymentToQuickBooks:f.payment}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:f.admin}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
import {POST} from '../../apps/marketing/app/api/webhooks/paypal-billing/route';
const event={id:'fixture-event',event_type:'BILLING.SUBSCRIPTION.CANCELLED',resource:{id:'fixture-subscription',status:'CANCELLED'}};
const request=(body:any=event)=>new NextRequest('https://store.elevateforhumanity.org/api/webhooks/paypal-billing',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{
 vi.clearAllMocks();f.verify.mockResolvedValue(true);f.sync.mockResolvedValue(null);
 f.reserve.mockResolvedValue({data:{id:'fixture-reservation'},error:null});f.write.mockResolvedValue({error:null});f.prior.mockResolvedValue({data:{status:'completed'},error:null});
 f.admin.mockResolvedValue({from:()=>({insert:()=>({select:()=>({single:f.reserve})}),update:(body:any)=>({eq:()=>f.write(body)}),select:()=>({eq:()=>({eq:()=>({maybeSingle:f.prior})})})})});
});
it('invalid signatures cannot reserve or mutate billing events',async()=>{f.verify.mockResolvedValue(false);expect((await POST(request())).status).toBe(400);expect(f.admin).not.toHaveBeenCalled();});
it('malformed events do not call PayPal or the database',async()=>{expect((await POST(request({}))).status).toBe(400);expect(f.verify).not.toHaveBeenCalled();expect(f.admin).not.toHaveBeenCalled();});
it('verified cancellation is synchronized and durably acknowledged',async()=>{const r=await POST(request());expect(r.status).toBe(200);expect(f.sync).toHaveBeenCalledWith(expect.anything(),{subscriptionId:'fixture-subscription',status:'CANCELLED'});expect(f.payment).not.toHaveBeenCalled();expect(f.write).toHaveBeenCalledWith(expect.objectContaining({status:'completed'}));});
it('completed duplicate events do not repeat fulfillment',async()=>{f.reserve.mockResolvedValue({error:{code:'23505'}});const r=await POST(request());expect(r.status).toBe(200);expect(await r.json()).toMatchObject({duplicate:true});expect(f.sync).not.toHaveBeenCalled();});
it('failed duplicate events remain retryable instead of acknowledging lost work',async()=>{f.reserve.mockResolvedValue({error:{code:'23505'}});f.prior.mockResolvedValue({data:{status:'failed'},error:null});expect((await POST(request())).status).toBe(503);expect(f.sync).not.toHaveBeenCalled();});
it('failed completion persistence never returns a successful acknowledgement',async()=>{f.write.mockResolvedValue({error:{message:'fixture write failure'}});expect((await POST(request())).status).toBe(500);});
