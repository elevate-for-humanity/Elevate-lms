import { expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:vi.fn()}));
import { loadApprovedSchoolApplicants } from '@/lib/program-holder/school-applicants';
const partner='11111111-1111-4111-8111-111111111111';
it('uses explicit school and assigned-program scope without fetching restricted contacts',async()=>{
 const calls:any[]=[];const q:any={select:(s:string)=>{calls.push(['select',s]);return q;},in:(k:string,v:any)=>{calls.push([k,v]);return q;},order:()=>q,range:async()=>({data:[{id:'application',first_name:'Student',last_name:'Name',status:'accepted'}],error:null})};
 const rows=await loadApprovedSchoolApplicants({from:()=>q},{school_partner_ids:[partner]},[{slug:'barber-apprenticeship'}],false);
 expect(calls).toContainEqual(['partner_id',[partner]]);expect(calls).toContainEqual(['program_interest',['barber-apprenticeship']]);
 expect(calls).toContainEqual(['status',['accepted','enrolled']]);
 expect(calls[0][1]).not.toContain('email');expect(calls[0][1]).not.toContain('phone');
 expect(rows[0].roster_source).toBe('school_application');expect(rows[0].user_id).toBeUndefined();
});
it('does not infer school ownership from a name or contact email',async()=>{
 const from=vi.fn();expect(await loadApprovedSchoolApplicants({from},{contact_email:'school@example.org'},[{slug:'barber-apprenticeship'}],true)).toEqual([]);expect(from).not.toHaveBeenCalled();
});
it('does not display a failed school lookup as no students',async()=>{
 const q:any={select:()=>q,in:()=>q,order:()=>q,range:async()=>({data:null,error:new Error('offline')})};
 await expect(loadApprovedSchoolApplicants({from:()=>q},{school_partner_ids:[partner]},[{slug:'barber-apprenticeship'}],true)).rejects.toThrow('offline');
});

it('includes new school applications only when requested and keeps the same school scope', async () => {
 const filters: [string, unknown][] = [];
 const query = {select:()=>query,in:(key:string,value:unknown)=>{filters.push([key,value]);return query;},order:()=>query,range:async()=>({data:[],error:null})};
 await loadApprovedSchoolApplicants({from:()=>query},{school_partner_ids:[partner]},[{slug:'cosmetology-apprenticeship'}],true,true);
 expect(filters).toContainEqual(['partner_id',[partner]]);
 expect(filters).toContainEqual(['program_interest',['cosmetology-apprenticeship']]);
 expect(filters).toContainEqual(['status',['submitted','pending','under_review','applied','accepted','enrolled']]);
});
