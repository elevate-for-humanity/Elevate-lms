import test from 'node:test';
import assert from 'node:assert/strict';
import {profiles,mergedBrowserEnvironment,unusedBrowserVolumes,quotaContactEmail,reportRegionalQuota} from './restore-container-runtime.mjs';
test('web services retain original 8 GiB headroom for the 4 GiB Node heap',()=>{
 for(const name of ['marketing','admin','lms','store'])assert.deepEqual([profiles[name].cpu,profiles[name].memory],['4','8Gi']);
});
test('browser config restores missing fields without exposing a secret reference or replacing live values',()=>{
 const value=mergedBrowserEnvironment({STUDIO_BROWSER_SECRET:'archived',STUDIO_BROWSER_MAX_SESSIONS:'6',STUDIO_LEARNER_LMS_URL:'https://retired.code.run',PORT:'3100',NODE_ENV:'production'},
 [{name:'STUDIO_BROWSER_SECRET',valueFrom:{secretKeyRef:{name:'existing',key:'latest'}}},{name:'STUDIO_BROWSER_MAX_SESSIONS',value:'2'}]);
 assert.equal(value.STUDIO_BROWSER_SECRET,undefined);assert.equal(value.PORT,undefined);
 assert.equal(value.STUDIO_BROWSER_MAX_SESSIONS,'2');assert.equal(value.NODE_ENV,'production');
 assert.equal(value.STUDIO_LEARNER_LMS_URL,'https://app.elevateforhumanity.org');
});
test('only unmounted duplicates of the verified browser bucket are removed',()=>{
 const volume=(name,bucket)=>({name,csi:{driver:'gcsfuse.run.googleapis.com',volumeAttributes:{bucketName:bucket}}});
 const spec={containers:[{volumeMounts:[{name:'active',mountPath:'/var/lib/studio-browser-auth'}]}],volumes:[volume('active','owned'),volume('stale','owned'),volume('other','unrelated'),{name:'memory',emptyDir:{}}]};
 assert.deepEqual(unusedBrowserVolumes(spec,'owned'),['stale']);
});

test('valid quota contacts are accepted and malformed contacts are rejected',()=>{
 assert.equal(quotaContactEmail([undefined,'person@example.org']),'person@example.org');
 for(const value of ['person example.org','person@@example.org',' person@example.org','person@example.','@example.org'])assert.equal(quotaContactEmail([value]),undefined);
});

test('restoration only reads effective quotas and never submits an increase', async () => {
 const requests=[], logs=[];
 const results=await reportRegionalQuota({run:()=> 'test-token',report:value=>logs.push(value),request:async(url,options)=>{
   requests.push({url,options});
   return {ok:true,json:async()=>({dimensionsInfos:[{dimensions:{region:'us-central1'},details:{value:url.includes('MemAlloc')?'42949672960':'20000'}}]})};
 }});
 assert.deepEqual(results.map(x=>x.granted),[42949672960,20000]);
 assert.equal(requests.length,2);
 assert.ok(requests.every(x=>x.url.includes('/quotaInfos/')&&!x.options.method&&!x.options.body));
 assert.ok(results.every(x=>x.requestSubmitted===false));
 assert.ok(logs.every(x=>!x.includes('test-token')));
});
test('quota-read failure stops restoration rather than assuming capacity',async()=>{
 await assert.rejects(reportRegionalQuota({run:()=> 'token',request:async()=>({ok:false})}),/verify/);
 await assert.rejects(reportRegionalQuota({run:()=> 'token',request:async()=>({ok:true,json:async()=>({dimensionsInfos:[]})})}),/dimensions/);
});
