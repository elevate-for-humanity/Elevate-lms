// @vitest-environment node
import { Children, isValidElement, type ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({requireRole:vi.fn(),requireAdminClient:vi.fn(),insert:vi.fn(),single:vi.fn()}));
vi.mock('@/lib/auth/require-role',()=>({requireRole:state.requireRole}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:state.requireAdminClient}));
vi.mock('@/lib/admin/audit-log',()=>({logAdminAudit:vi.fn(),AdminAction:{EMPLOYER_CREATED:'employer.created'}}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw new Error('REDIRECT:'+url);}}));
import NewEmployerPage from '@/apps/admin/app/employers/new/page';
type FormAction=(data:FormData)=>Promise<void>;
function formAction(node:ReactNode):FormAction|undefined {
 if(!isValidElement<{action?:FormAction;children?:ReactNode}>(node))return;
 if(node.type==='form')return node.props.action;
 for(const child of Children.toArray(node.props.children)){const action=formAction(child);if(action)return action;}
}
beforeEach(()=>{
 vi.clearAllMocks();state.requireRole.mockResolvedValue({user:{id:'fixture-admin'}});
 state.single.mockResolvedValue({data:{id:'fixture-employer'},error:null});
 state.insert.mockReturnValue({select:()=>({single:state.single})});
 state.requireAdminClient.mockResolvedValue({from:()=>({insert:state.insert})});
});
async function action(){const result=formAction(await NewEmployerPage());if(!result)throw new Error('Employer form action missing');return result;}
it.each(['advisor','org_admin'])('rechecks authorization on direct server-action invocation by %s',async(role)=>{
 const submit=await action();state.requireRole.mockRejectedValueOnce(new Error('DENIED:'+role));
 await expect(submit(new FormData())).rejects.toThrow('DENIED:'+role);
 expect(state.requireAdminClient).not.toHaveBeenCalled();expect(state.insert).not.toHaveBeenCalled();
});
it('rejects an empty company name before loading the service-role client',async()=>{
 const submit=await action();const data=new FormData();data.set('name','   ');
 await expect(submit(data)).rejects.toThrow('EMPLOYER_NAME_REQUIRED');expect(state.requireAdminClient).not.toHaveBeenCalled();
});
it('creates a validated employer and redirects only after successful persistence',async()=>{
 const submit=await action();const data=new FormData();data.set('name',' Example Employer ');
 await expect(submit(data)).rejects.toThrow('REDIRECT:/employers/fixture-employer');
 expect(state.requireRole).toHaveBeenLastCalledWith(['admin','staff']);
 expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({name:'Example Employer',business_name:'Example Employer',company_name:'Example Employer',status:'pending',approved:false}));
});
it('does not claim success when persistence fails',async()=>{
 const submit=await action();state.single.mockResolvedValueOnce({data:null,error:{code:'provider_unavailable'}});
 const data=new FormData();data.set('name','Example Employer');
 await expect(submit(data)).rejects.toThrow('EMPLOYER_CREATE_FAILED');
});
