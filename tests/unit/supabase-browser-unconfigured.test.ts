import {describe,it,expect,vi} from 'vitest';
vi.mock('@/lib/supabase/public-config',()=>({getBrowserPublicSupabaseConfig:()=>null}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
import {createClient,createBrowserClient} from '@/lib/supabase/client';
describe('unconfigured browser database connection',()=>{
 it('rejects missing configuration before returning a database or authentication client',()=>{
  expect(()=>createClient()).toThrow('SUPABASE_CONFIGURATION_MISSING');
  expect(()=>createBrowserClient()).toThrow('SUPABASE_CONFIGURATION_MISSING');
 });
});
