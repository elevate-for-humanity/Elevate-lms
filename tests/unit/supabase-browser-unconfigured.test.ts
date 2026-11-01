import {describe,it,expect,vi} from 'vitest';
vi.mock('@/lib/supabase/public-config',()=>({getBrowserPublicSupabaseConfig:()=>null}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
import {createClient} from '@/lib/supabase/client';
describe('unconfigured browser database connection',()=>{
 const client=createClient();
 it('keeps query chains usable while rejecting reads, writes and RPCs',async()=>{
  for(const response of [await client.from('profiles').select('id').eq('id','owner').maybeSingle(),await client.from('profiles').insert({id:'owner'}),await client.rpc('save_progress')]) {
   expect(response).toMatchObject({data:null,error:{code:'SUPABASE_NOT_CONFIGURED'},status:503});
  }
 });
 it('does not report authentication changes or reset emails as successful',async()=>{
  for(const response of [await client.auth.getUser(),await client.auth.getSession(),await client.auth.updateUser({data:{name:'test'}}),await client.auth.resetPasswordForEmail('fixture@example.test')]) {
   expect(response.error).toMatchObject({code:'SUPABASE_NOT_CONFIGURED'});
  }
 });
 it('does not acknowledge storage operations without a configured connection',async()=>{
  const storage=client.storage.from('course-media');
  for(const response of [await storage.upload('fixture',new Blob(['x'])),await storage.download('fixture'),await storage.list(),await storage.remove(['fixture'])]) {
   expect(response.data).toBeNull();
   expect(response.error).toMatchObject({code:'SUPABASE_NOT_CONFIGURED'});
  }
 });
});
