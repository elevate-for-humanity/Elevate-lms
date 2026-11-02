import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({push:vi.fn(),delivery:vi.fn(),pushEnabled:true}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/notifications/push-service',()=>({PushNotificationService:class{sendToUserWithDatabase=m.push;}}));
vi.mock('@/lib/phone/notification-delivery',()=>({phoneEmailReady:()=>true,deliverPhoneNotification:async(db:any,id:any,send:any)=>{m.delivery(id);return (await send()).accepted?'accepted':'review_required';}}));
vi.mock('@/lib/email/sendgrid',()=>({sendEmail:vi.fn()}));
vi.mock('@/lib/notifications/sms',()=>({sendSMS:vi.fn()}));
import {notifyAssignee} from '@/lib/phone/message-notifications';
function db(){return{from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='communication_workspaces'?null:table==='profiles'?{full_name:'Owner',email:'owner@example.test'}:{email_missed_calls:false,sms_missed_calls:false,push_enabled:m.pushEnabled},error:null})};return q;}};}
beforeEach(()=>{vi.clearAllMocks();m.pushEnabled=true;m.push.mockResolvedValue(1);});
it('an explicitly disabled phone push preference does not claim or send an alert',async()=>{m.pushEnabled=false;await notifyAssignee(db(),{profileId:'owner',taskId:'message',caller:'unknown',urgency:'normal',source:'voicemail'},{id:'system'});expect(m.push).not.toHaveBeenCalled();expect(m.delivery).not.toHaveBeenCalled();});
it('an enabled phone push preference uses the already authorized database and owner',async()=>{const database=db();await notifyAssignee(database,{profileId:'owner',taskId:'message',caller:'unknown',urgency:'normal',source:'voicemail'},{id:'system'});expect(m.push).toHaveBeenCalledWith(database,'owner',expect.objectContaining({tag:'phone-callback-message'}));expect(m.delivery).toHaveBeenCalledWith(expect.objectContaining({profileId:'owner',channel:'push'}));});
