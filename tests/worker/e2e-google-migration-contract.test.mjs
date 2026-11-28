import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {load} from 'js-yaml';

const workflow=readFileSync(new URL('../../.github/workflows/e2e-desktop-chrome.yml',import.meta.url),'utf8');
const config=readFileSync(new URL('../../playwright.config.ts',import.meta.url),'utf8');
const jobs=load(workflow).jobs;
const shard=jobs['desktop-chrome-shard'];

test('browser shards connect to the separately provisioned QA project',()=>{
  assert.equal(shard.env.NEXT_PUBLIC_SUPABASE_URL,'${{ secrets.E2E_SUPABASE_URL }}');
  assert.equal(shard.env.SUPABASE_SERVICE_ROLE_KEY,'${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}');
  const preflight=shard.steps.findIndex(step=>step.run==='node scripts/qa/verify-e2e-service-config.mjs');
  const remaining=shard.steps.findIndex(step=>step.run==='node scripts/qa/provision-remaining-portal-e2e.mjs provision');
  const learner=shard.steps.findIndex(step=>step.run==='node scripts/qa/provision-learner-program-holder-e2e.mjs provision');
  const host=shard.steps.findIndex(step=>step.run==='node scripts/qa/provision-apprenticeship-e2e.mjs provision');
  const cleanup=shard.steps.find(step=>step.run?.trim()==='node scripts/qa/provision-apprenticeship-e2e.mjs cleanup');
  assert.ok(preflight>=0 && preflight<remaining && remaining<learner && learner<host);
  assert.ok(cleanup);
  assert.match(cleanup.if,/always\(\)/);
  // The consolidated provisioner rejects every non-QA host by default;
  // isolated PR shards must never supply its explicit production opt-in.
  assert.notEqual(shard.env.QA_E2E_ALLOW_PRODUCTION_DISPOSABLES,'1');
  assert.notEqual(shard.steps[host].env?.QA_E2E_ALLOW_PRODUCTION_DISPOSABLES,'1');
  assert.notEqual(cleanup.env?.QA_E2E_ALLOW_PRODUCTION_DISPOSABLES,'1');
  const fixture=readFileSync(new URL('../../scripts/qa/provision-apprenticeship-e2e.mjs',import.meta.url),'utf8');
  assert.match(fixture,/if \(!\(allowProductionDisposables && qaHostname === 'cuxzzpsyufcewtmicszk\.supabase\.co'\)\)/);
});
test('same dedicated QA identities are used for both legacy TEST and canonical E2E variables',()=>{
  for(const role of ['ADMIN','PROGRAM_HOLDER']){
    assert.equal(shard.env['TEST_'+role+'_EMAIL'],shard.env['E2E_'+role+'_EMAIL']);
    assert.equal(shard.env['E2E_'+role+'_EMAIL'],'${{ secrets.E2E_'+role+'_EMAIL }}');
  }
});
test('all authenticated responsive roles map to distinct required QA variable names',()=>{
  for(const role of ['APPRENTICE','EMPLOYER','INSTRUCTOR','STAFF','CASE_MANAGER','HOST_SHOP','LEARNER']){
    for(const part of ['EMAIL','PASSWORD']){
      const key='E2E_'+role+'_'+part;
      assert.equal(shard.env[key],'${{ secrets.'+key+' }}');
    }
  }
});
test('broad gate stops bounded failures without marking the suite successful',()=>{
  assert.match(config,/maxFailures: process\.env\.CI \? 12 : undefined/);
  assert.deepEqual(shard.strategy.matrix.shard,[1,2,3,4]);
  assert.ok(shard.steps.some(step=>step.run?.includes('pnpm test:e2e --shard=')));
});
test('superseded workflows can cancel and the aggregate admits only a passing matrix',()=>{
  const aggregate=jobs['desktop-chrome'];
  assert.equal(aggregate.if,'${{ !cancelled() }}');
  assert.deepEqual(aggregate.needs,['desktop-chrome-shard']);
  const check=aggregate.steps.find(step=>step.env?.SHARD_RESULT==='${{ needs.desktop-chrome-shard.result }}');
  assert.ok(check,'The gate needs the matrix result');
  for(const result of ['success','failure','skipped','cancelled','']){
    assert.equal(spawnSync('bash',['-c',check.run],{env:{SHARD_RESULT:result}}).status,result==='success'?0:1);
  }
});
