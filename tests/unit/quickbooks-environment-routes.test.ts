// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const {db,upsert}=vi.hoisted(()=>{
 const upsert=vi.fn();
 const rows=['QB_CLIENT_ID','QB_CLIENT_SECRET','QB_ACCESS_TOKEN','QB_REFRESH_TOKEN','QB_REALM_ID'].map(key=>({key,value:'fixture-'+key}));
 return {upsert,db:{from:vi.fn(()=>({select:()=>({in:async()=>({data:rows,error:null})}),upsert}))}};
});
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:vi.fn().mockResolvedValue(undefined)}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:vi.fn().mockResolvedValue({user:{id:'operator'}})}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:vi.fn().mockResolvedValue(null)}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:vi.fn().mockResolvedValue(db),getAdminClient:vi.fn().mockResolvedValue(db)}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn(),info:vi.fn(),warn:vi.fn()}}));
import {GET,POST} from '../../apps/admin/app/api/admin/integrations/quickbooks/route';
import {recordContractorPaymentInQuickBooks} from '@/lib/integrations/quickbooks-contractor-payment';
import {GET as callback} from '../../apps/marketing/app/api/auth/quickbooks/callback/route';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('QB_ENVIRONMENT','sandbox');vi.stubGlobal('fetch',vi.fn());});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('production-only QuickBooks route boundaries',()=>{
 it('reports the environment cause without refreshing tokens in Admin status',async()=>{
  const response=await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks'));
  expect(await response.json()).toMatchObject({connected:false,reason:'production_environment_unverified'});expect(fetch).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
 });
 it('does not start a sandbox authorization from the production Admin',async()=>{
  const response=await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks?action=auth_url'));
  expect(response.status).toBe(503);expect(fetch).not.toHaveBeenCalled();
 });
 it('does not synchronize financial records through the wrong environment',async()=>{
  const response=await POST(new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'sync_expenses'})}));
  expect(response.status).toBe(503);expect(fetch).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
 });
 it('rejects a production callback before exchanging or persisting sandbox tokens',async()=>{
  const response=await callback(new NextRequest('https://www.elevateforhumanity.org/api/auth/quickbooks/callback?code=fixture&state=fixture'));
  expect(response.headers.get('location')).toContain('error=production_environment_unverified');expect(fetch).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
 });
 it('keeps contractor accounting unsynced without making financial requests',async()=>{
  const result=await recordContractorPaymentInQuickBooks(db,{contractorName:'Fixture',amountCents:100,enrollmentId:'fixture',providerTransferId:'fixture',memo:'fixture'});
  expect(result).toMatchObject({synced:false,reason:'QuickBooks production configuration is unverified.'});expect(fetch).not.toHaveBeenCalled();
 });
 it('preserves a verified production company read',async()=>{
  vi.stubEnv('QB_ENVIRONMENT','production');vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({CompanyInfo:{CompanyName:'Fixture company'}}),{status:200}));
  const response=await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks'));
  expect(await response.json()).toMatchObject({connected:true,company_name:'Fixture company'});expect(fetch).toHaveBeenCalledOnce();
 });
});
