import {expect,it} from 'vitest';
// @vitest-environment node
import {classifyJob,diagnoseCourseBuilds,errorCode,parseArgs} from '@/scripts/diagnose-course-builds.mjs';

const now=Date.parse('2026-11-12T12:00:00Z');
const ago=(minutes:number)=>new Date(now-minutes*60_000).toISOString();
const build={id:'b',status:'failed',profile:{}};
const job=(over:any)=>({id:'j',status:'failed',attempts:1,max_attempts:3,last_error:null,...over});

it('routes each checkpoint to its own recovery path instead of a blanket reset',()=>{
 expect(classifyJob(job({last_error:'OWNER_COURSE_REVIEW_REQUIRED'}),build,{now}).action).toBe('release-path');
 expect(classifyJob(job({last_error:'WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER'}),build,{now}).action).toBe('successor-path');
 expect(classifyJob(job({attempts:3,last_error:'TEACHING_PHOTO_HASH: x'}),build,{now}).action).toBe('needs-code-change');
 expect(classifyJob(job({attempts:3,last_error:'TEACHING_PHOTO_HASH: x'}),build,{now,requeueCodes:['TEACHING_PHOTO_HASH']}).action).toBe('exhausted-requeue');
 expect(classifyJob(job({status:'running',lease_expires_at:ago(1),heartbeat_at:ago(40)}),build,{now}).action).toBe('dead-lease-requeue');
 expect(classifyJob(job({status:'running',attempts:3,lease_expires_at:ago(1),last_error:'INFERENCE_TIMEOUT: x'}),build,{now}).reason).toBe('LEASE_EXPIRED_RETRY_EXHAUSTED');
 expect(classifyJob(job({status:'running',attempts:3,lease_expires_at:ago(1),last_error:'INFERENCE_TIMEOUT: x'}),build,{now,requeueCodes:['INFERENCE_TIMEOUT']}).action).toBe('exhausted-requeue');
 expect(classifyJob(job({status:'running',lease_expires_at:ago(-5),heartbeat_at:ago(40)}),build,{now}).action).toBe('stuck-live-lease');
 expect(classifyJob(job({status:'running',lease_expires_at:ago(-5),heartbeat_at:ago(1)}),build,{now}).action).toBe('none');
 expect(classifyJob(job({}),build,{now,latestJobId:'other'}).action).toBe('superseded');
 expect(classifyJob(job({}),{...build,status:'published'},{now}).action).toBe('none');
});

it('parses flags and normalizes error codes',()=>{
 expect(errorCode('INFERENCE_TIMEOUT: after 90s')).toBe('INFERENCE_TIMEOUT');
 expect(parseArgs(['--hours','720','--requeue-codes','TEACHING_PHOTO_HASH, INFERENCE_TIMEOUT'])).toMatchObject({hours:720,apply:false,requeueCodes:['TEACHING_PHOTO_HASH','INFERENCE_TIMEOUT']});
 expect(()=>parseArgs(['--requeue-codes','drop table'])).toThrow('DIAGNOSE_REQUEUE_CODES_INVALID');
});

it('reports unclaimable queued jobs without authorizing an attempt reset',()=>{
 const queued = job({status:'queued',attempts:3,last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED: source review'});
 expect(classifyJob(queued,build,{now})).toMatchObject({action:'needs-code-change',reason:'QUEUED_RETRY_EXHAUSTED'});
 expect(classifyJob(queued,build,{now,requeueCodes:['ULTIMATE_INTERNAL_REPAIR_REQUIRED']})).toMatchObject({action:'needs-code-change',reason:'QUEUED_RETRY_EXHAUSTED'});
 expect(classifyJob({...queued,attempts:2},build,{now})).toMatchObject({action:'none',reason:'QUEUED'});
 expect(classifyJob({...queued,last_error:'OWNER_COURSE_REVIEW_REQUIRED'},build,{now}).action).toBe('release-path');
 expect(classifyJob({...queued,last_error:'WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER'},build,{now}).action).toBe('successor-path');
});

it('preserves owner pauses, archive/publication decisions and newer successor ownership',()=>{
 const queued = job({status:'queued',attempts:3});
 for (const status of ['published','archived']) expect(classifyJob(queued,{...build,status},{now}).action).toBe('none');
 expect(classifyJob(queued,{...build,profile:{ownerPaused:true}},{now}).reason).toBe('OWNER_PAUSED');
 expect(classifyJob(queued,build,{now,latestJobId:'successor'}).action).toBe('superseded');
});

// Exercise the complete read/report/apply boundary using a row-capped Data API
// fixture. A single-response mock would miss the production pagination bug.
function database(jobs:any[], builds:any[], {cap=1000, response}: {cap?:number;response?:(input:any)=>any}={}) {
 const writes:any[]=[];
 const reads:any[]=[];
 const db={from(table:string) {
  let selected='';
  const filters:Array<(row:any)=>boolean>=[];
  const orders:Array<{key:string;ascending:boolean}>=[];
  const query:any={
   select(columns:string,options:any){selected=columns;expect(options?.count).toBe('exact');return query;},
   gte(key:string,value:any){filters.push(row=>row[key]>=value);return query;},
   eq(key:string,value:any){filters.push(row=>row[key]===value);return query;},
   in(key:string,values:any[]){filters.push(row=>values.includes(row[key]));return query;},
   order(key:string,options:any={}){orders.push({key,ascending:options.ascending!==false});return query;},
   update(value:any){writes.push({table,value});throw Error('UNEXPECTED_DIAGNOSTIC_WRITE');},
   async range(start:number,end:number){
    const rows=[...(table==='ultimate_build_jobs'?jobs:builds)].filter(row=>filters.every(filter=>filter(row)));
    rows.sort((a,b)=>{for(const order of orders){if(a[order.key]===b[order.key])continue;return (a[order.key]<b[order.key]?-1:1)*(order.ascending?1:-1);}return 0;});
    const request={table,selected,start,end,total:rows.length};reads.push(request);
    return response?.(request)??{data:rows.slice(start,Math.min(end+1,start+cap)),error:null,count:rows.length};
   },
  };
  return query;
 }};
 return {db,writes,reads};
}
const queuedJob=(over:any={})=>({id:'j',build_id:'b',job_type:'complete_lesson',status:'queued',attempts:3,max_attempts:3,
 last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED: review source',execution_generation:7,updated_at:ago(60*48),created_at:ago(60*48),...over});
const queuedBuild={id:'b',course_id:'course',status:'running',profile:{title:'Fixture course'}};

it('includes old queued exhaustion outside the window and never mutates it in apply mode',async()=>{
 const {db,writes}=database([queuedJob()],[queuedBuild]);
 const report=await diagnoseCourseBuilds(db,{hours:24,now,apply:true,requeueCodes:['ULTIMATE_INTERNAL_REPAIR_REQUIRED']});
 expect(report.jobs).toHaveLength(1);
 expect(report.jobs[0]).toMatchObject({jobId:'j',action:'needs-code-change',reason:'QUEUED_RETRY_EXHAUSTED',attempts:3,maxAttempts:3});
 expect(report.jobs[0]).not.toHaveProperty('applied');
 expect(report.errorCounts).toEqual({ULTIMATE_INTERNAL_REPAIR_REQUIRED:1});
 expect(report.actions).toEqual({'needs-code-change':1});
 expect(writes).toEqual([]);
});

it('deduplicates recent and queued scans while respecting claimable jobs',async()=>{
 const {db}=database([queuedJob({updated_at:ago(5)}),queuedJob({id:'ready',job_type:'teaching_photo',attempts:1,updated_at:ago(5)})],[queuedBuild]);
 const report=await diagnoseCourseBuilds(db,{hours:24,now});
 expect(report.statusCounts).toEqual({queued:2});
 expect(report.jobs.map((row:any)=>row.jobId)).toEqual(['j']);
 expect(report.errorCounts).toEqual({ULTIMATE_INTERNAL_REPAIR_REQUIRED:1});
});

it('pages under a server row cap and finds the latest successor beyond the first page',async()=>{
 const jobs=[queuedJob(),queuedJob({id:'successor',status:'completed',created_at:ago(60),updated_at:ago(60*48)}),
  queuedJob({id:'other',build_id:'b2'})];
 const {db,reads}=database(jobs,[queuedBuild,{...queuedBuild,id:'b2'}],{cap:1});
 const report=await diagnoseCourseBuilds(db,{hours:24,now});
 expect(report.statusCounts).toEqual({queued:2});
 expect(report.jobs.map((row:any)=>row.jobId)).toEqual(['other']);
 expect(reads.some(row=>row.selected==='id,build_id,job_type,created_at'&&row.start===2)).toBe(true);
});

it.each(['queued','builds','latest'])('surfaces %s query failures instead of a clean report',async phase=>{
 const error=new Error('fixture read unavailable');
 const {db,writes}=database([queuedJob()],[queuedBuild],{response:input=>{
  if((phase==='queued'&&input.table==='ultimate_build_jobs'&&input.selected.includes('last_error'))||
     (phase==='builds'&&input.table==='ultimate_course_builds')||
     (phase==='latest'&&input.selected==='id,build_id,job_type,created_at'))return {data:null,error,count:null};
 }});
 await expect(diagnoseCourseBuilds(db,{hours:24,now,apply:true})).rejects.toBe(error);
 expect(writes).toEqual([]);
});

it('rejects an incomplete page rather than silently dropping queued work',async()=>{
 const {db}=database([queuedJob()],[queuedBuild],{response:()=>({data:[],error:null,count:1})});
 await expect(diagnoseCourseBuilds(db,{hours:24,now})).rejects.toThrow('COURSE_DIAGNOSTICS_SCAN_INCOMPLETE');
});

it('rejects repeated rows rather than looping when a server ignores offsets',async()=>{
 const {db}=database([queuedJob()],[queuedBuild],{response:()=>({data:[queuedJob()],error:null,count:2})});
 await expect(diagnoseCourseBuilds(db,{hours:24,now})).rejects.toThrow('COURSE_DIAGNOSTICS_SCAN_INCOMPLETE');
});
