// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({error:null as null|{message:string},auth:vi.fn()}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:m.auth}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/audit/withApiAudit',()=>({withApiAudit:(_path:string,handler:unknown)=>handler}));
vi.mock('@/lib/api/withRuntime',()=>({withRuntime:(handler:unknown)=>handler}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>({select:()=>({in:async()=>({data:['QB_CLIENT_ID','QB_CLIENT_SECRET','QB_ACCESS_TOKEN','QB_REFRESH_TOKEN','QB_REALM_ID'].map(key=>({key,value:'stored-private-value'})),error:m.error})})})})}));
import {GET} from '@/apps/admin/app/api/admin/payment-config/route';
beforeEach(()=>{vi.clearAllMocks();m.error=null;m.auth.mockResolvedValue({id:'admin',error:null});});
it('distinguishes saved authorization from a tested provider connection',async()=>{
 const r=await GET(new Request('https://admin.elevateforhumanity.org/api/admin/payment-config'));
 const body=await r.json();expect(body.quickbooks.authorizationConfigured).toBe(true);expect(body.quickbooks.connected).toBeNull();
 expect(body.billing.verification).toBe('not_performed');expect(body.billing.verificationPath).toBe('/api/admin/service-health');
 expect(JSON.stringify(body)).not.toContain('stored-private-value');
});
it('reports unreadable settings without leaking database errors',async()=>{m.error={message:'private database detail'};
 const r=await GET(new Request('https://admin.elevateforhumanity.org/api/admin/payment-config'));expect(r.status).toBe(503);expect(await r.text()).not.toContain('private database detail');
});
it('does not expose diagnostics without administrator authorization',async()=>{m.auth.mockResolvedValue({error:new Response('{}',{status:403})});
 expect((await GET(new Request('https://admin.elevateforhumanity.org/api/admin/payment-config'))).status).toBe(403);
});
