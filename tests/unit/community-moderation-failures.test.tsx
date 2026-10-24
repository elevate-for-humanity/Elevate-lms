import { Children, isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const state=vi.hoisted(()=>({results:{} as Record<string,{data:unknown;error:unknown;count?:number}>,revalidate:vi.fn(),role:vi.fn()}));
vi.mock('@/lib/auth/require-role',()=>({requireRole:state.role}));
vi.mock('next/cache',()=>({revalidatePath:state.revalidate}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let operation='read';const chain:Record<string,unknown>={};
 for(const method of ['select','order','limit','in','is','eq','maybeSingle'])chain[method]=()=>chain;
 chain.delete=()=>{operation='delete';return chain;};chain.update=()=>{operation='update';return chain;};
 chain.then=(resolve:(result:unknown)=>unknown)=>Promise.resolve(state.results[table+':'+operation]??{data:operation==='read'?[]:{id:'fixture'},error:null,count:0}).then(resolve);
 return chain;
}})}));
import CommunityAdminPage from '@/apps/admin/app/community/page';
type Action=(data:FormData)=>Promise<void>;
function nodes(root:ReactNode):Array<React.ReactElement<{children?:ReactNode;name?:string;value?:string;action?:Action}>>{
 if(!isValidElement<{children?:ReactNode;name?:string;value?:string;action?:Action}>(root))return[];
 return[root,...Children.toArray(root.props.children).flatMap(nodes)];
}
function findAction(root:ReactNode,field:string,value:string):Action{
 const form=nodes(root).find(node=>node.type==='form'&&nodes(node.props.children).some(child=>child.type==='input'&&child.props.name===field&&child.props.value===value));
 if(typeof form?.props.action!=='function')throw new Error('Expected moderation form missing');return form.props.action;
}
beforeEach(()=>{
 vi.clearAllMocks();state.results={};state.role.mockResolvedValue({user:{id:'fixture-operator'}});
 state.results['community_posts:read']={data:[{id:'fixture-post',user_id:'fixture-learner',content:'Fixture post',created_at:'2026-01-01T00:00:00Z'}],error:null};
 state.results['community_reports:read']={data:[{id:'fixture-report',reporter_id:'fixture-learner',target_type:'post',target_id:'fixture-post',reason:'spam',status:'open',created_at:'2026-01-01T00:00:00Z'}],error:null};
 state.results['profiles:read']={data:[{id:'fixture-learner',full_name:'Fixture Learner'}],error:null};
});
afterEach(cleanup);
it.each(['community_posts','study_groups','forum_topics','community_post_comments','community_post_likes','leaderboard_scores','community_reports','profiles'])('shows unavailable rather than empty moderation data when %s fails',async table=>{
 state.results[table+':read']={data:null,error:{code:'provider_unavailable'}};
 render(await CommunityAdminPage());
 expect(screen.getByRole('alert')).toHaveTextContent('Community data is temporarily unavailable');
 expect(screen.queryByText('No open community reports.')).not.toBeInTheDocument();
});
it.each([{type:'delete',table:'community_posts',field:'type',value:'post',message:'COMMUNITY_DELETE_FAILED'},{type:'update',table:'community_reports',field:'status',value:'resolved',message:'COMMUNITY_REPORT_UPDATE_FAILED'}])('does not revalidate after failed $type',async fixture=>{
 const page=await CommunityAdminPage();const submit=findAction(page,fixture.field,fixture.value);
 state.results[fixture.table+':'+fixture.type]={data:null,error:{code:'provider_unavailable'}};
 const data=new FormData();data.set('id','fixture-id');data.set(fixture.field,fixture.value);
 await expect(submit(data)).rejects.toThrow(fixture.message);expect(state.revalidate).not.toHaveBeenCalled();
});
it.each(['delete','update'])('does not claim success when %s matches no record',async operation=>{
 const page=await CommunityAdminPage();const table=operation==='delete'?'community_posts':'community_reports';const field=operation==='delete'?'type':'status';const value=operation==='delete'?'post':'resolved';
 state.results[table+':'+operation]={data:null,error:null};
 const data=new FormData();data.set('id','fixture-id');data.set(field,value);
 await expect(findAction(page,field,value)(data)).rejects.toThrow();expect(state.revalidate).not.toHaveBeenCalled();
});
it('revalidates after a confirmed report update',async()=>{
 const page=await CommunityAdminPage();const data=new FormData();data.set('id','fixture-report');data.set('status','resolved');
 await findAction(page,'status','resolved')(data);
 expect(state.role).toHaveBeenLastCalledWith(['admin','super_admin','staff']);expect(state.revalidate).toHaveBeenCalledWith('/community');
});
