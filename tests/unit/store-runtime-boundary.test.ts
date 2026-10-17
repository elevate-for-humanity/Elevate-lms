// @vitest-environment node
import {afterEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
vi.mock('@/lib/supabase/middleware',()=>({createMiddlewareSupabaseClient:vi.fn(),hasSupabaseAuthCookie:vi.fn()}));
import {middleware} from '../../apps/marketing/middleware';
afterEach(()=>vi.unstubAllEnvs());
describe('Store service isolation',()=>{
 it.each(['/api/webhooks/paypal-billing','/api/webhooks/quickbooks','/api/auth/signin','/api/store/cart-checkout'])('handles %s locally while Marketing is unavailable',async path=>{
  vi.stubEnv('K_SERVICE','elevate-store-migration');
  const response=await middleware(new NextRequest('https://store.elevateforhumanity.org'+path,{method:'POST'}));
  expect(response.headers.get('location')).toBeNull();expect(response.headers.get('x-middleware-next')).toBe('1');
 });
 it('does not broaden Store access to unrelated webhooks',async()=>{
  vi.stubEnv('K_SERVICE','elevate-store-migration');
  const response=await middleware(new NextRequest('https://store.elevateforhumanity.org/api/webhooks/jotform',{method:'POST'}));
  expect(response.headers.get('location')).toBe('https://www.elevateforhumanity.org/api/webhooks/jotform');
 });
});
