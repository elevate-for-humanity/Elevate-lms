import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {preflightWebRollout} from './preflight-web-rollout.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
const region='us-central1',admin='elevate-admin-migration',browser='elevate-studio-browser';
const serving=s=>(s.status.traffic??[]).filter(t=>t.percent>0).map(t=>({revision:t.revisionName,percent:t.percent}));
/** Release only our idle verification alias, retaining its immutable revision.
 * Never change owner Studio traffic or cancel another production workload. */
export async function releaseBuiltCourseAdmin({sha,revision,expectedCommit,run=google,request=fetch,
  preflight=preflightWebRollout,activate=activateTestedRevision,inspect=inspectRegionalCapacity}={}){
 if(!/^[a-f0-9]{40}$/.test(sha??'')||!/^[a-f0-9]{40}$/.test(expectedCommit??'')||!/^elevate-studio-browser-\d{5}-[a-z0-9]+$/.test(revision??''))throw Error('EXACT_ADMIN_RELEASE_REQUIRED');
 const read=args=>JSON.parse(run([...args,'--project='+PROJECT,'--region='+region,'--format=json']));
 const service=name=>read(['run','services','describe',name]);
 const before=service(admin),studio=service(browser),tagged=studio.status.traffic.find(t=>t.tag==='studio-verify'&&t.revisionName===revision);
 const health=await request(before.status.url+'/api/health',{redirect:'error',signal:AbortSignal.timeout(20000)}),body=await health.json();
 if(!health.ok||body.commit!==expectedCommit||!body.healthy||body.dependencies?.supabase?.ok!==true)throw Error('SERVING_ADMIN_CHANGED_OR_UNHEALTHY');
 if(!tagged||tagged.percent>0||studio.status.traffic.some(t=>t.revisionName===revision&&t.percent>0)||studio.status.traffic.filter(t=>t.revisionName===revision).some(t=>t.tag!=='studio-verify'))throw Error('IDLE_VERIFICATION_REVISION_REQUIRED');
 for(const [name,where] of [['elevate-course-builder',region],['elevate-course-builder-parallel','us-east1']]){
  const job=JSON.parse(run(['run','jobs','describe',name,'--project='+PROJECT,'--region='+where,'--format=json']));
  const endpoint=job.spec?.template?.spec?.template?.spec?.containers?.[0]?.env?.find(e=>e.name==='ULTIMATE_LEARNER_RUNTHROUGH_URL')?.value;
  if(typeof endpoint!=='string'||new URL(endpoint).origin===new URL(tagged.url).origin)throw Error('VERIFICATION_REVISION_MAY_BE_IN_USE');
 }
 const digest=run(['artifacts','docker','images','describe',`us-central1-docker.pkg.dev/${PROJECT}/elevate/admin:${sha}`,'--project='+PROJECT,'--format=value(image_summary.digest)']);
 if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw Error('TESTED_ADMIN_IMAGE_REQUIRED');
 if(!isDeepStrictEqual(service(admin).status.traffic,before.status.traffic)||!isDeepStrictEqual(service(browser).status.traffic,studio.status.traffic))throw Error('RELEASE_CONFIGURATION_CHANGED');
 run(['run','services','update-traffic',browser,'--project='+PROJECT,'--region='+region,'--remove-tags=studio-verify','--quiet']);
 const released=service(browser);
 if(!isDeepStrictEqual(serving(released),serving(studio))||released.status.traffic.some(t=>t.tag==='studio-verify'))throw Error('OWNER_STUDIO_PRESERVATION_FAILED');
 await preflight({service:admin,run});
 if(!isDeepStrictEqual(service(admin).spec,before.spec))throw Error('ADMIN_CONFIGURATION_CHANGED');
 const image=`us-central1-docker.pkg.dev/${PROJECT}/elevate/admin@${digest}`;
 run(['run','services','update',admin,'--project='+PROJECT,'--region='+region,'--image='+image,'--no-cpu-boost','--no-cpu-throttling','--no-traffic','--quiet']);
 const candidate=service(admin),expected=structuredClone(before.spec);expected.template.spec.containers[0].image=image;
 expected.template.metadata.annotations['run.googleapis.com/startup-cpu-boost']='false';expected.template.metadata.annotations['run.googleapis.com/cpu-throttling']='false';
 if(Object.hasOwn(expected.template.metadata.annotations,'client.knative.dev/user-image'))expected.template.metadata.annotations['client.knative.dev/user-image']=image;
 // Server-managed revision names change with an image update.
 const normalize=spec=>{const copy=structuredClone(spec);delete copy.template.metadata.name;return copy;};
 if(!isDeepStrictEqual(normalize(candidate.spec),normalize(expected))||!isDeepStrictEqual(serving(candidate),serving(before)))throw Error('ADMIN_IMAGE_ONLY_READBACK_FAILED');
 const result=await activate({service:admin,revision:candidate.status.latestCreatedRevisionName,commit:sha});
 if(!isDeepStrictEqual(serving(service(browser)),serving(studio)))throw Error('OWNER_STUDIO_CHANGED');
 const resource=read(['run','revisions','describe',revision]);
 const capacity=await inspect({region,run,task:{containers:resource.spec.containers},taskCount:1});
 let verificationTagRestored=false;
 if(capacity.fits===true){
  const current=service(browser);
  if(!current.status.traffic.some(t=>t.tag==='studio-verify')&&isDeepStrictEqual(serving(current),serving(studio))){
   run(['run','services','update-traffic',browser,'--project='+PROJECT,'--region='+region,'--update-tags=studio-verify='+revision,'--quiet']);
   const after=service(browser);verificationTagRestored=after.status.traffic.some(t=>t.tag==='studio-verify'&&t.revisionName===revision)&&isDeepStrictEqual(serving(after),serving(studio));
   if(!verificationTagRestored)throw Error('VERIFICATION_TAG_RESTORE_UNVERIFIED');
  }
 }
 return {...result,image,ownerStudioTrafficPreserved:true,verificationRevisionRetained:true,verificationTagRestored};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)releaseBuiltCourseAdmin({sha:process.env.ADMIN_IMAGE_SHA,revision:process.env.QA_BROWSER_REVISION,expectedCommit:process.env.EXPECTED_ADMIN_COMMIT}).then(r=>console.info(JSON.stringify(r))).catch(e=>{console.error(e.code??e.message);process.exitCode=1;});
