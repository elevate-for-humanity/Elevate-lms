import {expect,it} from 'vitest';
import {recoveredIncident,completedSourceIncident} from '@/lib/ai/runtime/repair-reconciliation';
import {canRetryRepair} from '@/lib/ai/runtime/code-repair-policy.mjs';
const repair={id:'original',status:'queued',goal:'Diagnose and repair the recurring unknown failure in ai.chat. Correlation: unavailable.',fingerprint:'ai.chat:unknown:'+'a'.repeat(40),updated_at:'2026-11-01T12:00:00Z'};
const recovered={id:'evidence',operation:'ai.chat',status:'completed',correlation_id:'incident-123',created_at:'2026-11-02T02:27:00Z'};
const correlatedRepair={...repair,goal:'Diagnose and repair the recurring unknown failure in ai.chat. Correlation: incident-123.'};
it('retires an older queued incident using an actual later recovery without certifying a repair',()=>{
 const result=recoveredIncident(correlatedRepair,[recovered]);
 expect(result).toMatchObject({replay:false,recoveryEventId:'evidence',verifiedRepair:false});
});
it('preserves active, course-specific, owner-written and newly failed repairs',()=>{
 for(const change of [{status:'patching'},{source_job_id:'source'},{goal:'Owner requested a specific correction'},{updated_at:'2026-11-02T02:29:00Z'}])expect(recoveredIncident({...correlatedRepair,...change},[recovered])).toBeNull();
 expect(recoveredIncident(correlatedRepair,[{...recovered,operation:'other'}])).toBeNull();
 expect(recoveredIncident(correlatedRepair,[])).toBeNull();
});
it('does not retire 59 uncorrelated historical repairs against one successful ai.chat call',()=>{
 expect(recoveredIncident(repair,[recovered])).toBeNull();
 expect(recoveredIncident(correlatedRepair,[{...recovered,correlation_id:null}])).toBeNull();
 expect(recoveredIncident(correlatedRepair,[{...recovered,correlation_id:'other'}])).toBeNull();
});
it('keeps a correlated repair open if the same incident failed after apparent recovery',()=>{
 expect(recoveredIncident(correlatedRepair,[recovered,{...recovered,id:'later-failure',status:'failed',created_at:'2026-11-02T02:29:00Z'}])).toBeNull();
 expect(recoveredIncident(correlatedRepair,[{...recovered,created_at:'2026-11-01T10:00:00Z'}])).toBeNull();
});
it('never retries a retired incident even if its earlier error was dispatch-retryable',()=>{
 expect(canRetryRepair({...repair,status:'blocked',attempt_count:1,error_code:'REPAIR_DISPATCH_NOT_CLAIMED',verification:{reconciliation:{replay:false}}})).toBe(false);
});

import {reconcileRecoveredRepairs} from '@/lib/ai/runtime/repair-reconciliation';
it('scans beyond the first page and retains original IDs under a compare-and-set update',async()=>{
 const writes:any[]=[];const filters:any[]=[];
 const rows=Array.from({length:201},(_,i)=>({...correlatedRepair,id:`original-${i}`}));
 const db={from:()=>{
  let values:any;const q:any={select:()=>q,in:()=>q,order:()=>q,range:async(a:number,b:number)=>({data:rows.slice(a,b+1),error:null}),update:(v:any)=>{values=v;return q;},eq:(key:string,value:any)=>{filters.push([key,value]);return q;},maybeSingle:async()=>{writes.push(values);return {data:{id:'confirmed'},error:null};}};return q;
 }};
 const result=await reconcileRecoveredRepairs(db,[recovered]);
 expect(result).toEqual({scanned:201,retired:201});
 expect(filters).toContainEqual(['id','original-200']);
 expect(filters).toContainEqual(['updated_at',repair.updated_at]);
 expect(writes.every(row=>row.status==='blocked'&&row.verification.reconciliation.verifiedRepair===false)).toBe(true);
});
it('surfaces persistence failure instead of claiming reconciliation succeeded',async()=>{
 const db={from:()=>{const q:any={select:()=>q,in:()=>q,order:()=>q,range:async()=>({data:null,error:Error('database failed')})};return q;}};
 await expect(reconcileRecoveredRepairs(db,[recovered])).rejects.toThrow('database failed');
});

it('classifies completed source jobs without claiming a deployed autonomous repair',()=>{
 const linked={...correlatedRepair,status:'blocked',source_job_id:'source-1',
  attempt_count:0,workflow_run_id:null,candidate:null,error_code:'SOURCE_DEFECT_RESOLVED'};
 const result=completedSourceIncident(linked,{id:'source-1',status:'completed'});
 expect(result).toEqual({disposition:'source_job_completed_acceptance_unverified',
  replay:false,sourceJobId:'source-1',sourceStatus:'completed',verifiedRepair:false});
 for(const change of [{attempt_count:1},{workflow_run_id:123},{candidate:{branch:{sha:'x'}}},
   {error_code:'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW'},{status:'validating'}]){
  expect(completedSourceIncident({...linked,...change},{id:'source-1',status:'completed'})).toBeNull();
 }
 expect(completedSourceIncident(linked,{id:'source-1',status:'failed'})).toBeNull();
 expect(completedSourceIncident(linked,{id:'unrelated',status:'completed'})).toBeNull();
});

it('batch reconciles only verified completed origin jobs while preserving failed work and history',async()=>{
 const linked={...correlatedRepair,status:'blocked',source_job_id:'source-1',
  attempt_count:0,workflow_run_id:null,candidate:null,error_code:'SOURCE_DEFECT_RESOLVED',
  attempt_history:[{error:'original-failure'}],verification:null};
 const stillFailed={...linked,id:'still-failed',source_job_id:'source-2'};
 const writes:any[]=[];const guards:any[]=[];
 const db={from:(table:string)=>{
  let values:any;
  const q:any={
   select:()=>q,order:()=>q,
   in:(key:string, ids:any[])=>table==='ultimate_build_jobs'
    ? Promise.resolve({data:[{id:'source-1',status:'completed'},{id:'source-2',status:'failed'}],error:null}):q,
   range:async(start:number)=>({data:start===0?[linked,stillFailed]:[],error:null}),
   update:(v:any)=>{values=v;return q;},
   eq:(key:string,value:any)=>{guards.push([key,value]);return q;},
   maybeSingle:async()=>{writes.push(values);return {data:{id:'original'},error:null};}
  };return q;
 }};
 const result=await reconcileRecoveredRepairs(db,[]);
 expect(result).toEqual({scanned:2,retired:1});
 expect(writes).toHaveLength(1);
 expect(writes[0]).toMatchObject({status:'blocked',verification:{reconciliation:{
  sourceJobId:'source-1',replay:false,verifiedRepair:false}}});
 expect(writes[0]).not.toHaveProperty('release_sha');
 expect(writes[0]).not.toHaveProperty('attempt_history');
 expect(guards).toContainEqual(['updated_at',linked.updated_at]);
});

it('fails closed when the batch source read cannot establish exact origin status',async()=>{
 const linked={...correlatedRepair,status:'blocked',source_job_id:'source-1',
  attempt_count:0,workflow_run_id:null,candidate:null,error_code:'SOURCE_DEFECT_RESOLVED'};
 const db={from:(table:string)=>{
  const q:any={select:()=>q,order:()=>q,
   in:()=>table==='ultimate_build_jobs' ? Promise.resolve({data:null,error:Error('source read denied')}) : q,
   range:async()=>({data:[linked],error:null})};return q;
 }};
 await expect(reconcileRecoveredRepairs(db,[])).rejects.toThrow('source read denied');
});
