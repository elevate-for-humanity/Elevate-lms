import {expect,it} from 'vitest';
import {recoveredIncident} from '@/lib/ai/runtime/repair-reconciliation';
import {canRetryRepair} from '@/lib/ai/runtime/code-repair-policy.mjs';
const repair={id:'original',status:'queued',goal:'Diagnose and repair the recurring unknown failure in ai.chat. Correlation: unavailable.',fingerprint:'ai.chat:unknown:'+'a'.repeat(40),updated_at:'2026-11-01T12:00:00Z'};
const recovered={id:'evidence',operation:'ai.chat',status:'completed',created_at:'2026-11-02T02:27:00Z'};
it('retires an older queued incident using an actual later recovery without certifying a repair',()=>{
 const result=recoveredIncident(repair,[recovered]);
 expect(result).toMatchObject({replay:false,recoveryEventId:'evidence',verifiedRepair:false});
});
it('preserves active, course-specific, owner-written and newly failed repairs',()=>{
 for(const change of [{status:'patching'},{source_job_id:'source'},{goal:'Owner requested a specific correction'},{updated_at:'2026-11-02T02:29:00Z'}])expect(recoveredIncident({...repair,...change},[recovered])).toBeNull();
 expect(recoveredIncident(repair,[{...recovered,operation:'other'}])).toBeNull();
 expect(recoveredIncident(repair,[])).toBeNull();
});
it('never retries a retired incident even if its earlier error was dispatch-retryable',()=>{
 expect(canRetryRepair({...repair,status:'blocked',attempt_count:1,error_code:'REPAIR_DISPATCH_NOT_CLAIMED',verification:{reconciliation:{replay:false}}})).toBe(false);
});

import {reconcileRecoveredRepairs} from '@/lib/ai/runtime/repair-reconciliation';
it('scans beyond the first page and retains original IDs under a compare-and-set update',async()=>{
 const writes:any[]=[];const filters:any[]=[];
 const rows=Array.from({length:201},(_,i)=>({...repair,id:`original-${i}`}));
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
