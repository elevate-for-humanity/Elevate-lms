import test from 'node:test';
import assert from 'node:assert/strict';
import {portalRoles,requirePortalIdentities} from './require-portal-e2e-identities.mjs';
test('missing identities fail before authenticated suites can silently skip',()=>{
 assert.throws(()=>requirePortalIdentities({}),/E2E_FIXTURES_MISSING:E2E_APPRENTICE_EMAIL/);
 const env=Object.fromEntries(portalRoles.flatMap(role=>['EMAIL','PASSWORD'].map(kind=>[`E2E_${role}_${kind}`,'private-fixture'])));
 delete env.E2E_ADMIN_PASSWORD;
 assert.throws(()=>requirePortalIdentities(env),error=>error.message==='E2E_FIXTURES_MISSING:E2E_ADMIN_PASSWORD'&&!error.message.includes('private-fixture'));
});
test('all nine roles are required without disclosing their credentials',()=>{
 const env=Object.fromEntries(portalRoles.flatMap(role=>['EMAIL','PASSWORD'].map(kind=>[`E2E_${role}_${kind}`,'private-fixture'])));
 assert.deepEqual(requirePortalIdentities(env),{roles:9,credentialsComplete:true});
});

test('focused employer acceptance requires only its dedicated identity', () => {
 const env = {EMPLOYER_ONLY:'true', E2E_EMPLOYER_EMAIL:'fixture@example.invalid'};
 assert.throws(() => requirePortalIdentities(env), /E2E_FIXTURES_MISSING:E2E_EMPLOYER_PASSWORD$/);
 assert.deepEqual(requirePortalIdentities({...env, E2E_EMPLOYER_PASSWORD:'fixture'}), {roles:1, credentialsComplete:true});
});

test('live acceptance names the exact missing GitHub secret', () => {
 const env = { EMPLOYER_ONLY: 'true', PORTAL_E2E_SECRET_SCOPE: 'production', E2E_EMPLOYER_EMAIL: 'fixture@qa.invalid' };
 assert.throws(() => requirePortalIdentities(env), /E2E_FIXTURES_MISSING:PRODUCTION_E2E_EMPLOYER_PASSWORD$/);
});

test('live acceptance requires its own database and distinct role accounts', () => {
 const env = {
   PORTAL_E2E_SECRET_SCOPE: 'production',
   NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co',
   ...Object.fromEntries(portalRoles.flatMap(role => [
     [`E2E_${role}_EMAIL`, `${role}@qa.invalid`], [`E2E_${role}_PASSWORD`, 'fixture-password'],
   ])),
 };
 assert.deepEqual(requirePortalIdentities(env), {roles:9, credentialsComplete:true});
 assert.throws(() => requirePortalIdentities({...env, NEXT_PUBLIC_SUPABASE_URL:'https://isdgjcdabhxxozarmxta.supabase.co'}), /PRODUCTION_E2E_SUPABASE_TARGET_MISMATCH/);
 assert.throws(() => requirePortalIdentities({...env, E2E_EMPLOYER_EMAIL:' ADMIN@qa.invalid '}), /PRODUCTION_E2E_ROLE_IDENTITIES_MUST_BE_DISTINCT/);
});
