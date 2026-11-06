import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resumeRepairedJob} from '../../lib/ultimate-course-builder/worker/resume-repaired-job.mjs';
test('newer validated target is stored in resumed job payload',async()=>{
 const old='a'.repeat(40), current='b'.repeat(40);
 let write;
 const query={};
 for(const name of ['eq','is','select']) query[name]=()=>query;
 query.maybeSingle=async()=>({data:{...source,...write}});
 const db={from:()=>({update(value){write=value;return query;}})};
 const source={id:'job',status:'failed',execution_generation:1,attempts:1,payload:{},monitor:{enabled:true},lease_owner:null,lease_expires_at:null};
 const repair={id:'repair',release_sha:old,verification:{exactRuntimeSha:true}};
 const result=await resumeRepairedJob({db,source,repair,deploymentTargetSha:current});
 assert.equal(result.payload.codeRepairSha,current);
 assert.equal(result.monitor.repairDeployedSha,current);
 assert.equal(repair.release_sha,old);
});
