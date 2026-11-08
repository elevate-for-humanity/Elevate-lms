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
