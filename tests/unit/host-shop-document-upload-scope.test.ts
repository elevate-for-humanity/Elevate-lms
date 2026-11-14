// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const state=vi.hoisted(()=>({boardId:'shop-a',upload:vi.fn(),write:vi.fn()}));
vi.mock('@/lib/partners/current-host-shop',()=>({requireCurrentHostShopPartner:async()=>({user:{id:'operator'},partner:{id:'shop-a'},db:{storage:{from:()=>({upload:state.upload})},from:state.write}})}));
vi.mock('@/lib/partner/board',()=>({getHostShopBoard:async()=>({partner:{id:state.boardId},documentStatuses:[]})}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
import {POST} from '@/apps/lms/app/api/host-shop/documents/route';
beforeEach(()=>{vi.clearAllMocks();state.boardId='shop-a';});
it.each(['shop-b',''])('rejects stale or absent form shop identity %s before uploading or writing',async partnerId=>{
 const data=new FormData();if(partnerId)data.set('partnerId',partnerId);data.set('documentType','supervisor_license');
 const response=await POST(new NextRequest('https://example.test/api/host-shop/documents',{method:'POST',body:data}));
 expect(response.status).toBe(409);expect(state.upload).not.toHaveBeenCalled();expect(state.write).not.toHaveBeenCalled();
});
it('rejects a board/context mismatch before uploading or writing',async()=>{
 state.boardId='shop-b';const data=new FormData();data.set('partnerId','shop-a');
 const response=await POST(new NextRequest('https://example.test/api/host-shop/documents',{method:'POST',body:data}));
 expect(response.status).toBe(409);expect(state.upload).not.toHaveBeenCalled();expect(state.write).not.toHaveBeenCalled();
});
