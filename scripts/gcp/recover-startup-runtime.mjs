import {execFileSync} from 'node:child_process';
const component=process.env.COMPONENT,sha=process.env.IMAGE_SHA;
if(!['admin','marketing'].includes(component)||!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Invalid recovery target');
const project='elegant-racer-299721',service='elevate-'+component+'-migration';
const run=(args,timeout=30000)=>execFileSync('gcloud',[...args,'--project='+project],{encoding:'utf8',timeout,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']}).trim();
const read=args=>JSON.parse(run([...args,'--format=json']));
const before=read(['run','services','describe',service,'--region=us-central1']);
const failed=read(['run','revisions','describe',before.status.latestCreatedRevisionName,'--region=us-central1']);
if(!(failed.status.conditions||[]).some(x=>x.type==='Ready'&&x.status==='False'))throw Error('Latest revision is not failed; refuse recovery over another release');
const image='us-central1-docker.pkg.dev/'+project+'/elevate/'+component;
const digest=run(['artifacts','docker','images','describe',image+':'+sha,'--format=value(image_summary.digest)']);
if(!/^sha256:[a-f0-9]{64}$/.test(digest)||failed.spec.containers[0].image!==image+'@'+digest)throw Error('Recovery image does not match the exact failed revision');
const oldTraffic=(before.status.traffic||[]).filter(t=>t.percent>0).map(t=>({revision:t.revisionName,percent:t.percent}));
const suffix='g2-'+sha.slice(0,8)+'-'+process.env.GITHUB_RUN_ID;
const revision=service+'-'+suffix;
const tag='startup-gen2';
console.log(JSON.stringify({component,action:'test_same_failed_image',digest,revision,trafficPreserved:oldTraffic,executionEnvironment:'gen2'}));
let promoted=false;
try {
 run(['run','services','update',service,'--region=us-central1','--image='+image+'@'+digest,'--execution-environment=gen2','--revision-suffix='+suffix,'--no-traffic','--tag='+tag,'--quiet'],900000);
 const updated=read(['run','services','describe',service,'--region=us-central1']);
 const active=(updated.status.traffic||[]).filter(t=>t.percent>0).map(t=>({revision:t.revisionName,percent:t.percent}));
 if(JSON.stringify(active)!==JSON.stringify(oldTraffic))throw Error('Traffic changed during isolated startup test');
 const candidate=read(['run','revisions','describe',revision,'--region=us-central1']);
 if(!candidate.status.conditions.some(x=>x.type==='Ready'&&x.status==='True')||candidate.spec.containers[0].image!==image+'@'+digest)throw Error('Candidate image/revision is not ready');
 const tagged=updated.status.traffic.find(t=>t.tag===tag&&t.revisionName===revision);
 if(!tagged?.url||!tagged.url.startsWith('https://'))throw Error('Candidate tagged URL unavailable');
 const response=await fetch(tagged.url+'/api/health',{redirect:'manual',signal:AbortSignal.timeout(90000)});
 const health=await response.json();
 if(response.status!==200||health.service!==component||health.commit!==sha||health.ready!==true||health.healthy!==true||health.dependencies?.supabase?.ok!==true)throw Error('Exact candidate health verification failed');
 console.log(JSON.stringify({component,revision,commit:health.commit,healthy:true,verifiedSameImage:true,executionEnvironment:'gen2'}));
 const current=read(['run','services','describe',service,'--region=us-central1']);
 if(current.status.latestCreatedRevisionName!==revision)throw Error('Another release superseded the startup test');
 run(['run','services','update-traffic',service,'--region=us-central1','--to-revisions='+revision+'=100','--quiet'],180000);
 promoted=true;
 const live=read(['run','services','describe',service,'--region=us-central1']);
 if(!live.status.traffic.some(t=>t.revisionName===revision&&t.percent===100))throw Error('Candidate traffic promotion not verified');
 const publicHealth=await fetch(live.status.url+'/api/health',{redirect:'manual',signal:AbortSignal.timeout(90000)}).then(r=>r.json());
 if(publicHealth.commit!==sha||publicHealth.healthy!==true)throw Error('Live exact commit verification failed');
 console.log(JSON.stringify({component,revision,commit:sha,liveVerified:true}));
} catch(error) {
 if(promoted) {
  try {run(['run','services','update-traffic',service,'--region=us-central1','--to-revisions='+oldTraffic.map(t=>t.revision+'='+t.percent).join(','),'--quiet'],180000);console.error(JSON.stringify({component,rollbackToPreviousTraffic:true}));}
  catch {console.error(JSON.stringify({component,rollbackVerified:false}));}
 }
 // Never print provider stderr, runtime settings or arbitrary response bodies.
 console.error(JSON.stringify({component,revision,recoveryFailed:true,error:typeof error.status==='number'?'google_operation_failed':error.name,trafficPromotionVerified:false}));
 process.exitCode=1;
}
