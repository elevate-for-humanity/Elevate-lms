// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest,NextResponse} from 'next/server';
const state=vi.hoisted(()=>({actor:'admin-a',authorized:true,limited:false,scopes:[] as any[],audit:vi.fn(),cookie:vi.fn()}));
vi.mock('@/lib/admin/guards',()=>({apiRequireRoles:async()=>state.authorized?{id:state.actor,email:'admin@example.test',role:'admin'}:{error:NextResponse.json({error:'Unauthorized'},{status:401})}}));
vi.mock('@/lib/api/admin-ip-guard',()=>({checkAdminIP:()=>null}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async(_r:Request,tier:string,scope:any)=>{
 state.scopes.push({tier,...scope});return state.limited?NextResponse.json({error:'Too many requests'},{status:429,headers:{'Retry-After':'60'}}):null;
}}));
vi.mock('@/lib/audit',()=>({logAuditEvent:state.audit}));
vi.mock('next/headers',()=>({cookies:async()=>({set:state.cookie})}));
vi.mock('@/lib/admin/portal-preview-handoff',()=>({createPortalPreviewHandoff:(actor:string,target:string)=>`${actor}:${target}`}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from(table:string){const filters:any={};const q:any={select:()=>q,eq:(k:string,v:string)=>{filters[k]=v;return q},maybeSingle:async()=>({data:table==='profiles'?{id:filters.id,full_name:'Host owner',email:'owner@example.test',role:'host_shop'}:{partner_id:filters.partner_id},error:null})};return q}})}));
import {POST} from '@/apps/admin/app/api/admin/impersonate/route';
const req=(target='owner',partner='styles')=>new NextRequest('https://admin.elevateforhumanity.org/api/admin/impersonate',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'203.0.113.10'},body:JSON.stringify({target_user_id:target,host_shop_partner_id:partner})});
beforeEach(()=>{state.actor='admin-a';state.authorized=true;state.limited=false;state.scopes=[];state.audit.mockReset();state.cookie.mockReset()});
it('verifies admin identity before consuming a preview allowance',async()=>{
 state.authorized=false;expect((await POST(req())).status).toBe(401);expect(state.scopes).toEqual([]);expect(state.cookie).not.toHaveBeenCalled();
});
it('opening four different shops no longer spends the three-request public strict bucket',async()=>{
 for(const shop of ['styles','country','top-shelf','salon'])expect((await POST(req('owner',shop))).status).toBe(200);
 expect(state.scopes).toHaveLength(4);expect(state.scopes.every(s=>s.tier==='auth'&&s.key==='admin-portal-preview:admin-a')).toBe(true);
 expect(state.audit).toHaveBeenCalledTimes(4);
});
it('two verified administrators behind one IP do not share their preview allowance',async()=>{
 await POST(req());state.actor='admin-b';await POST(req());expect(state.scopes.map(s=>s.key)).toEqual(['admin-portal-preview:admin-a','admin-portal-preview:admin-b']);
});
it('still enforces the bounded preview allowance without issuing a handoff or session',async()=>{
 state.limited=true;const response=await POST(req());expect(response.status).toBe(429);expect(response.headers.get('Retry-After')).toBe('60');expect(state.audit).not.toHaveBeenCalled();expect(state.cookie).not.toHaveBeenCalled();
});
it('sends the signed shop handoff directly to the hostname used by portal navigation',async()=>{
 const result=await (await POST(req())).json();expect(result.preview_url).toBe('https://lms.elevateforhumanity.org/api/admin/select-host-shop');expect(result.preview_handoff).toBe('admin-a:styles');
});
