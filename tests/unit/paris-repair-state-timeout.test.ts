import {expect,it} from 'vitest';
import {IN_FLIGHT_REPAIR_TIMEOUT_MINUTES,inFlightRepairTimedOut,repairRunsSettled} from '@/lib/ai/runtime/code-repair-policy.mjs';

const now=Date.parse('2026-11-12T12:00:00Z');
const ago=(minutes:number)=>new Date(now-minutes*60_000).toISOString();

it('applies per-state in-flight timeouts and leaves dispatched to REPAIR_DISPATCH_NOT_CLAIMED',()=>{
 expect(IN_FLIGHT_REPAIR_TIMEOUT_MINUTES).toEqual({patching:60,validating:45,deploying:30,verifying:30});
 expect(inFlightRepairTimedOut({status:'patching',updated_at:ago(59)},now)).toBe(false);
 expect(inFlightRepairTimedOut({status:'patching',updated_at:ago(61)},now)).toBe(true);
 expect(inFlightRepairTimedOut({status:'validating',updated_at:ago(46)},now)).toBe(true);
 expect(inFlightRepairTimedOut({status:'deploying',updated_at:ago(29)},now)).toBe(false);
 expect(inFlightRepairTimedOut({status:'verifying',updated_at:ago(31)},now)).toBe(true);
 expect(inFlightRepairTimedOut({status:'dispatched',updated_at:ago(600)},now)).toBe(false);
 expect(inFlightRepairTimedOut({status:'patching',updated_at:'not-a-date'},now)).toBe(false);
 expect(inFlightRepairTimedOut({status:'validating',updated_at:ago(600),verification:{pullRequest:{number:1}}},now)).toBe(false);
});

it('requeues only when every owning workflow run is gone or completed',()=>{
 expect(repairRunsSettled([])).toBe(true);
 expect(repairRunsSettled([null,{status:'completed'}])).toBe(true);
 expect(repairRunsSettled([{status:'completed'},{status:'in_progress'}])).toBe(false);
 expect(repairRunsSettled([{status:'queued'}])).toBe(false);
});
