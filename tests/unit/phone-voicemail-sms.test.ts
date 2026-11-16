import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({sms:vi.fn(),delivery:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/notifications/push-service',()=>({PushNotificationService:class{sendToUserWithDatabase=async()=>1;}}));
vi.mock('@/lib/phone/notification-delivery',()=>({phoneEmailReady:()=>true,deliverPhoneNotification:async(db:any,id:any,send:any)=>{m.delivery(id);return (await send()).accepted?'accepted':'review_required';}}));
vi.mock('@/lib/email/sendgrid',()=>({sendEmail:vi.fn()}));
vi.mock('@/lib/notifications/sms',()=>({sendSMS:m.sms}));
import {notifyAssignee,phoneSmsBody} from '@/lib/phone/message-notifications';
const prefs={email_missed_calls:false,sms_missed_calls:true,sms_phone:'+13179562748',push_enabled:false};
function db(){return{from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='profiles'?{full_name:'Owner',email:null}:prefs,error:null})};return q;}};}
beforeEach(()=>{vi.clearAllMocks();m.sms.mockResolvedValue({success:true,messageId:'SM1'});});
it('texts the caller number, extension and voicemail transcript',async()=>{
 await notifyAssignee(db(),{profileId:'owner',taskId:'vm',caller:'+13175550100',urgency:'normal',source:'voicemail',extension:'0',transcript:'Hi,  please call me about   enrollment.'},{id:'system'});
 expect(m.sms).toHaveBeenCalledTimes(1);
 const [to,body]=m.sms.mock.calls[0];
 expect(to).toBe('+13179562748');
 expect(body).toContain('Elevate voicemail');
 expect(body).toContain('From: +13175550100 · Ext 0');
 expect(body).toContain('Message: "Hi, please call me about enrollment."');
 expect(body).toMatch(/Listen\/reply: https:\/\//);
 expect(m.delivery).toHaveBeenCalledWith(expect.objectContaining({channel:'sms',kind:'voicemail'}));
});
it('falls back to the summary when no speech was transcribed',()=>{
 expect(phoneSmsBody({caller:'unknown',urgency:'normal',source:'voicemail',summary:'No speech was detected.'},'https://x')).toContain('Summary: "No speech was detected."');
});
it('clips long transcripts so the text stays deliverable',()=>{
 const body=phoneSmsBody({caller:'+13175550100',urgency:'urgent',source:'voicemail',transcript:'a'.repeat(2000)},'https://x');
 expect(body.startsWith('URGENT Elevate voicemail')).toBe(true);
 expect(body.length).toBeLessThan(600);
});
it('a provider rejection is flagged for review instead of reported as sent',async()=>{
 m.sms.mockResolvedValue({success:false});
 const log=vi.spyOn(console,'error').mockImplementation(()=>{});
 await notifyAssignee(db(),{profileId:'owner',taskId:'vm',caller:'+13175550100',urgency:'normal',source:'voicemail'},{id:'system'});
 expect(m.delivery).toHaveBeenCalledWith(expect.objectContaining({channel:'sms'}));
 expect(log).toHaveBeenCalledWith(expect.stringContaining('requires review'));
});
