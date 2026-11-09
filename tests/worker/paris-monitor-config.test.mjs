import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

function probe(overrides={}) {
  const result=spawnSync(process.execPath,['--input-type=module','-e',
    "import {PARIS_MONITOR_HEARTBEAT_FRESH_MS as heartbeat,PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT as attempts} from './lib/ultimate-course-builder/worker/paris-monitor-config.mjs';console.log(JSON.stringify({heartbeat,attempts}));"],
    {cwd:process.cwd(),env:{...process.env,...overrides},encoding:'utf8'});
  return result;
}
test('monitor operational defaults preserve prior timing and bounded recovery',()=>{
 const r=probe({PARIS_MONITOR_HEARTBEAT_FRESH_MS:'',PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT:''});
 assert.equal(r.status,0,r.stderr);
 assert.deepEqual(JSON.parse(r.stdout.trim()),{heartbeat:90000,attempts:3});
});
test('operator limits can be tuned without changing owner/lease authority',()=>{
 const r=probe({PARIS_MONITOR_HEARTBEAT_FRESH_MS:'120000',PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT:'2'});
 assert.equal(r.status,0,r.stderr);
 assert.deepEqual(JSON.parse(r.stdout.trim()),{heartbeat:120000,attempts:2});
});
test('invalid operational thresholds fail closed rather than silently weakening protections',()=>{
 for(const env of [
  {PARIS_MONITOR_HEARTBEAT_FRESH_MS:'9999999'},
  {PARIS_MONITOR_HEARTBEAT_FRESH_MS:'0'},
  {PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT:'-1'},
  {PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT:'NaN'},
 ]) {
  const r=probe(env);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/PARIS_MONITOR_INVALID_CONFIG/);
 }
});

test('configured zero recovery cap also blocks the newer incomplete-stage recovery path',()=>{
 const result=spawnSync(process.execPath,['--input-type=module','-e',`
  import assert from 'node:assert/strict';
  import {inspectCourseAutopilot as inspect} from './lib/ultimate-course-builder/worker/paris-monitor.mjs';
  for(const last_error of ['HTTP 503','ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization']) {
   const job={status:'failed',last_error,attempts:0,max_attempts:5,monitor:{enabled:true,repairId:'saved'}};
   assert.notEqual(inspect(job,{status:'running'}).action,'requeue');
  }
 `],{cwd:process.cwd(),env:{...process.env,PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT:'0'},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});

test('tuned heartbeat and recovery limits preserve live leases and publication refusal',()=>{
 const result=spawnSync(process.execPath,['--input-type=module','-e',`
  import assert from 'node:assert/strict';
  import {inspectCourseAutopilot as inspect} from './lib/ultimate-course-builder/worker/paris-monitor.mjs';
  const now=Date.parse('2026-11-09T02:00:00Z');
  const base={attempts:1,max_attempts:5,monitor:{enabled:true,recoveries:1}};
  const live={...base,status:'running',heartbeat_at:new Date(now-100000).toISOString(),lease_expires_at:new Date(now+300000).toISOString()};
  assert.equal(inspect(live,{status:'running'},now).state,'running');
  assert.equal(inspect({...live,heartbeat_at:new Date(now-200000).toISOString()},{status:'running'},now).action,'wait_for_lease');
  for(const last_error of ['HTTP 503','ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:synchronization']) {
   assert.equal(inspect({...base,status:'failed',last_error},{status:'running'},now).action,'requeue');
   assert.notEqual(inspect({...base,status:'failed',last_error,monitor:{enabled:true,recoveries:2}},{status:'running'},now).action,'requeue');
  }
  assert.equal(inspect({...base,status:'failed',last_error:'ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED'},{status:'running'},now).action,'none');
 `],{cwd:process.cwd(),env:{...process.env,PARIS_MONITOR_HEARTBEAT_FRESH_MS:'120000',PARIS_MONITOR_TRANSIENT_RECOVERY_LIMIT:'2'},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
