// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const s = vi.hoisted(() => ({ role: vi.fn(), client: vi.fn(), admin: vi.fn(), employer: vi.fn(), update: vi.fn(), doc: null as any, docError: null as any, sign: vi.fn(), queries: [] as any[] }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: s.role }));
vi.mock('@/lib/supabase/server', () => ({ createClient: s.client }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: s.admin }));
vi.mock('@/lib/employer/employer-context', () => ({ getEmployerRecord: s.employer }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { saveEmployerProfile } from '@/apps/lms/app/employer/settings/actions';
import { GET } from '@/apps/lms/app/employer/documents/[id]/view/route';
const id = '11111111-2222-4333-8444-555555555555';
beforeEach(() => {
 vi.clearAllMocks(); s.queries=[]; s.docError=null;
 s.role.mockResolvedValue({ user: { id: 'test-employer-user' } });
 s.employer.mockResolvedValue({id:'test-employer-record'});
 s.doc={ id, user_id:'test-employer-user',file_path:'test-employer-user/recovered/document.pdf',metadata:{storage_bucket:'documents'}};
 s.update.mockReturnValue({ data:{id:'test-employer-record'},error:null });
 s.sign.mockResolvedValue({data:{signedUrl:'https://storage.example.test/signed/document'},error:null});
 s.admin.mockResolvedValue({storage:{from:()=>({createSignedUrl:s.sign})}});
 s.client.mockResolvedValue({from:(table:string)=>{
 const chain:any={select:()=>chain,eq:(...args:any[])=>{s.queries.push([table,...args]);return chain;},update:(payload:any)=>{s.update(payload);return chain;},maybeSingle:async()=>table==='documents'?{data:s.doc,error:s.docError}:s.update.mock.results.at(-1)?.value};return chain;
 }});
});
function profileForm() { const f=new FormData(); f.set('company_name','Test Employer'); f.set('state','tn'); f.set('contact_name','Test Contact');return f; }
it('test employer saves only its own company record and sees a success redirect',async()=>{
 const f=profileForm();f.set('approved','true');f.set('owner_user_id','another-user');f.set('role','admin');
 await expect(saveEmployerProfile(f)).rejects.toThrow('REDIRECT:/employer/settings?saved=1');
 expect(s.queries).toContainEqual(['employers','owner_user_id','test-employer-user']);
 expect(s.update).toHaveBeenCalledWith(expect.objectContaining({state:'TN',company_name:'Test Employer'}));
 const payload=s.update.mock.calls[0][0];expect(payload).not.toHaveProperty('approved');expect(payload).not.toHaveProperty('owner_user_id');expect(payload).not.toHaveProperty('role');
});
it('does not claim success when profile persistence fails',async()=>{
 s.update.mockReturnValue({data:null,error:new Error('offline')});await expect(saveEmployerProfile(profileForm())).rejects.toThrow('could not be saved');
});
it('rejects an unsafe website without writing',async()=>{const f=profileForm();f.set('website_url','javascript:alert(1)');await expect(saveEmployerProfile(f)).rejects.toThrow('Website must begin');expect(s.update).not.toHaveBeenCalled();});
it('does not write when employer identity is missing',async()=>{s.employer.mockResolvedValue(null);await expect(saveEmployerProfile(profileForm())).rejects.toThrow('not linked');expect(s.update).not.toHaveBeenCalled();});
it('checks role before querying company records',async()=>{s.role.mockRejectedValue(new Error('DENIED'));await expect(saveEmployerProfile(profileForm())).rejects.toThrow('DENIED');expect(s.client).not.toHaveBeenCalled();});
it('test employer opens its private recovered upload with a short-lived no-store redirect',async()=>{
 const result=await GET(new Request('https://portal.example.test'),{params:Promise.resolve({id})});
 expect(result.status).toBe(307);expect(s.queries).toContainEqual(['documents','user_id','test-employer-user']);expect(s.sign).toHaveBeenCalledWith('test-employer-user/recovered/document.pdf',60);expect(result.headers.get('cache-control')).toContain('no-store');
});
it('never signs another employer document',async()=>{s.doc=null;const response=await GET(new Request('https://portal.example.test'),{params:Promise.resolve({id})});expect(response.status).toBe(404);expect(s.admin).not.toHaveBeenCalled();});
it('database failures do not fall through to privileged storage',async()=>{s.docError=new Error('offline');const response=await GET(new Request('https://portal.example.test'),{params:Promise.resolve({id})});expect(response.status).toBe(503);expect(s.admin).not.toHaveBeenCalled();});
it('invalid identifiers cannot reach storage',async()=>{const response=await GET(new Request('https://portal.example.test'),{params:Promise.resolve({id:'invalid'})});expect(response.status).toBe(404);expect(s.client).not.toHaveBeenCalled();});
it('storage failure is visible instead of linking an unavailable file',async()=>{s.sign.mockResolvedValue({data:null,error:new Error('not found')});const response=await GET(new Request('https://portal.example.test'),{params:Promise.resolve({id})});expect(response.status).toBe(503);});

it('a mutable document row cannot sign a different employer storage path', async () => { s.doc.file_path='another-user/private.pdf'; const response=await GET(new Request('https://portal.example.test'),{params:Promise.resolve({id})}); expect(response.status).toBe(404); expect(s.admin).not.toHaveBeenCalled(); });
