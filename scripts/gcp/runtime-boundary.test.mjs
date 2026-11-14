import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeBoundary} from './runtime-boundary.mjs';
test('serving boundary exposes identity, resources and references without credential values',()=>{
 const report=runtimeBoundary({metadata:{name:'store-ready',annotations:{'autoscaling.knative.dev/maxScale':'1'}},spec:{serviceAccountName:'store-runtime',containers:[{image:'image@sha256:approved',resources:{limits:{cpu:'1',memory:'2Gi'}},env:[
 {name:'QB_REFRESH_TOKEN',value:'private-refresh-token'},
 {name:'NEXT_PUBLIC_SUPABASE_URL',value:'https://private-user:private-password@tenant.supabase.co/private-path?token=private-query'},
 {name:'STUDIO_BROWSER_SECRET',valueFrom:{secretKeyRef:{name:'studio-secret',key:'3'}}}],volumeMounts:[{name:'auth',mountPath:'/auth'}]}],volumes:[{name:'auth',csi:{driver:'gcsfuse.run.googleapis.com'}}]},status:{conditions:[{type:'Ready',status:'True'}]}});
 assert.equal(report.serviceAccount,'store-runtime');assert.equal(report.ready,true);assert.equal(report.maxInstances,'1');
 assert.deepEqual(report.containers[0].endpoints,[{variable:'NEXT_PUBLIC_SUPABASE_URL',host:'tenant.supabase.co',secretReference:false}]);
 assert.deepEqual(report.containers[0].secretReferences,[{variable:'STUDIO_BROWSER_SECRET',secret:'studio-secret',version:'3'}]);
 assert.equal(report.sessionRestorationVerified,false);
 for(const secret of ['private-refresh-token','private-user','private-password','private-path','private-query'])assert.equal(JSON.stringify(report).includes(secret),false);
});
test('missing or non-HTTPS endpoints remain unknown',()=>{
 const report=runtimeBoundary({spec:{containers:[{env:[{name:'SUPABASE_URL',value:'not a URL'},{name:'STUDIO_BROWSER_URL',value:'http://private-host'}]}]}});
 assert.equal(report.ready,false);assert.equal(report.maxInstances,null);
 assert.ok(report.containers[0].endpoints.every(e=>e.host===null));
});
