import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../../.github/workflows/e2e-desktop-chrome.yml',import.meta.url),'utf8');
const config=readFileSync(new URL('../../playwright.config.ts',import.meta.url),'utf8');

test('full browser job uses separately provisioned QA service credentials, not production DB key',()=>{
  const job=workflow.split('  desktop-chrome:')[1]?.split('  public-host-shop-category:')[0] ?? '';
  assert.match(job,/NEXT_PUBLIC_SUPABASE_URL:.*secrets\.E2E_SUPABASE_URL/);
  assert.match(job,/SUPABASE_SERVICE_ROLE_KEY:.*secrets\.E2E_SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(job,/SUPABASE_SERVICE_ROLE_KEY:.*secrets\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(job,/node scripts\/qa\/verify-e2e-service-config\.mjs/);
});
test('same dedicated QA identities are used for both legacy TEST and canonical E2E variables',()=>{
  const job=workflow.split('  desktop-chrome:')[1]?.split('  public-host-shop-category:')[0] ?? '';
  for(const role of ['ADMIN','PROGRAM_HOLDER']){
    assert.match(job,new RegExp('TEST_'+role+'_EMAIL:.*secrets\\.E2E_'+role+'_EMAIL'));
    assert.match(job,new RegExp('E2E_'+role+'_EMAIL:.*secrets\\.E2E_'+role+'_EMAIL'));
  }
});
test('all authenticated responsive roles map to distinct required QA variable names',()=>{
  const job=workflow.split('  desktop-chrome:')[1]?.split('  public-host-shop-category:')[0] ?? '';
  for(const role of ['APPRENTICE','EMPLOYER','INSTRUCTOR','STAFF','CASE_MANAGER','HOST_SHOP','LEARNER']){
    for(const part of ['EMAIL','PASSWORD']){
      assert.match(job,new RegExp('E2E_'+role+'_'+part+':.*secrets\\\\.E2E_'+role+'_'+part));
    }
  }
});
test('broad gate stops bounded failures without marking the suite successful',()=>{
  assert.match(config,/maxFailures: process\.env\.CI \? 12 : undefined/);
  assert.match(workflow,/run: pnpm test:e2e/);
});
