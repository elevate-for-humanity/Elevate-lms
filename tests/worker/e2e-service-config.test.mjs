import test from 'node:test';
import assert from 'node:assert/strict';
import {auditE2EServiceConfiguration} from '../../scripts/qa/verify-e2e-service-config.mjs';

function testEnv() {
  const keys=['NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
    'TEST_ADMIN_EMAIL','TEST_ADMIN_PASSWORD','TEST_STUDENT_EMAIL','TEST_STUDENT_PASSWORD',
    'TEST_PROGRAM_HOLDER_EMAIL','TEST_PROGRAM_HOLDER_PASSWORD',
    'E2E_ADMIN_EMAIL','E2E_ADMIN_PASSWORD',
    'E2E_PROGRAM_HOLDER_EMAIL','E2E_PROGRAM_HOLDER_PASSWORD',
    'E2E_HOST_SHOP_EMAIL','E2E_HOST_SHOP_PASSWORD',
    'E2E_APPRENTICE_EMAIL','E2E_APPRENTICE_PASSWORD',
    'E2E_EMPLOYER_EMAIL','E2E_EMPLOYER_PASSWORD',
    'E2E_INSTRUCTOR_EMAIL','E2E_INSTRUCTOR_PASSWORD',
    'E2E_STAFF_EMAIL','E2E_STAFF_PASSWORD',
    'E2E_CASE_MANAGER_EMAIL','E2E_CASE_MANAGER_PASSWORD'];
  return {NEXT_PUBLIC_SUPABASE_URL:'https://separate-e2e-qa.supabase.co',
    ...Object.fromEntries(keys.map(k=>[k,'fixture-not-a-secret']))};
}
test('isolated QA and matching identities pass preflight without network requests',()=>{
  assert.deepEqual(auditE2EServiceConfiguration(testEnv()),{ok:true,missing:[],failures:[]});
});
test('missing authenticated Admin credentials fail immediately, not after hours of redirects',()=>{
  const env=testEnv();delete env.TEST_ADMIN_PASSWORD;
  const res=auditE2EServiceConfiguration(env);
  assert.equal(res.ok,false);
  assert.ok(res.missing.includes('TEST_ADMIN_PASSWORD'));
});
test('local dev E2E never uses the production student database',()=>{
  const res=auditE2EServiceConfiguration({...testEnv(),NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co'});
  assert.ok(res.failures.includes('E2E_LOCAL_TESTS_TARGET_PRODUCTION_SUPABASE'));
});
test('public URL override does not masquerade as three isolated test servers',()=>{
  const res=auditE2EServiceConfiguration({...testEnv(),PLAYWRIGHT_BASE_URL:'https://www.elevateforhumanity.org'});
  assert.ok(res.failures.some(e=>e.endsWith('PLAYWRIGHT_BASE_URL')));
});
