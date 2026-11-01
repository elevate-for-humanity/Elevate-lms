// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({enqueue:vi.fn(),sms:vi.fn(),db:null as any}));
vi.mock('@/lib/notifications/index',()=>({enqueueNotification:mocks.enqueue}));
vi.mock('@/lib/notifications/email',()=>({emailService:{}}));
vi.mock('@/lib/notifications/sms',()=>({smsService:{send:mocks.sms}}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>mocks.db}));
import { sendWorkflowNotification } from '@/lib/integrations/notifications';
import { CalendarService } from '@/lib/calendar/calendar-service';
import { recordStoreSubscriptionPayment, STORE_LEDGER_URL } from '@/lib/store/subscription-ledger';
beforeEach(()=>{vi.clearAllMocks();mocks.enqueue.mockResolvedValue('receipt');mocks.sms.mockResolvedValue({success:true});});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('reports rejected queue/SMS/channel requests as failures',async()=>{
 mocks.enqueue.mockResolvedValue(null);
 expect((await sendWorkflowNotification({template:'REMINDER',applicationId:'app',recipient:'test@example.invalid'})).success).toBe(false);
 mocks.sms.mockResolvedValue({success:false,error:'unavailable'});
 expect((await sendWorkflowNotification({template:'REMINDER',applicationId:'app',recipient:'3175550100',channels:['sms']})).success).toBe(false);
 expect((await sendWorkflowNotification({template:'REMINDER',applicationId:'app',recipient:'test@example.invalid',channels:['sms']})).success).toBe(false);
});
it('returns a calendar ID only after the database saves the event',async()=>{
 const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'durable-event'},error:null})})}));
 mocks.db={from:vi.fn(()=>({insert}))};
 const event={title:'Event',startTime:new Date('2026-11-01T14:00:00Z'),endTime:new Date('2026-11-01T15:00:00Z')};
 expect(await new CalendarService().createEvent(event,'owner')).toBe('durable-event');
 expect(insert).toHaveBeenCalledWith(expect.objectContaining({user_id:'owner',date:'2026-11-01',time:'14:00:00',duration:60}));
 mocks.db={from:()=>({insert:()=>({select:()=>({single:async()=>({error:{message:'down'}})})})})};
 await expect(new CalendarService().createEvent(event,'owner')).rejects.toThrow('could not be saved');
});
it('delivers only a verified invoice ID to the fixed isolated Store endpoint',async()=>{
 vi.stubEnv('SUPABASE_URL','https://cuxzzpsyufcewtmicszk.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','private-test-key');
 const invoice='00000000-0000-4000-8000-000000000001',subscription='00000000-0000-4000-8000-000000000002';
 const fetcher=vi.fn().mockResolvedValue(Response.json({ok:true,subscription_id:subscription,replayed:true}));vi.stubGlobal('fetch',fetcher);
 expect(await recordStoreSubscriptionPayment(invoice)).toMatchObject({subscriptionId:subscription});
 expect(fetcher).toHaveBeenCalledWith(STORE_LEDGER_URL,expect.objectContaining({redirect:'error',body:JSON.stringify({invoice_id:invoice})}));
 vi.stubEnv('SUPABASE_URL','https://another.supabase.co');
 await expect(recordStoreSubscriptionPayment(invoice)).rejects.toThrow('configuration');
 expect(fetcher).toHaveBeenCalledTimes(1);
});
it('does not accept an HTTP success without a validated Store delivery receipt',async()=>{
 vi.stubEnv('SUPABASE_URL','https://cuxzzpsyufcewtmicszk.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','private-test-key');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({ok:true,subscription_id:'invalid'})));
 await expect(recordStoreSubscriptionPayment('00000000-0000-4000-8000-000000000001')).rejects.toThrow('has not confirmed');
});
