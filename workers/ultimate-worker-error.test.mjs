import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {describeWorkerError} from '../lib/ultimate-course-builder/core/worker-error.mjs';
test('provider errors retain hidden messages across realms',()=>{
 const error=vm.runInNewContext('new Error("render provider timeout")');
 assert.equal(JSON.stringify(error),'{}');
 assert.match(describeWorkerError(error),/render provider timeout/);
});
test('plain provider details and nested causes survive',()=>{
 assert.match(describeWorkerError({code:'503',details:'temporarily unavailable'}),/503.*temporarily unavailable/);
 assert.match(describeWorkerError(new Error('render failed',{cause:new Error('connection reset')})),/connection reset/);
});
test('empty and circular errors remain diagnosable',()=>{
 assert.notEqual(describeWorkerError({}),'{}');
 const error={};error.cause=error;
 assert.match(describeWorkerError(error),/CIRCULAR_WORKER_ERROR/);
});
