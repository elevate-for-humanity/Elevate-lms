import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ existing: null as any, lookupError: null as any, recorded: vi.fn(), updated: vi.fn(), partner: { id:'shop', name:'Shop', status:'active', approval_status:'approved', program_type:'barber', programs:[] } as any }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth:{getUser:async()=>({data:{user:{id:'signer',email:'signer@example.test'}}})} }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({from:(table:string)=>{
 const q:any={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>table==='partner_users'?{data:{partner_id:'shop',partners:state.partner}}:{data:state.existing,error:state.lookupError},update:(value:unknown)=>{state.updated(value);return {eq:async()=>({error:null})};}};return q;
}}) }));
vi.mock('@/lib/signatures/electronic-signature-service', () => ({recordMouSignature:(...args:any[])=>state.recorded(...args)}));
import { POST } from '@/apps/lms/app/api/host-shop/mou/sign/route';
const request=()=>new Request('https://lms.elevateforhumanity.org/api/host-shop/mou/sign',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({program:'barber',signerName:'Signer',agreed:true})});
beforeEach(()=>{vi.clearAllMocks();state.existing=null;state.lookupError=null;state.partner.status='active';state.recorded.mockResolvedValue({id:'signature'});});
it('records a full document snapshot before changing onboarding state',async()=>{
 expect((await POST(request())).status).toBe(200);
 const signed=state.recorded.mock.calls[0][1];expect(signed.payload.partnerId).toBe('shop');expect(signed.payload.sections.length).toBeGreaterThan(3);expect(signed.payload.signerName).toBe('Signer');
 expect(state.recorded.mock.invocationCallOrder[0]).toBeLessThan(state.updated.mock.invocationCallOrder[0]);
});
it('preserves the original signature timestamp and version on retry',async()=>{
 state.existing={id:'original',signed_at:'2026-01-01T00:00:00Z',mou_version:'original-version'};
 expect((await POST(request())).status).toBe(200);expect(state.recorded).not.toHaveBeenCalled();expect(state.updated).toHaveBeenCalledWith(expect.objectContaining({mou_signed_at:state.existing.signed_at,mou_version:'original-version'}));
});
it('does not mark the MOU signed when signature storage fails',async()=>{
 state.recorded.mockRejectedValue(new Error('storage failed'));expect((await POST(request())).status).toBe(503);expect(state.updated).not.toHaveBeenCalled();
});
it('does not overwrite signature state when prior records cannot load',async()=>{
 state.lookupError={message:'unavailable'};expect((await POST(request())).status).toBe(503);expect(state.recorded).not.toHaveBeenCalled();expect(state.updated).not.toHaveBeenCalled();
});
it('blocks archived shop signature writes',async()=>{
 state.partner.status='archived';expect((await POST(request())).status).toBe(403);expect(state.recorded).not.toHaveBeenCalled();expect(state.updated).not.toHaveBeenCalled();
});
