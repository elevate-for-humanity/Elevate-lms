import test from 'node:test';import assert from 'node:assert/strict';
import {canRetirePendingDirectLaunch,retirePendingDirectLaunches} from './retire-pending-direct-launches.mjs';
const run={id:1,path:'.github/workflows/deploy-google-course-worker.yml',event:'workflow_dispatch',head_branch:'main',status:'pending'};
test('retirement applies only to an older waiting direct launcher, never an active job or another release',()=>{
 const jobs=[{name:'direct-release',status:'pending'}];
 assert.equal(canRetirePendingDirectLaunch(run,jobs,2),true);
 assert.equal(canRetirePendingDirectLaunch(run,jobs,1),false);
 assert.equal(canRetirePendingDirectLaunch({...run,event:'push'},jobs,2),false);
 assert.equal(canRetirePendingDirectLaunch({...run,path:'.github/workflows/deploy-admin.yml'},jobs,2),false);
 assert.equal(canRetirePendingDirectLaunch(run,[{name:'direct-release',status:'in_progress'}],2),false);
 assert.equal(canRetirePendingDirectLaunch(run,[{name:'build',status:'pending'}],2),false);
});
test('only the inspected waiting direct workflow is cancelled and no Google execution is touched',()=>{
 const calls=[];
 const result=retirePendingDirectLaunches({repository:'elevate-for-humanity/Elevate-lms',currentId:2,call:(path,method)=>{
  calls.push({path,method});
  if(path.includes('/workflows/'))return {workflow_runs:[run,{...run,id:2},{...run,id:3,status:'completed'}]};
  if(path.includes('/jobs?'))return {jobs:[{name:'direct-release',status:'pending'}]};
  return null;
 }});
 assert.deepEqual(result.retiredPendingDirectLaunches,[1]);assert.equal(result.activeExecutionsCancelled,0);
 assert.equal(calls.filter(c=>c.method==='POST').length,1);
});
