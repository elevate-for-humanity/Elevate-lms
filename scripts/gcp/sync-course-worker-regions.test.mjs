import test from 'node:test';import assert from 'node:assert/strict';
import {syncCourseWorkerRegions} from './sync-course-worker-regions.mjs';
const image=n=>'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+n.repeat(64);
function fixture({same=false,missing=false,drift=false}={}){
 const job=img=>({spec:{template:{spec:{taskCount:2,parallelism:2,template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',timeoutSeconds:'10800',containers:[{image:img,resources:{limits:{cpu:'8',memory:'32Gi'}},env:[{name:'UNCHANGED',value:'retained'}]}]}}}}}});
 let regional=job(image(same?'a':'b'));const calls=[];
 return {calls,run:args=>{calls.push(args);if(args[2]==='update'){regional.spec.template.spec.template.spec.containers[0].image=image('a');if(drift)regional.spec.template.spec.parallelism=3;return '';}
 if(args.includes('--region=us-central1'))return JSON.stringify(job(image('a')));
 if(missing)throw Error('not_found');return JSON.stringify(regional);}};
}
test('only updates the existing regional image and preserves capacity, environment and task count',()=>{const f=fixture();assert.equal(syncCourseWorkerRegions(f.run).configurationPreserved,true);const mutation=f.calls.find(a=>a[2]==='update');assert.ok(mutation.includes('--image='+image('a')));assert.equal(mutation.some(a=>/--(cpu|memory|tasks|env|service-account)/.test(a)),false);});
test('matching images are idempotent and a missing approved worker is never created',()=>{const f=fixture({same:true});assert.equal(syncCourseWorkerRegions(f.run).changed,false);assert.equal(f.calls.length,2);const absent=fixture({missing:true});assert.throws(()=>syncCourseWorkerRegions(absent.run),/not_found/);assert.equal(absent.calls.some(a=>a[2]==='update'),false);});
test('configuration drift fails readback instead of reporting successful recovery',()=>{assert.throws(()=>syncCourseWorkerRegions(fixture({drift:true}).run),/READBACK_FAILED/);});
