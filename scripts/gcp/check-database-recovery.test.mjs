import test from 'node:test';
import assert from 'node:assert/strict';
import { assessDatabaseRecovery, checkDatabaseRecovery } from './check-database-recovery.mjs';
const now = Date.parse('2026-10-15T12:00:00Z');
test('completed recent daily backups supply metadata evidence, not object or restore acceptance', () => {
  const report = assessDatabaseRecovery({backups:[{status:'COMPLETED',inserted_at:'2026-10-15T00:00:00Z'}]}, now);
  assert.equal(report.databaseRecovery, 'recent_recovery_point');
  assert.equal(report.ageHours, 12);
  assert.equal(report.objectBackup, 'not_covered_by_database_backup');
  assert.equal(report.restoreTest, 'not_performed');
});
test('physical recovery points are supported', () => {
  assert.equal(assessDatabaseRecovery({pitr_enabled:true,physical_backup_data:{latest_physical_backup_date_unix:now/1000-60}}, now).databaseRecovery, 'recent_recovery_point');
});
test('empty, failed, invalid, stale and future records never produce success', () => {
  for (const body of [{}, {backups:[{status:'FAILED',inserted_at:new Date(now).toISOString()}]},
    {backups:[{status:'COMPLETED',inserted_at:'invalid'}]},
    {backups:[{status:'COMPLETED',inserted_at:'2026-10-01T00:00:00Z'}]},
    {physical_backup_data:{latest_physical_backup_date_unix:now/1000+100}}])
    assert.equal(assessDatabaseRecovery(body, now).databaseRecovery, 'unverified_or_stale');
});
test('missing credentials and wrong project fail before any request', async () => {
  for (const env of [{}, {SUPABASE_PROJECT_ID:'other',SUPABASE_ACCESS_TOKEN:'secret'}])
    await assert.rejects(checkDatabaseRecovery({env,request:()=>{throw new Error('must not request');}}), /required/);
});
test('provider failure is redacted and is never treated as backup success', async () => {
  await assert.rejects(checkDatabaseRecovery({env:{SUPABASE_PROJECT_ID:'cuxzzpsyufcewtmicszk',SUPABASE_ACCESS_TOKEN:'secret'},
    request:async (url, options)=>{
      assert.equal(options.method,'GET');
      assert.equal(options.headers.Authorization,'Bearer secret');
      return {ok:false,status:403,json:()=>{throw new Error('private response');}};
    }}), /HTTP 403/);
});
test('transport and malformed responses never disclose provider error text', async () => {
  const env = {SUPABASE_PROJECT_ID:'cuxzzpsyufcewtmicszk',SUPABASE_ACCESS_TOKEN:'secret'};
  for (const request of [async()=>{throw new Error('private transport detail');},
    async()=>({ok:true,json:async()=>{throw new Error('private response detail');}})]) {
    await assert.rejects(checkDatabaseRecovery({env,request}), error =>
      !error.message.includes('private') && !error.message.includes('secret') && error.message.includes('no success inferred'));
  }
});

import { readFileSync } from 'node:fs';
test('a populated expired token does not shadow another configured credential', async () => {
  const seen=[];
  const report=await checkDatabaseRecovery({env:{SUPABASE_PROJECT_ID:'cuxzzpsyufcewtmicszk',SUPABASE_ACCESS_TOKEN:'expired',SUPABASE_MANAGEMENT_API_KEY:'expired',SUPABASE_TOKEN:'valid'},request:async(url,options)=>{
    seen.push(options.headers.Authorization);
    return options.headers.Authorization==='Bearer valid'
      ? {ok:true,json:async()=>({backups:[{status:'COMPLETED',inserted_at:new Date().toISOString()}]})}
      : {ok:false,status:401};
  }});
  assert.deepEqual(seen,['Bearer expired','Bearer valid']);
  assert.equal(report.databaseRecovery,'recent_recovery_point');
});
test('an expired Actions token falls back to encrypted runtime management authority without leaking either credential', async () => {
  const requests=[];
  const report=await checkDatabaseRecovery({env:{SUPABASE_PROJECT_ID:'cuxzzpsyufcewtmicszk',SUPABASE_ACCESS_TOKEN:'expired',SUPABASE_SERVICE_ROLE_KEY:'service'},request:async(url,options)=>{
    requests.push({url,options});
    if(requests.length===1)return {ok:false,status:401};
    if(requests.length===2){assert.match(url,/\/rest\/v1\/rpc\/get_platform_secret$/);assert.equal(options.headers.apikey,'service');return {ok:true,json:async()=>'runtime-management'};}
    assert.equal(options.headers.Authorization,'Bearer runtime-management');
    return {ok:true,json:async()=>({backups:[{status:'COMPLETED',inserted_at:new Date().toISOString()}]})};
  }});
  assert.equal(report.databaseRecovery,'recent_recovery_point');
  assert.equal(requests.length,3);
  assert.ok(!JSON.stringify(report).includes('runtime-management'));
});
test('production recovery workflow uses protected secrets and never applies migrations', () => {
  const workflow = readFileSync('.github/workflows/db-backup.yml', 'utf8');
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /Confirm backup-read credential is bound to production/);
  const exactSecretBinding = 'SUPABASE_ACCESS_TOKEN: ' +
    '${{ secrets.SUPABASE_ACCESS_TOKEN || secrets.SUPABASE_MANAGEMENT_API_KEY || secrets.SUPABASE_TOKEN }}';
  // Verify both production steps use the same exact protected secret binding.
  // Do not weaken this assertion to a generic name-only substring match.
  assert.equal(workflow.split(exactSecretBinding).length - 1, 2);
  assert.match(workflow, /SUPABASE_PROJECT_ID: cuxzzpsyufcewtmicszk/);
  assert.match(workflow, /check-database-recovery\.mjs/);
  assert.doesNotMatch(workflow, /\bsupabase db push\b|\bpsql\b|\bapply_migration\b/i);
});
