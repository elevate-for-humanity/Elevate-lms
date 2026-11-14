import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {photoProbeCode,probeCoursePhotoProvider} from './probe-course-photo-provider.mjs';

test('probe executes the real provider module and decodes the returned image',async()=>{
 const image=(await sharp({create:{width:1280,height:720,channels:3,background:'blue'}}).png().toBuffer()).toString('base64');
 const setup=`globalThis.fetch=async(url)=>{if(!String(url).includes('metadata.google.internal')&&!String(url).includes('/locations/global/publishers/google/models/gemini-3.1-flash-lite-image:generateContent'))throw Error('WRONG_PROBE_ENDPOINT');return {ok:true,json:async()=>String(url).includes('metadata.google.internal')?{access_token:'test-token'}:{candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:'${image}'}}]}}]}}};`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',setup+photoProbeCode],{
  cwd:fileURLToPath(new URL('../../',import.meta.url)),encoding:'utf8',timeout:10000,
  env:{...process.env,GOOGLE_CLOUD_PROJECT:'test-project',ULTIMATE_PHOTO_MODEL:'gemini-3.1-flash-image',ULTIMATE_PHOTO_REGION:'us'},
 });
 assert.equal(result.status,0,result.stderr);
 const evidence=JSON.parse(result.stdout.trim());
 assert.equal(evidence.photoProviderVerified,true);
 assert.equal(evidence.provider,'google');
 assert.equal(evidence.model,'gemini-3.1-flash-lite-image');
 assert.equal(evidence.region,'global');
 assert.ok(evidence.bytes>0);
 assert.equal(evidence.width,1280);assert.equal(evidence.height,720);
 assert.match(evidence.sha256,/^[a-f0-9]{64}$/);
 assert.ok(!result.stdout.includes('test-token'));
});

const source={spec:{template:{spec:{taskCount:3,parallelism:3,template:{spec:{serviceAccountName:'existing-course-identity',containers:[{image:'worker@sha256:exact',env:[{name:'EXISTING_SETTING',value:'preserved'}]}]}}}}}};
test('capacity failure does not mutate or execute a probe job',async()=>{
 const calls=[];
 await assert.rejects(probeCoursePhotoProvider({run:args=>{calls.push(args);return JSON.stringify(source);},capacityCheck:async()=>({fits:false})}),/PHOTO_PROBE_CAPACITY_UNAVAILABLE/);
 assert.equal(calls.length,1);
 assert.ok(calls[0].includes('describe'));
});
test('probe keeps the deployed image and identity and runs one bounded task',async()=>{
 const calls=[];let replaced;
 await probeCoursePhotoProvider({run:args=>{
  calls.push(args);
  if(args.includes('describe'))return JSON.stringify(source);
  if(args.includes('replace'))replaced=JSON.parse(readFileSync(args[3],'utf8'));
  return '';
 },capacityCheck:async({region,task})=>{
  assert.equal(region,'us-east1');assert.equal(task.timeoutSeconds,300);assert.equal(task.maxRetries,0);
  return {fits:true};
 }});
 const spec=replaced.spec.template.spec,task=spec.template.spec;
 assert.equal(spec.taskCount,1);assert.equal(spec.parallelism,1);
 assert.equal(task.serviceAccountName,'existing-course-identity');
 assert.equal(task.containers[0].image,'worker@sha256:exact');
 assert.deepEqual(task.containers[0].env,source.spec.template.spec.template.spec.containers[0].env);
 assert.deepEqual(task.containers[0].args,['--input-type=module','-e',photoProbeCode]);
 assert.equal(calls.filter(args=>args.includes('execute')).length,1);
 assert.ok(calls.find(args=>args.includes('execute')).includes('--wait'));
});
