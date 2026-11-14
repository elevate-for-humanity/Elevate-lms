import {expect,it} from 'vitest';
import {eligibleRepairEvents,repairIncidentFingerprint} from '@/lib/ai/runtime/code-repair-policy.mjs';
const failure=(time:number)=>({operation:'ai.chat',status:'failed',failure_category:'unknown',created_at:new Date(time*1000).toISOString()});
it('deduplicates one unresolved incident across commits and repeated failures',()=>{
 const before=eligibleRepairEvents([failure(1),failure(2),failure(3)])[0];
 const after=eligibleRepairEvents([failure(1),failure(2),failure(3),failure(4)])[0];
 expect(repairIncidentFingerprint(before)).toBe(repairIncidentFingerprint(after));
});
it('opens a distinct incident after observed recovery and the first new failure',()=>{
 const first=eligibleRepairEvents([failure(1),failure(2),failure(3)])[0];
 const recovery={...failure(4),id:'recovery-event',status:'completed'};
 expect(eligibleRepairEvents([failure(1),failure(2),failure(3),recovery,failure(5)])).toHaveLength(1);
 const next=eligibleRepairEvents([recovery,failure(5),failure(6),failure(7)])[0];
 expect(next.recoveryAnchor).toBe('recovery-event');
 expect(repairIncidentFingerprint(next)).not.toBe(repairIncidentFingerprint(first));
});
