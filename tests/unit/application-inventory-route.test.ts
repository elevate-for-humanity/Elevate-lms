// @vitest-environment node
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {NextRequest,NextResponse} from 'next/server';
const mocks=vi.hoisted(()=>({guard:vi.fn(),inventory:vi.fn()}));
vi.mock('@/lib/admin/guards',()=>({apiRequireRoles:mocks.guard}));
vi.mock('@/lib/google/application-inventory.mjs',()=>({getApplicationInventory:mocks.inventory}));
import {GET} from '../../apps/admin/app/api/admin/application-inventory/route';
const request=()=>new NextRequest('https://admin.elevateforhumanity.org/api/admin/application-inventory');
describe('application inventory authorization',()=>{
 beforeEach(()=>{vi.clearAllMocks();});
 it('rejects unauthenticated access before contacting Google',async()=>{
  mocks.guard.mockResolvedValue({error:NextResponse.json({error:'Unauthorized'},{status:401})});
  expect((await GET(request())).status).toBe(401);expect(mocks.inventory).not.toHaveBeenCalled();
 });
 it('rejects staff without infrastructure-management authorization',async()=>{
  mocks.guard.mockResolvedValue({error:NextResponse.json({error:'Forbidden'},{status:403})});
  expect((await GET(request())).status).toBe(403);
  expect(mocks.guard).toHaveBeenCalledWith(expect.any(NextRequest),['super_admin','admin']);
  expect(mocks.inventory).not.toHaveBeenCalled();
 });
 it('returns an uncached read-only inventory to authorized administrators',async()=>{
  mocks.guard.mockResolvedValue({id:'approved-admin'});mocks.inventory.mockResolvedValue({applications:[],failures:[]});
  const response=await GET(request());expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual({applications:[],failures:[]});expect(mocks.inventory).toHaveBeenCalledOnce();
 });
});
