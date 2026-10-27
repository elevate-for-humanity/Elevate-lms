import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStoreReleaseProvenance} from './verify-store-release-provenance.mjs';
const sha='a'.repeat(40),mainSha='b'.repeat(40);
function fixture({status='ahead',deployed=true,runSha=sha}={}){const calls=[];return {calls,sha,mainSha,token:'fixture-private-token',async request(url,options){calls.push(url);assert.equal(options.redirect,'error');return Response.json(url.includes('/compare/')?{status}:url.includes('/jobs?')?{jobs:[{name:'deploy',status:'completed',conclusion:deployed?'success':'skipped'}]}:{workflow_runs:[{id:123,head_sha:runSha,path:'.github/workflows/deploy-google-store-runtime.yml',status:'completed',conclusion:'success'}]});}};}
test('accepts the exact successful Store deployment through later operational-only main commits',async()=>{const f=fixture(),r=await verifyStoreReleaseProvenance(f);assert.equal(r.acceptedDeploymentRun,123);assert.equal(r.source,sha);assert.ok(!JSON.stringify(r).includes('private'));});
for(const [name,options]of [['unrelated source',{status:'diverged'}],['undeployed source',{deployed:false}],['another source',{runSha:'c'.repeat(40)}]])test('refuses '+name+' without creating any infrastructure',async()=>{await assert.rejects(verifyStoreReleaseProvenance(fixture(options)));});
test('invalid source values cannot enter API paths',async()=>{const f=fixture();await assert.rejects(verifyStoreReleaseProvenance({...f,sha:'../main'}));assert.equal(f.calls.length,0);});
