import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseBuiltCourseAdmin} from './release-built-course-admin.mjs';
const sha='a'.repeat(40),expectedCommit='b'.repeat(40),revision='elevate-studio-browser-00045-wer';
function fixture(options={}){
 const admin={spec:{template:{metadata:{annotations:{'run.googleapis.com/startup-cpu-boost':'false','run.googleapis.com/cpu-throttling':'false'}},spec:{serviceAccountName:'existing-admin',containers:[{image:'old-immutable',env:[{name:'PRIVATE',valueFrom:{secretKeyRef:{name:'preserved',key:'1'}}}],resources:{limits:{cpu:'4',memory:'8Gi'}}}]}}},status:{url:'https://admin-fixture.a.run.app',latestCreatedRevisionName:'old',traffic:[{revisionName:'old',percent:100}]}};
 const studio={status:{traffic:[{revisionName:'owner',percent:100},{revisionName:revision,percent:0,tag:'studio-verify',url:'https://studio-verify---fixture.a.run.app'},{revisionName:revision,percent:0,tag:'course-qa-711c558f9db9',url:'https://course-qa-711c558f9db9---fixture.a.run.app'}]}};
 if(options.servingCandidate)studio.status.traffic[1].percent=1;
 const calls=[];
 const run=args=>{calls.push(args);
  if(args[0]==='artifacts')return 'sha256:'+'d'.repeat(64);
  if(args[1]==='jobs'&&args[2]==='executions')return JSON.stringify(options.activeExecutions?[{status:{startTime:'active'}}]:[]);
  if(args[1]==='jobs')return JSON.stringify({spec:{template:{spec:{template:{spec:{containers:[{env:[{name:'ULTIMATE_LEARNER_RUNTHROUGH_URL',value:'https://course-qa-711c558f9db9---fixture.a.run.app/learner/runthrough'}]}]}}}}}});
  if(args[1]==='revisions')return JSON.stringify({spec:{containers:[{resources:{limits:{cpu:'2',memory:'4Gi'}}}]}});
  const state=args[3]==='elevate-admin-migration'?admin:studio;
  if(args[2]==='update-traffic'){
   const removing=args.find(a=>a.startsWith('--remove-tags='));
   if(removing)studio.status.traffic=studio.status.traffic.filter(t=>!removing.slice(14).split(',').includes(t.tag));
   else for(const pair of args.find(a=>a.startsWith('--update-tags=')).slice(14).split(',')){const [tag,target]=pair.split('=');studio.status.traffic.push({revisionName:target,percent:0,tag});}
  }
  if(args[2]==='update'){
   admin.spec.template.spec.containers[0].image=args.find(a=>a.startsWith('--image=')).slice(8);
   admin.status.latestCreatedRevisionName='elevate-admin-migration-new';
   if(options.drift)admin.spec.template.spec.serviceAccountName='unexpected';
  }
  return JSON.stringify(state);
 };
 const request=async()=>new Response(JSON.stringify({commit:options.changed?'c'.repeat(40):expectedCommit,healthy:true,dependencies:{supabase:{ok:true}}}));
 const preflight=async()=>{assert.equal(studio.status.traffic.some(t=>t.tag==='studio-verify'),false);if(options.noCapacity)throw Error('WEB_ROLLOUT_REGIONAL_CAPACITY_UNAVAILABLE');};
 let promoted=false;
 const activate=async({commit,revision:adminRevision})=>{promoted=true;admin.status.traffic=[{revisionName:adminRevision,percent:100}];return {commit,revision:adminRevision,traffic:100};};
 const inspect=async()=>({fits:!options.noRestoreCapacity});
 return {run,request,preflight,activate,inspect,calls,admin,studio,promoted:()=>promoted};
}
test('releases only the idle QA alias, deploys the immutable Admin image and restores the alias after promotion',async()=>{
 const f=fixture(),before=structuredClone(f.admin.spec.template.spec),result=await releaseBuiltCourseAdmin({sha,revision,expectedCommit,...f});
 assert.equal(result.traffic,100);assert.equal(result.verificationTagRestored,true);assert.equal(result.ownerStudioTrafficPreserved,true);
 before.containers[0].image=result.image;assert.deepEqual(f.admin.spec.template.spec,before);
 assert.deepEqual(f.studio.status.traffic.filter(t=>t.percent>0),[{revisionName:'owner',percent:100}]);
 assert.equal(f.calls.some(a=>a.includes('delete')||a.includes('cancel')||a.includes('execute')||a.some(x=>/store|marketing/.test(x))),false);
 assert.ok(f.studio.status.traffic.some(t=>t.tag==='course-qa-711c558f9db9'));
});
for(const option of ['changed','activeExecutions','servingCandidate'])test('refuses mutation when '+option,async()=>{
 const f=fixture({[option]:true});await assert.rejects(releaseBuiltCourseAdmin({sha,revision,expectedCommit,...f}));assert.equal(f.calls.some(a=>a[2]==='update'||a[2]==='update-traffic'),false);
});
test('retains all serving traffic when capacity admission fails',async()=>{
 const f=fixture({noCapacity:true});await assert.rejects(releaseBuiltCourseAdmin({sha,revision,expectedCommit,...f}),/CAPACITY/);
 assert.equal(f.promoted(),false);assert.deepEqual(f.admin.status.traffic,[{revisionName:'old',percent:100}]);assert.deepEqual(f.studio.status.traffic.filter(t=>t.percent>0),[{revisionName:'owner',percent:100}]);assert.equal(f.studio.status.traffic.filter(t=>t.tag).length,2);
});
test('unexpected runtime drift prevents promotion',async()=>{
 const f=fixture({drift:true});await assert.rejects(releaseBuiltCourseAdmin({sha,revision,expectedCommit,...f}),/IMAGE_ONLY_READBACK/);assert.equal(f.promoted(),false);
});
test('reports blocked alias recovery without exceeding approved capacity',async()=>{
 const f=fixture({noRestoreCapacity:true});await assert.rejects(releaseBuiltCourseAdmin({sha,revision,expectedCommit,...f}),/RESTORE_REQUIRES_CAPACITY/);assert.equal(f.studio.status.traffic.some(t=>t.tag),false);
});
