// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const s=vi.hoisted(()=>({role:vi.fn(),admin:vi.fn(),list:vi.fn(),lookup:vi.fn(),getUser:vi.fn(),create:vi.fn(),audit:vi.fn(),profile:vi.fn(),updates:[] as any[],employer:{} as any,existing:[] as any[],documents:[] as any[],copy:vi.fn()}));
vi.mock('@/lib/auth/require-role',()=>({requireRole:s.role}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:s.admin}));
vi.mock('@/lib/admin/audit-log',()=>({logAdminAudit:s.audit,AdminAction:{EMPLOYER_CREATED:'employer.created'}}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw new Error(`REDIRECT:${url}`)}}));
import {prepareEmployerAccount} from '@/apps/admin/app/employers/[id]/setup/actions';
const id='11111111-2222-4333-8444-555555555555';
function form(){const f=new FormData();f.set('employerId',id);return f;}
beforeEach(()=>{
 vi.clearAllMocks();s.existing=[];s.documents=[];s.copy.mockResolvedValue({error:null});s.updates=[];s.employer={id,email:'contact@fixture.test',company_name:'Test Employer',contact_name:'Test Contact',owner_user_id:null};
 s.lookup.mockImplementation(async()=>({data:s.existing.map(x=>({id:x.id,email:x.email})),error:null}));s.getUser.mockImplementation(async()=>({data:{user:s.existing[0]||null},error:null}));s.role.mockResolvedValue({user:{id:'admin'}});s.list.mockImplementation(async()=>({data:{users:s.existing},error:null}));s.create.mockResolvedValue({data:{user:{id:'prepared-user'}},error:null});s.profile.mockResolvedValue({error:null});
 s.admin.mockResolvedValue({rpc:s.lookup,storage:{from:()=>({copy:s.copy})},auth:{admin:{listUsers:s.list,getUserById:s.getUser,createUser:s.create}},from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,is:()=>q,then:(resolve:any)=>Promise.resolve({data:table==='documents'?s.documents:[],error:null}).then(resolve),single:async()=>({data:s.employer,error:null}),maybeSingle:async()=>({data:{id},error:null}),update:(payload:any)=>{s.updates.push({table,payload});return q},upsert:s.profile};return q}});
});
it('prepares an unconfirmed identity without a password or invitation',async()=>{
 await expect(prepareEmployerAccount(form())).rejects.toThrow(`REDIRECT:/employers/${id}/setup?prepared=1`);
 expect(s.create).toHaveBeenCalledWith(expect.objectContaining({email_confirm:false,app_metadata:{role:'employer',employer_id:id}}));
 expect(s.create.mock.calls[0][0]).not.toHaveProperty('password');
 expect(s.profile).toHaveBeenCalledWith(expect.objectContaining({verified:false,role:'employer'}),{onConflict:'id'});
 expect(s.updates).not.toContainEqual(expect.objectContaining({payload:expect.objectContaining({approved:true})}));
 expect(s.audit).toHaveBeenCalledWith(expect.objectContaining({metadata:expect.objectContaining({invitation_sent:false})}));
});
it('retry reuses only an identity previously prepared for this employer',async()=>{
 s.existing=[{id:'prepared-user',email:'contact@fixture.test',app_metadata:{role:'employer',employer_id:id}}];s.create.mockResolvedValue({data:{user:null},error:{code:'email_exists'}});
 await expect(prepareEmployerAccount(form())).rejects.toThrow('REDIRECT:');expect(s.getUser).toHaveBeenCalledWith('prepared-user');expect(s.list).not.toHaveBeenCalled();
});
it('refuses to repurpose an existing unrelated account',async()=>{
 s.existing=[{id:'unrelated',email:'contact@fixture.test',app_metadata:{role:'student'}}];s.create.mockResolvedValue({data:{user:null},error:{code:'email_exists'}});await expect(prepareEmployerAccount(form())).rejects.toThrow('ownership review');expect(s.profile).not.toHaveBeenCalled();expect(s.updates).toEqual([]);
});
it('repairs file links for a linked employer without creating another identity',async()=>{
 s.employer.owner_user_id='existing-user';await expect(prepareEmployerAccount(form())).rejects.toThrow('REDIRECT:');expect(s.list).not.toHaveBeenCalled();expect(s.create).not.toHaveBeenCalled();expect(s.updates).toEqual([]);
});
it('rejects placeholder addresses before changing account access',async()=>{s.employer.email='test@example.com';await expect(prepareEmployerAccount(form())).rejects.toThrow('contact address');expect(s.list).not.toHaveBeenCalled();});
it('requires administrator authorization before privileged work',async()=>{s.role.mockRejectedValue(new Error('DENIED'));await expect(prepareEmployerAccount(form())).rejects.toThrow('DENIED');expect(s.admin).not.toHaveBeenCalled();});

it('copies recovered files to the owner storage prefix before linking them',async()=>{
 s.documents=[{id:'file-id',user_id:null,file_path:'admin-documents/source.pdf',metadata:{storage_bucket:'documents'}}];
 await expect(prepareEmployerAccount(form())).rejects.toThrow('REDIRECT:');
 expect(s.copy).toHaveBeenCalledWith('admin-documents/source.pdf','prepared-user/recovered/file-id.pdf');
 expect(s.updates).toContainEqual({table:'documents',payload:expect.objectContaining({user_id:'prepared-user',file_path:'prepared-user/recovered/file-id.pdf',file_url:null})});
});
it('failed copies do not expose the source file or claim preparation succeeded',async()=>{
 s.documents=[{id:'file-id',user_id:null,file_path:'admin-documents/source.pdf',metadata:{storage_bucket:'documents'}}];s.copy.mockResolvedValue({error:{statusCode:'500'}});
 await expect(prepareEmployerAccount(form())).rejects.toThrow('could not be copied');
 expect(s.updates.filter(x=>x.table==='documents')).toEqual([]);expect(s.audit).not.toHaveBeenCalled();
});
it('does not link documents already assigned to a different identity',async()=>{s.documents=[{id:'file-id',user_id:'another-user'}];await expect(prepareEmployerAccount(form())).rejects.toThrow('another login');expect(s.copy).not.toHaveBeenCalled();});

it('accepts the exact-email ownership link made by the profile trigger',async()=>{
 s.create.mockImplementation(async()=>{s.employer.owner_user_id='prepared-user';return {data:{user:{id:'prepared-user'}},error:null};});
 await expect(prepareEmployerAccount(form())).rejects.toThrow('REDIRECT:');
 expect(s.updates.filter(x=>x.table==='employers')).toEqual([]);
});

it('does not enumerate unrelated identities when creating an employer',async()=>{s.list.mockRejectedValue(new Error('unreadable banned_until'));await expect(prepareEmployerAccount(form())).rejects.toThrow('REDIRECT:');expect(s.list).not.toHaveBeenCalled();expect(s.lookup).not.toHaveBeenCalled();});
it('fails closed if a failed create has no exact profile identity',async()=>{s.create.mockResolvedValue({data:{user:null},error:{code:'unexpected_failure'}});await expect(prepareEmployerAccount(form())).rejects.toThrow('exact email');expect(s.profile).not.toHaveBeenCalled();expect(s.updates).toEqual([]);});
it('does not adopt an identity returned for a different email',async()=>{s.create.mockResolvedValue({data:{user:null},error:{code:'email_exists'}});s.existing=[{id:'other',email:'other@fixture.test',app_metadata:{role:'employer',employer_id:id}}];await expect(prepareEmployerAccount(form())).rejects.toThrow('ownership review');expect(s.profile).not.toHaveBeenCalled();});
