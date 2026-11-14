import test from 'node:test';
import assert from 'node:assert/strict';
import { productionBuildParity } from './production-build-parity-policy.mjs';
const sha = 'a'.repeat(40);
const services = () => ['marketing','admin','lms'].map(name => ({name, commitSha:sha, buildId:`${name === 'admin' ? 'admin' : 'elevate'}-${sha}`}));
test('accepts the actual admin and public app build prefixes for one commit', () => assert.equal(productionBuildParity(services()).ok,true));
test('rejects mixed deployed commits', () => {const rows=services();rows[0]={name:'marketing',commitSha:'b'.repeat(40),buildId:'elevate-'+'b'.repeat(40)};assert.equal(productionBuildParity(rows).ok,false);});
test('rejects missing or forged build provenance', () => {for(const value of ['unknown','other-build','elevate-'+'b'.repeat(40)]){const rows=services();rows[0].buildId=value;assert.equal(productionBuildParity(rows).ok,false);}});
test('requires all three distinct runtime services', () => {assert.equal(productionBuildParity(services().slice(1)).ok,false);assert.equal(productionBuildParity([services()[0],services()[0],services()[2]]).ok,false);});
