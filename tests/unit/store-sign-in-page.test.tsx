// @vitest-environment node
import {afterEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({redirect:vi.fn((url:string)=>{throw Error('redirect:'+url);})}));
vi.mock('next/navigation',()=>({redirect:mocks.redirect}));
import LoginPage from '../../apps/marketing/app/login/page';
import {StoreSignIn} from '../../components/store/StoreSignIn';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('Store-owned sign-in',()=>{
 it('renders Store sign-in locally with a safe commerce return',async()=>{
  vi.stubEnv('K_SERVICE','elevate-store-migration');
  const page=await LoginPage({searchParams:Promise.resolve({redirect:'https://store.elevateforhumanity.org/store/cart?plan=team'})});
  expect(page.type).toBe(StoreSignIn);expect(page.props.returnPath).toBe('/store/cart?plan=team');expect(mocks.redirect).not.toHaveBeenCalled();
 });
 it('cannot redirect Store authentication outside Store',async()=>{
  vi.stubEnv('K_SERVICE','elevate-store-migration');
  const page=await LoginPage({searchParams:Promise.resolve({next:'https://outside.example/collect'})});
  expect(page.props.returnPath).toBe('/store');expect(mocks.redirect).not.toHaveBeenCalled();
 });
 it('preserves Marketing canonical authentication behavior',async()=>{
  vi.stubEnv('K_SERVICE','elevate-marketing-migration');
  await expect(LoginPage({searchParams:Promise.resolve({redirect:'/store/cart'})})).rejects.toThrow('redirect:');
  const destination=new URL(mocks.redirect.mock.calls[0][0]);expect(destination.pathname).toBe('/login');expect(destination.searchParams.get('redirect')).toBe('/store/cart');
 });
});
