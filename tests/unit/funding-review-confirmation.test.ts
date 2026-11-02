// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({flags:vi.fn(),changed:null as any}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{role:'admin'},error:null})})})})})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 if(table==='payment_integrity_flags'){state.flags();throw new Error('Unconfirmed changes must not resolve flags');}
 const q:any={select:()=>q,eq:()=>q,update:()=>q,maybeSingle:async()=>({data:state.changed,error:null})};return q;
}})}));
import {verifyFunding,rejectFunding} from '@/apps/admin/app/funding-verification/actions';
beforeEach(()=>{vi.clearAllMocks();state.changed=null;});
it('does not clear compliance flags when verification affected no enrollment',async()=>{
 await expect(verifyFunding('saved-enrollment')).rejects.toThrow('Enrollment state changed');expect(state.flags).not.toHaveBeenCalled();
});
it('does not clear compliance flags when rejection affected no enrollment',async()=>{
 await expect(rejectFunding('saved-enrollment','Reviewed reason')).rejects.toThrow('Enrollment state changed');expect(state.flags).not.toHaveBeenCalled();
});
