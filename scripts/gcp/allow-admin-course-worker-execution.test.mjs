import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeAdminCourseWorker} from './allow-admin-course-worker-execution.mjs';
test('grants read and execution only on both approved jobs and is idempotent',()=>{
 const policies=new Map(),writes=[];
 const identity='elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com';
 const run=args=>{
  if(args[1]==='services')return JSON.stringify({spec:{template:{spec:{serviceAccountName:identity}}}});
  const job=args[3];
  if(args[2]==='describe')return JSON.stringify({metadata:{name:job}});
  if(args[2]==='get-iam-policy')return JSON.stringify({bindings:policies.get(job)||[]});
  assert.equal(args[2],'add-iam-policy-binding');writes.push(args);
  const role=args.find(a=>a.startsWith('--role=')).slice(7);
  policies.set(job,[...(policies.get(job)||[]),{role,members:['serviceAccount:'+identity]}]);
  return '{}';
 };
 authorizeAdminCourseWorker(run);authorizeAdminCourseWorker(run);
 assert.equal(writes.length,4);
 assert.deepEqual([...new Set(writes.map(a=>a[3]))],['elevate-course-builder','elevate-course-builder-parallel']);
 assert.ok(writes.every(a=>a.includes('--project=elegant-racer-299721')));
 assert.ok(writes.every(a=>!a.some(flag=>flag.startsWith('--condition'))));
});
test('rejects an unrelated runtime identity before changing access',()=>{
 const calls=[];assert.throws(()=>authorizeAdminCourseWorker(args=>{calls.push(args);return JSON.stringify({spec:{template:{spec:{serviceAccountName:'other@elsewhere.iam.gserviceaccount.com'}}}});}),/ADMIN_RUNTIME/);assert.equal(calls.length,1);
});

