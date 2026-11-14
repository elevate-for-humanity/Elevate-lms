import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({send:vi.fn(),secrets:vi.fn(),cookies:vi.fn(),warn:vi.fn()}));
vi.mock('web-push',()=>({default:{sendNotification:mocks.send}}));
vi.mock('@/lib/secrets',()=>({getSecrets:mocks.secrets}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.cookies}));
vi.mock('@/lib/logger',()=>({logger:{warn:mocks.warn,error:vi.fn()}}));
import {PushNotificationService} from '@/lib/notifications/push-service';
const endpoint='https://fcm.googleapis.com/test-only-endpoint';
function database(){
 const filters:any[]=[];const patches:any[]=[];
 const query:any={select:()=>query,eq:(key:string,value:any)=>{filters.push([key,value]);return query;},then:(resolve:any)=>Promise.resolve({data:[{endpoint,p256dh:'device-public',auth:'device-auth'}],error:null}).then(resolve)};
 const update:any={eq:(key:string,value:any)=>{filters.push([key,value]);return update;},then:(resolve:any)=>Promise.resolve({error:null}).then(resolve)};
 return {filters,patches,db:{from:()=>({...query,update:(value:any)=>{patches.push(value);return update;}})}};
}
beforeEach(()=>{vi.clearAllMocks();mocks.secrets.mockResolvedValue({VAPID_PUBLIC_KEY:'runtime-public',VAPID_PRIVATE_KEY:'runtime-private'});mocks.send.mockResolvedValue({statusCode:201});mocks.cookies.mockImplementation(()=>{throw Error('signed webhook must not use cookie auth');});});
it('loads secrets at send time after import and supplies request-scoped signing keys',async()=>{
 const service=new PushNotificationService(),{db,filters}=database();
 expect(mocks.secrets).not.toHaveBeenCalled();
 expect(await service.sendToUserWithDatabase(db,'owner',{title:'Phone test',body:'Open your secure inbox.'})).toBe(1);
 expect(mocks.send).toHaveBeenCalledWith(expect.anything(),expect.any(String),expect.objectContaining({timeout:10000,vapidDetails:{subject:'mailto:admin@elevateforhumanity.org',publicKey:'runtime-public',privateKey:'runtime-private'}}));
 expect(filters).toContainEqual(['active',true]);expect(filters).toContainEqual(['user_id','owner']);
});
it('an expired device is disabled only through the supplied owner-scoped database',async()=>{
 mocks.send.mockRejectedValue({statusCode:410,body:'sensitive provider response'});
 const {db,patches,filters}=database();
 expect(await new PushNotificationService().sendToUserWithDatabase(db,'owner',{title:'Phone test',body:'Private inbox'})).toBe(0);
 expect(patches).toEqual([expect.objectContaining({active:false})]);
 expect(filters).toContainEqual(['user_id','owner']);expect(filters).toContainEqual(['endpoint',endpoint]);
 expect(mocks.cookies).not.toHaveBeenCalled();expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain('sensitive provider response');
});
it('uncertain sends are attempted once and preserve the device for reconciliation',async()=>{
 mocks.send.mockRejectedValue(Error('timeout containing sensitive data'));
 const {db,patches}=database();
 expect(await new PushNotificationService().sendToUserWithDatabase(db,'owner',{title:'Phone test',body:'Private inbox'})).toBe(0);
 expect(mocks.send).toHaveBeenCalledTimes(1);expect(patches).toEqual([]);
 expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain('sensitive data');
});
it('missing runtime signing keys cannot be reported as provider acceptance',async()=>{
 mocks.secrets.mockResolvedValue({});const {db}=database();
 expect(await new PushNotificationService().sendToUserWithDatabase(db,'owner',{title:'Phone test',body:'Private inbox'})).toBe(0);
 expect(mocks.send).not.toHaveBeenCalled();
});
