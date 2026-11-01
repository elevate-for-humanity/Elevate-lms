// @vitest-environment node
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createQuickBooksOAuthState } from '@/lib/integrations/quickbooks-oauth-state';
const m=vi.hoisted(()=>({upsert:vi.fn()}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:vi.fn()}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:vi.fn().mockResolvedValue(null)}));
vi.mock('@/lib/supabase/admin',()=>({getAdminClient:async()=>({from:()=>({select:()=>({in:async()=>({data:[],error:null})}),upsert:m.upsert})})}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
import { GET } from '@/apps/marketing/app/api/auth/quickbooks/callback/route';
import { GET as learnerCallback } from '@/apps/lms/app/api/auth/quickbooks/callback/route';
beforeEach(()=>{
 vi.clearAllMocks();vi.stubEnv('QB_ENVIRONMENT','production');vi.stubEnv('QB_CLIENT_ID','test-client');vi.stubEnv('QB_CLIENT_SECRET','test-secret');vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://store.elevateforhumanity.org');
 m.upsert.mockResolvedValue({error:null});
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function request(){return new NextRequest('https://store.elevateforhumanity.org/api/auth/quickbooks/callback?code=test-code&realmId=123&state='+createQuickBooksOAuthState('test-secret'));}
function provider(tokens:any={access_token:'test-access',refresh_token:'test-refresh',expires_in:3600},company='123'){
 const send=vi.fn().mockResolvedValueOnce(Response.json(tokens)).mockResolvedValueOnce(Response.json({CompanyInfo:{Id:company}}));vi.stubGlobal('fetch',send);return send;
}
it('all callback hosts use the same verified and durable handler',()=>expect(learnerCallback).toBe(GET));
it('verifies company authorization, atomically saves tokens and returns Store buyers to Admin',async()=>{
 const send=provider();const result=await GET(request());
 expect(result.headers.get('location')).toBe('https://admin.elevateforhumanity.org/integrations/quickbooks?success=connected&company=123');
 expect(send).toHaveBeenCalledTimes(2);expect(m.upsert).toHaveBeenCalledTimes(1);
 expect(m.upsert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({key:'QB_ACCESS_TOKEN',value:'test-access'}),expect.objectContaining({key:'QB_REFRESH_TOKEN',value:'test-refresh'})]),{onConflict:'key'});
});
it('rejects a token response that would leave an old refresh token behind',async()=>{
 provider({access_token:'test-access'});const result=await GET(request());
 expect(result.headers.get('location')).toContain('invalid_token_response');expect(m.upsert).not.toHaveBeenCalled();
});
it('does not save authorization for a different company',async()=>{
 provider(undefined,'456');const result=await GET(request());
 expect(result.headers.get('location')).toContain('company_verification_failed');expect(m.upsert).not.toHaveBeenCalled();
});
it('does not claim connection success when token persistence fails',async()=>{
 provider();m.upsert.mockResolvedValue({error:{message:'test-storage-failure'}});
 expect((await GET(request())).headers.get('location')).toContain('error=unexpected');
});
