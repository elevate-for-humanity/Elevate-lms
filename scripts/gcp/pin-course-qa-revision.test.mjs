import test from 'node:test';
import assert from 'node:assert/strict';
import {pinCourseQaRevision} from './pin-course-qa-revision.mjs';
const sha='a'.repeat(40),revision='elevate-studio-browser-00045-wer',secret='existing-test-credential',tag='course-qa-'+sha.slice(0,12);
const image=name=>`us-central1-docker.pkg.dev/elegant-racer-299721/elevate/${name}@sha256:`+'d'.repeat(64);
function fixture(options={}){
 const service={status:{traffic:[{revisionName:'owner-revision',percent:100},{revisionName:revision,percent:0,tag:'studio-verify',url:'https://studio-verify---fixture.a.run.app'}]}};
 const job=()=>({spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',maxRetries:1,containers:[{image:image('ultimate-worker'),resources:{limits:{cpu:'8',memory:'32Gi'}},env:[{name:'ULTIMATE_LEARNER_RUNTHROUGH_URL',value:'https://browser.elevateforhumanity.org/learner/runthrough'},{name:'ULTIMATE_LEARNER_RUNTHROUGH_SECRET',value:secret},{name:'PRIVATE',valueFrom:{secretKeyRef:{name:'unchanged',key:'1'}}}]}]}}}}}});
 const jobs={'elevate-course-builder':job(),'elevate-course-builder-parallel':job()},calls=[],requests=[];
 if(options.differentSecret)jobs['elevate-course-builder-parallel'].spec.template.spec.template.spec.containers[0].env[1].value='other';
 const run=args=>{calls.push(args);
  if(args[0]==='artifacts')return 'sha256:'+'d'.repeat(64);
  if(args[1]==='revisions')return JSON.stringify({spec:{serviceAccountName:'elevate-studio-runtime@elegant-racer-299721.iam.gserviceaccount.com',containers:[{image:options.badImage?'wrong':image('studio-browser')}]}});
  if(args[1]==='services'){
   if(args[2]==='update-traffic')service.status.traffic.push({revisionName:revision,percent:0,tag,url:'https://'+tag+'---fixture.a.run.app'});
   return JSON.stringify(service);
  }
  if(args[1]==='jobs'){
   if(args[2]==='update'){
    if(options.failSecond&&args[3].endsWith('parallel'))throw Error('SECOND_JOB_UPDATE_FAILED');
    const endpoint=args.find(a=>a.startsWith('--update-env-vars=')).split('=').slice(2).join('=');
    jobs[args[3]].spec.template.spec.template.spec.containers[0].env[0].value=endpoint;
   }
   return JSON.stringify(jobs[args[3]]);
  }
  throw Error('Unexpected operation');
 };
 const request=async(url,init)=>{requests.push({url:String(url),authenticated:Boolean(init.headers)});
  if(String(url).endsWith('/learner/health')&&!init.headers)return new Response('{}',{status:options.anonymousAllowed?200:401});
  if(init.headers)assert.equal(init.headers.Authorization,'Bearer '+secret);
  return new Response(JSON.stringify({ready:!(options.lmsNotReady&&init.headers),lmsSetupStatus:options.lmsNotReady?401:404,commit:sha,providerAuthStorage:{persistent:true}}),{status:init.headers?(options.badAuth?401:options.lmsNotReady?503:200):200});
 };
 return {run,request,calls,requests,service,jobs};
}
test('pins authenticated synthetic QA without moving owner traffic, files, sessions or active executions',async()=>{
 const f=fixture(),before=structuredClone(f.jobs),r=await pinCourseQaRevision({revision,sha,...f});
 assert.equal(r.ownerTrafficPreserved,true);assert.equal(r.jobTemplatesUpdated,2);
 assert.deepEqual(f.service.status.traffic.filter(t=>t.percent>0),[{revisionName:'owner-revision',percent:100}]);
 for(const name of Object.keys(f.jobs)){
  before[name].spec.template.spec.template.spec.containers[0].env[0].value=r.endpoint;
  assert.deepEqual(f.jobs[name],before[name]);
 }
 assert.equal(f.calls.some(args=>args.includes('execute')||args.includes('cancel')||args.includes('delete')),false);
 assert.equal(f.requests.some(r=>/workspace|owner-revision/.test(r.url)),false);
 assert.equal(JSON.stringify(r).includes(secret),false);assert.equal(JSON.stringify(f.calls).includes(secret),false);
 const start=f.calls.length;assert.equal((await pinCourseQaRevision({revision,sha,...f})).jobTemplatesUpdated,0);
 assert.equal(f.calls.slice(start).some(args=>args[2]==='update'||args[2]==='update-traffic'),false);
});
for(const options of [{badAuth:true},{anonymousAllowed:true},{badImage:true},{differentSecret:true},{lmsNotReady:true}])test('failed verification prevents any mutation: '+Object.keys(options)[0],async()=>{
 const f=fixture(options);await assert.rejects(pinCourseQaRevision({revision,sha,...f}),options.lmsNotReady?/COURSE_QA_LEARNER_NOT_READY_HTTP_503_LMS_401/:options.badAuth?/COURSE_QA_EXISTING_CREDENTIAL_REJECTED/:undefined);
 assert.equal(f.calls.some(args=>args[2]==='update'||args[2]==='update-traffic'),false);
});
test('a failed second job update restores the first endpoint without altering configuration',async()=>{
 const f=fixture({failSecond:true}),before=structuredClone(f.jobs);
 await assert.rejects(pinCourseQaRevision({revision,sha,...f}),/SECOND_JOB_UPDATE_FAILED/);
 assert.deepEqual(f.jobs,before);assert.equal(f.service.status.traffic[0].percent,100);
});
