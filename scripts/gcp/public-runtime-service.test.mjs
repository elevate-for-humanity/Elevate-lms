import test from 'node:test';
import assert from 'node:assert/strict';
import {getPublicRuntimeService} from '../../lib/health/public-runtime-service.ts';
test('Cloud Run Store identity comes from the deployed service',()=>assert.equal(getPublicRuntimeService({K_SERVICE:'elevate-store-migration'}),'store'));
test('Marketing remains Marketing even with a stale Store flag',()=>assert.equal(getPublicRuntimeService({K_SERVICE:'elevate-marketing-migration',STORE_ONLY_RUNTIME:'true'}),'marketing'));
test('Local shared application defaults to Marketing and honors isolated Store runtime',()=>{
 assert.equal(getPublicRuntimeService({}),'marketing');assert.equal(getPublicRuntimeService({STORE_ONLY_RUNTIME:'true'}),'store');
});
