import {execFileSync} from 'node:child_process';
const project='elegant-racer-299721';
const run=(args)=>execFileSync('gcloud',[...args,'--project='+project],{encoding:'utf8',timeout:180000,stdio:['ignore','pipe','pipe']}).trim();
const read=args=>JSON.parse(run([...args,'--format=json']));
for(const component of ['marketing','admin']){
 const service='elevate-'+component+'-migration',image='us-central1-docker.pkg.dev/'+project+'/elevate/'+component;
 let before,candidate;
 for(let attempt=0;attempt<20;attempt++){
  before=read(['run','services','describe',service,'--region=us-central1']);
  candidate=read(['run','revisions','describe',before.status.latestCreatedRevisionName,'--region=us-central1']);
  if(candidate.status.conditions.some(c=>c.type==='Ready'&&c.status==='True'))break;
  if(attempt===19)throw Error(component+' concurrent release did not become ready');
  console.log(JSON.stringify({component,waitingForConcurrentRelease:true,attempt}));
  await new Promise(resolve=>setTimeout(resolve,15000));
 }
 const revision=before.status.latestCreatedRevisionName;
 const deployedImage=candidate.spec.containers[0].image;
 if(!new RegExp('^'+image+'@sha256:[a-f0-9]{64}$').test(deployedImage))throw Error('Unexpected release image repository/digest');
 if(!candidate.status.conditions.some(c=>c.type==='Ready'&&c.status==='True'))throw Error('Candidate revision not ready');
 let sha;
 const old=(before.status.traffic||[]).filter(t=>t.percent>0);
 run(['run','services','update-traffic',service,'--region=us-central1','--set-tags=release-verified='+revision,'--quiet']);
 const tagged=read(['run','services','describe',service,'--region=us-central1']);
 const target=tagged.status.traffic.find(t=>t.tag==='release-verified'&&t.revisionName===revision);
 const health=async base=>{const r=await fetch(base+'/api/health',{redirect:'manual',signal:AbortSignal.timeout(60000)});const h=await r.json();if(r.status!==200||h.service!==component||!/^([a-f0-9]{40})$/.test(h.commit||'')||(sha&&h.commit!==sha)||h.ready!==true||h.healthy!==true||h.dependencies?.supabase?.ok!==true)throw Error(component+' exact health failed');return h;};
 if(!target?.url?.startsWith('https://'))throw Error('Candidate URL missing');
 sha=(await health(target.url)).commit;
 const digest=run(['artifacts','docker','images','describe',image+':'+sha,'--format=value(image_summary.digest)']);
 if(!/^sha256:[a-f0-9]{64}$/.test(digest)||deployedImage!==image+'@'+digest)throw Error('Reported commit does not match deployed image digest');
 const current=read(['run','services','describe',service,'--region=us-central1']);
 if(current.status.latestCreatedRevisionName!==revision)throw Error('Release superseded');
 if(JSON.stringify(current.status.traffic.filter(t=>t.percent>0).map(t=>[t.revisionName,t.percent]))!==JSON.stringify(old.map(t=>[t.revisionName,t.percent])))throw Error('Concurrent traffic change');
 try{
  run(['run','services','update-traffic',service,'--region=us-central1','--to-latest','--quiet']);
  const live=read(['run','services','describe',service,'--region=us-central1']);
  if(!live.status.traffic.some(t=>t.revisionName===revision&&t.percent===100))throw Error('Traffic not promoted');
  await health(live.status.url);
  await health('https://'+(component==='admin'?'admin.elevateforhumanity.org':'www.elevateforhumanity.org'));
  console.log(JSON.stringify({component,revision,commit:sha,liveVerified:true,automaticLatestTraffic:true}));
 }catch(e){
  run(['run','services','update-traffic',service,'--region=us-central1','--to-revisions='+old.map(t=>t.revisionName+'='+t.percent).join(','),'--quiet']);
  throw e;
 }
}

