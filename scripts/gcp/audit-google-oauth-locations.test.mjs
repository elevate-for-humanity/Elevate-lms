import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scanCredentialLocations,auditGoogleOAuthLocations} from './audit-google-oauth-locations.mjs';
test('finds aliases, nested migration archives and credentials under unrelated names without exposing values',()=>{
 const id='123456-fixture.apps.googleusercontent.com', secret='GOCSPX-fixture-private';
 const input={runtimeEnvironment:{AUTH_GOOGLE_ID:id},sourceSecretGroupArchive:{group:{unrelated:JSON.stringify({client_id:id,client_secret:secret})}},runtimeFiles:{file:'GOOGLE_CLIENT_SECRET='+secret}};
 const rows=scanCredentialLocations(input), output=JSON.stringify(rows);
 assert(rows.some(row=>row.googleClientIdFormat));assert(rows.some(row=>row.googleClientSecretFormat));
 assert(!output.includes(id));assert(!output.includes(secret));
});
test('reports named empty values and bounds recursion',()=>{
 assert.equal(scanCredentialLocations({GOOGLE_CLIENT_SECRET:''})[0].nonEmpty,false);
 const cycle={};cycle.self=cycle;assert.doesNotThrow(()=>scanCredentialLocations(cycle));
});
test('does not print credential-shaped object keys',()=>{
 const id='123456-fixture.apps.googleusercontent.com';
 assert(!JSON.stringify(scanCredentialLocations({[id]:'GOCSPX-private'})).includes(id));
});
test('separates denied reads from absent credentials and performs no mutations',()=>{
 const calls=[],rows=[];
 const run=args=>{calls.push(args);const error=Error('private provider detail');error.code='permission_denied';throw error;};
 auditGoogleOAuthLocations({run,report:row=>rows.push(row),actionEnv:{AUDIT_OAUTH_GOOGLE_CLIENT_SECRET:'GOCSPX-private'}});
 assert(rows.some(row=>row.readError==='permission_denied'));
 assert(!JSON.stringify(rows).includes('GOCSPX-private'));assert(!JSON.stringify(rows).includes('private provider detail'));
 assert(calls.every(args=>args.includes('access')||args.includes('describe')||args.includes('list')));
});
