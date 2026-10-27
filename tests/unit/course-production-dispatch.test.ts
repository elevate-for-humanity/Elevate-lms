import {expect,it,vi} from 'vitest';
import {recordCourseDispatch} from '@/lib/ultimate-course-builder/worker/dispatch-evidence';
import {recordProductionAlert} from '@/lib/ultimate-course-builder/worker/production-alert';
it('stores a dispatch acknowledgement with compare-and-swap without touching the job payload or lease',async()=>{
 const update=vi.fn();const filters:unknown[]=[];const monitor={enabled:true,recoveries:2};
 const q={select:()=>q,eq:(...args:unknown[])=>{filters.push(args);return q;},is:()=>q,single:async()=>({data:{monitor},error:null}),update:(value:unknown)=>{update(value);return q;},then:(resolve:(v:unknown)=>unknown)=>resolve({data:[{id:'job'}],error:null})};
 expect(await recordCourseDispatch({from:()=>q} as never,'job',{dispatched:true,launchMode:'cloud-run'},'admin')).toBe(true);
 expect(update.mock.calls[0][0]).toEqual({monitor:{...monitor,lastDispatch:expect.objectContaining({accepted:true,requestedBy:'admin'})}});
 expect(filters).toContainEqual(['monitor',JSON.stringify(monitor)]);
});
it('deduplicates alerts using the existing notification key and never changes saved course work',async()=>{
 const upsert=vi.fn().mockResolvedValue({error:null});
 await recordProductionAlert({from:()=>({upsert})} as never,{actorId:'11111111-1111-4111-8111-111111111111',buildId:'b',courseId:'c',eventKey:'lesson:one',title:'Lesson saved',message:'Ready for review'});
 expect(upsert).toHaveBeenCalledWith(expect.objectContaining({idempotency_key:'course-production:b:lesson:one',action_url:'/studio/courses?courseId=c'}),{onConflict:'idempotency_key',ignoreDuplicates:true});
});
it('logs notification transport failure without failing completed worker work',async()=>{
 const upsert=vi.fn().mockRejectedValue(new Error('Notification network timeout'));
 await expect(recordProductionAlert({from:()=>({upsert})} as never,{actorId:'11111111-1111-4111-8111-111111111111',buildId:'b',courseId:'c',eventKey:'lesson:one',title:'Saved',message:'Ready'})).resolves.toBeUndefined();
});
