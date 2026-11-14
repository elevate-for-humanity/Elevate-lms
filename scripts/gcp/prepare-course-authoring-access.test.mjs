import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCourseAuthoringAccess} from './prepare-course-authoring-access.mjs';
const identity='elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com';
function mock({wrongIdentity=false,existing=false,mismatch=false,bound=false,predefined=false}={}) {
 const calls=[]; const run=args=>{calls.push(args);
 if(args[0]==='run')return JSON.stringify({spec:{template:{spec:{template:{spec:{serviceAccountName:wrongIdentity?'other':identity}}}}}});
 const role={name:'projects/elegant-racer-299721/roles/elevateCourseLessonAuthor',includedPermissions:mismatch?['*']:['aiplatform.endpoints.predict','serviceusage.services.use']};
 if(args[0]==='iam'&&args[2]==='list')return JSON.stringify(existing?[role]:[]);
 if(args[0]==='iam'&&args[2]==='describe')return JSON.stringify(role);
 if(args[1]==='get-iam-policy')return JSON.stringify({bindings:predefined?['roles/aiplatform.user','roles/serviceusage.serviceUsageConsumer'].map(role=>({role,members:['serviceAccount:'+identity]})):bound?[{role:'projects/elegant-racer-299721/roles/elevateCourseLessonAuthor',members:['serviceAccount:'+identity]}]:[]});return '';};return{run,calls};
}
test('manual predefined grants avoid custom-role administration entirely',()=>{const m=mock({predefined:true});const result=prepareCourseAuthoringAccess(m.run);assert.equal(result.coveredByExistingRoles,true);assert.equal(result.changed,false);assert.equal(m.calls.some(a=>a[0]==='iam'||a[1]==='add-iam-policy-binding'),false);});
test('only existing course identity receives two exact prediction permissions',()=>{const m=mock();const result=prepareCourseAuthoringAccess(m.run);assert.deepEqual(result.permissions,['aiplatform.endpoints.predict','serviceusage.services.use']);const grant=m.calls.find(a=>a[1]==='add-iam-policy-binding');assert.ok(grant.includes('--member=serviceAccount:'+identity));});
test('existing exact grant is idempotent',()=>{const m=mock({existing:true,bound:true});assert.equal(prepareCourseAuthoringAccess(m.run).changed,false);assert.equal(m.calls.some(a=>a.includes('create')||a.includes('add-iam-policy-binding')),false);});
test('identity or role mismatch cannot mutate access',()=>{for(const options of [{wrongIdentity:true},{existing:true,mismatch:true}]){const m=mock(options);assert.throws(()=>prepareCourseAuthoringAccess(m.run),/MISMATCH/);assert.equal(m.calls.some(a=>a.includes('create')||a.includes('add-iam-policy-binding')),false);}});
