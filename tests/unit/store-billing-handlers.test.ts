// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({db:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:mocks.db}));
import {POST as fulfill} from '@/apps/marketing/app/api/store/internal/process-billing-fulfillment/route';
import {POST as invoice} from '@/apps/marketing/app/api/store/internal/generate-billing-invoices/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it.each([fulfill,invoice])('rejects unauthenticated Store billing before reading any customers',async handler=>{
 vi.stubEnv('CRON_SECRET','store-only-cron');
 const response=await handler(new NextRequest('https://store.elevateforhumanity.org/api/store/internal/test',{method:'POST'}));
 expect(response.status).toBe(401);expect(mocks.db).not.toHaveBeenCalled();
});
