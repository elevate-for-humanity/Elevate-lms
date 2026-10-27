import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchRelease} from './dispatch-release.mjs';
const sha='a'.repeat(40);
test('legacy worker service maps to Google worker deployment on main',()=>{const calls=[];const r=dispatchRelease('elevate-ultimate-worker',{sha,run:args=>{calls.push(args);return args.includes('--jq')?sha:'';}});assert.equal(r.provider,'google-cloud-run');assert.equal(r.verifiedLive,false);assert.ok(calls[1].some(x=>x.includes('deploy-google-course-worker.yml/dispatches')));assert.ok(calls[1].includes('ref=main'));});
test('stale source commit never dispatches',()=>{let writes=0;assert.throws(()=>dispatchRelease('admin',{sha:'b'.repeat(40),run:args=>{if(args.includes('POST'))writes++;return sha;}}),/Only current main/);assert.equal(writes,0);});
test('rejects an old provider webhook without sending credentials',()=>{assert.throws(()=>dispatchRelease('https://old.example/webhook',{run:()=>assert.fail('must not call network')}),/webhook/);});
