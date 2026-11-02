import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyBuildDisk} from './run-bounded-build.mjs';
test('stops a build before ENOSPC instead of reporting an occupied slot',()=>{
 for(const availableBytes of [0,1024**3,NaN])assert.throws(()=>verifyBuildDisk({availableBytes}),/Build disk/);
 assert.doesNotThrow(()=>verifyBuildDisk({availableBytes:17*1024**3}));
});
