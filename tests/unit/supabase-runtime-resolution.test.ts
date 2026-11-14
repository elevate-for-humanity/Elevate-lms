// @vitest-environment node
import { afterEach,expect,it,vi } from 'vitest';
const sdk=vi.hoisted(()=>({create:vi.fn(()=>({}))}));
vi.mock('@supabase/supabase-js',()=>({createClient:sdk.create}));
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveServerSupabaseRawEnv } from '@/lib/supabase/public-config';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('keeps privileged queries on the same normalized runtime project as authentication',()=>{
 vi.stubEnv('SUPABASE_URL',' https://db.runtime-project.supabase.co/path ');
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://old-build-project.supabase.co');
 vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','private-fixture-key');
 createAdminClient();
 expect(sdk.create).toHaveBeenCalledWith(resolveServerSupabaseRawEnv().url,'private-fixture-key',expect.any(Object));
 expect(sdk.create.mock.calls[0][0]).toBe('https://runtime-project.supabase.co');
});
