import {execFileSync} from 'node:child_process';
const project='elegant-racer-299721';
const sha=process.env.IMAGE_SHA;
if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('COURSE_RELEASE_SHA_REQUIRED');
const image='us-central1-docker.pkg.dev/'+project+'/elevate/ultimate-worker';
const call=args=>execFileSync('gcloud',args,{encoding:'utf8',timeout:60000}).trim();
const digest=call(['artifacts','docker','images','describe',image+':'+sha,'--project='+project,'--format=value(image_summary.digest)']);
if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw Error('COURSE_IMAGE_DIGEST_INVALID');
const expected=image+'@'+digest;
const jobs=[['elevate-course-builder','us-central1'],['elevate-course-builder-parallel','us-east1'],['elevate-course-instruction','us-east1'],['elevate-course-media','us-east1'],['elevate-course-quality','us-east1']];
const results=[];
for(const [name,region] of jobs){
 const resource=JSON.parse(call(['run','jobs','describe',name,'--project='+project,'--region='+region,'--format=json']));
 const task=resource?.spec?.template?.spec?.template?.spec;
 const actual=task?.containers?.[0]?.image;
 if(actual!==expected)throw Error('COURSE_WORKER_IMAGE_MISMATCH:'+name);
 if(task?.serviceAccountName!=='elevate-worker-runtime@'+project+'.iam.gserviceaccount.com')
  throw Error('COURSE_WORKER_IDENTITY_MISMATCH:'+name);
 results.push({name,region,imageDigest:digest,identityVerified:true});
}
console.log(JSON.stringify({verified:true,commit:sha,workers:results}));
