// @vitest-environment node
import {afterEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
vi.mock('@/lib/supabase/middleware',()=>({createMiddlewareSupabaseClient:vi.fn(),hasSupabaseAuthCookie:vi.fn()}));
import {middleware} from '../../apps/marketing/middleware';
afterEach(()=>vi.unstubAllEnvs());
describe('Store service isolation',()=>{
 it.each(['/privacy','/terms-of-service','/security-and-data-protection'])('serves the public purchase policy %s without a Marketing redirect',async path=>{
  vi.stubEnv('K_SERVICE','elevate-store-migration');
  const response=await middleware(new NextRequest('https://store.elevateforhumanity.org'+path));
  expect(response.headers.get('location')).toBeNull();expect(response.headers.get('x-middleware-next')).toBe('1');
 });
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

describe('single public Store ownership',()=>{
 it.each(['https://www.elevateforhumanity.org','https://elevateforhumanity.org','https://marketing.example.run.app'])('Marketing %s links Store pages to the dedicated Store runtime',async origin=>{
  vi.stubEnv('K_SERVICE','elevate-marketing-migration');
  const response=await middleware(new NextRequest(origin+'/store/cart?add=legacy83',{headers:{host:new URL(origin).host}}));
  expect(response.status).toBe(307);expect(response.headers.get('location')).toBe('https://store.elevateforhumanity.org/store/cart?add=legacy83');
 });
 it('the Store does not redirect its own storefront into a loop',async()=>{
  vi.stubEnv('K_SERVICE','elevate-store-migration');
  const response=await middleware(new NextRequest('https://store.elevateforhumanity.org/store/cart?add=legacy83'));
  expect(response.headers.get('location')).toBeNull();expect(response.headers.get('x-middleware-next')).toBe('1');
 });
});
