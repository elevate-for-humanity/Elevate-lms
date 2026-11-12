import {expect,it} from 'vitest';
import {classifyJob,errorCode,parseArgs} from '@/scripts/diagnose-course-builds.mjs';

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
