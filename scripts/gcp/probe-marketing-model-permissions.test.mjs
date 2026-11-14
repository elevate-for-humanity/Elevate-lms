import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marketingPermissionsManifest,probeMarketingModelPermissions,PERMISSIONS_PROBE_SOURCE} from './probe-marketing-model-permissions.mjs';
const identity='elevate-marketing-runtime@elegant-racer-299721.iam.gserviceaccount.com';
const image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/marketing@sha256:'+'a'.repeat(64);
const name='elevate-marketing-permissions-123-1';
test('bounded permission probe attaches no application settings or secret references',()=>{
 const manifest=marketingPermissionsManifest({identity,image,name});
 const task=manifest.spec.template.spec.template.spec;
 assert.equal(task.serviceAccountName,identity);assert.equal(task.timeoutSeconds,90);assert.equal(task.maxRetries,0);
 assert.deepEqual(task.containers[0].resources.limits,{cpu:'1',memory:'512Mi'});
 assert.equal(task.containers[0].env,undefined);assert.equal(task.volumes,undefined);
 assert.ok(PERMISSIONS_PROBE_SOURCE.includes('testIamPermissions'));assert.ok(!PERMISSIONS_PROBE_SOURCE.includes(':access'));
 for(const change of [{identity:'other@elegant-racer-299721.iam.gserviceaccount.com'},{image:'node:22'},{name:'other-job'}])assert.throws(()=>marketingPermissionsManifest({identity,image,name,...change}),/UNVERIFIED/);
});
function fixture({tamper=false}={}){
 let task;const calls=[];
 const run=args=>{
  calls.push(args);
  if(args.includes('services'))return JSON.stringify({status:{traffic:[{revisionName:'elevate-marketing-migration-serving',percent:100}]}});
  if(args.includes('revisions'))return JSON.stringify({spec:{serviceAccountName:identity,containers:[{image}]}});
  if(args.includes('replace')){task=JSON.parse(readFileSync(args[3],'utf8')).spec.template.spec.template.spec;return '';}
  if(args.includes('execute'))return '';
  if(args.includes('executions'))return JSON.stringify({spec:{template:{spec:tamper?{...task,serviceAccountName:'other'}:task}},status:{conditions:[{type:'Completed',status:'True'}],succeededCount:1}});
  if(args.includes('jobs'))return JSON.stringify({spec:{template:{spec:{template:{spec:task}}}},status:{latestCreatedExecution:{name:name+'-abc'}}});
  if(args.includes('logging'))return JSON.stringify([{jsonPayload:{probe:'marketing-model-permissions',modelInvocation:{verifiedResponse:true,granted:true,httpStatus:200},modelCredential:{verifiedResponse:true,granted:true,httpStatus:200},unexpected:'private-fixture'}}]);
  throw Error('Unexpected operation');
 };
 return {run,calls};
}
test('capacity failure creates no job and changes no permissions',async()=>{
 const f=fixture();await assert.rejects(probeMarketingModelPermissions({name,run:f.run,capacity:async()=>({fits:false})}),/CAPACITY_REQUIRED/);
 assert.ok(!f.calls.some(args=>args.includes('replace')));
});
test('only the immutable serving identity and complete exact probe can certify effective access',async()=>{
 const f=fixture();const result=await probeMarketingModelPermissions({name,run:f.run,capacity:async()=>({fits:true})});
 assert.equal(result.verified,true);assert.equal(result.modelInvocation.granted,true);assert.equal(result.permissionsChanged,false);
 assert.ok(!JSON.stringify(result).includes('private-fixture'));assert.ok(!f.calls.some(args=>args.includes('add-iam-policy-binding')));
 const changed=fixture({tamper:true});await assert.rejects(probeMarketingModelPermissions({name,run:changed.run,capacity:async()=>({fits:true})}),/EXECUTION_IDENTITY_UNVERIFIED/);
});
