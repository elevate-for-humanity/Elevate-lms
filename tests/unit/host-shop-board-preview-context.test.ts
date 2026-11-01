// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({cookie: undefined as string|undefined, preview: null as any, role:'admin', filters:[] as any[]}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>state.cookie?{value:state.cookie}:undefined})}));
vi.mock('@/lib/admin/host-shop-preview',()=>({resolveHostShopAdminPreview:async()=>state.preview}));
import { resolvePartnerForBoard } from '@/lib/partner/board';
const db={from(table:string){let id='';const q:any={};q.select=()=>q;q.eq=(key:string,value:string)=>{if(key==='id')id=value;state.filters.push([table,key,value]);return q};q.maybeSingle=async()=>({data:table==='profiles'?{role:state.role}:{id},error:null});q.then=(resolve:any)=>Promise.resolve({data:[{partner_id:'owner-partner',partners:{id:'owner-partner'}}],error:null}).then(resolve);return q}};
beforeEach(()=>{state.cookie=undefined;state.preview=null;state.role='admin';state.filters=[]});
it('resolves the signed Styles selection when the companion selector cookie is missing',async()=>{
 state.preview={actorId:'admin',partnerId:'styles'};
 expect((await resolvePartnerForBoard(db,'admin')).id).toBe('styles');
});
it('does not let a stale Country Cuts selector override the signed Styles selection',async()=>{
 state.cookie='country';state.preview={actorId:'admin',partnerId:'styles'};
 expect((await resolvePartnerForBoard(db,'admin')).id).toBe('styles');
 expect(state.filters).not.toContainEqual(['partners','id','country']);
});
it('does not borrow another administrators signed selection',async()=>{
 state.preview={actorId:'different-admin',partnerId:'country'};
 await expect(resolvePartnerForBoard(db,'admin')).rejects.toThrow('HOST_SHOP_ADMIN_PARTNER_REQUIRED');
});
it('retains the existing authenticated administrator selector fallback',async()=>{
 state.cookie='styles';expect((await resolvePartnerForBoard(db,'admin')).id).toBe('styles');
});
it('ordinary shop owners still resolve only their active membership',async()=>{
 state.role='host_shop';state.cookie='country';state.preview={actorId:'admin',partnerId:'styles'};
 expect((await resolvePartnerForBoard(db,'owner')).id).toBe('owner-partner');
});
