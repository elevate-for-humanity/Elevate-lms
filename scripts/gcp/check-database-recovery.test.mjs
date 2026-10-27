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
