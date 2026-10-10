import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const project='elegant-racer-299721';
const read=args=>JSON.parse(execFileSync('gcloud',[...args,'--project='+project,'--format=json'],{encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']}));
const hash=value=>createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
for(const component of ['admin','marketing']) {
 const serviceName='elevate-'+component+'-migration';
 const service=read(['run','services','describe',serviceName,'--region=us-central1']);
 const revisions={ready:service.status.latestReadyRevisionName,created:service.status.latestCreatedRevisionName};
 const snapshots={};
 for(const [kind,name] of Object.entries(revisions)) {
  const r=read(['run','revisions','describe',name,'--region=us-central1']);
  const c=r.spec.containers[0];
  const env=(c.env||[]).map(e=>({name:e.name,hash:hash(e)}));
  snapshots[kind]={spec:r.spec,annotations:r.metadata.annotations,env};
  console.log(JSON.stringify({component,kind,revision:name,image:c.image,
   commandCount:c.command?.length||0,argumentCount:c.args?.length||0,
   commandMatchesImage:!c.command?.length&&!c.args?.length,
   resources:c.resources,ports:c.ports,startupProbe:c.startupProbe,
   executionEnvironment:r.metadata.annotations?.['run.googleapis.com/execution-environment'],
   cpuThrottling:r.metadata.annotations?.['run.googleapis.com/cpu-throttling'],
   startupCpuBoost:r.metadata.annotations?.['run.googleapis.com/startup-cpu-boost'],
   runtimeIdentity:r.spec.serviceAccountName,
   envNames:env.map(e=>e.name),
   envBytes:(c.env||[]).reduce((n,e)=>n+Buffer.byteLength(JSON.stringify(e)),0),
   secretBindings:(c.env||[]).filter(e=>e.valueFrom).map(e=>({name:e.name,secret:e.valueFrom.secretKeyRef})),
   nodeOptionsPresent:(c.env||[]).some(e=>e.name==='NODE_OPTIONS'),
   mountPaths:(c.volumeMounts||[]).map(v=>v.mountPath),
   volumeTypes:(r.spec.volumes||[]).map(v=>Object.keys(v).filter(k=>k!=='name')),
   conditions:(r.status.conditions||[]).map(x=>({type:x.type,status:x.status,reason:x.reason}))}));
  try {const image=read(['artifacts','docker','images','describe',c.image]);console.log(JSON.stringify({component,kind,imageMetadata:image.image_summary}));}
  catch {console.log(JSON.stringify({component,kind,imageMetadataUnavailable:true}));}
 }
 const before=new Map(snapshots.ready.env.map(e=>[e.name,e.hash]));
 const after=new Map(snapshots.created.env.map(e=>[e.name,e.hash]));
 console.log(JSON.stringify({component,changedEnvNames:[...new Set([...before.keys(),...after.keys()])].filter(k=>before.get(k)!==after.get(k)),
  specChangedKeys:[...new Set([...Object.keys(snapshots.ready.spec),...Object.keys(snapshots.created.spec)])].filter(k=>hash(snapshots.ready.spec[k])!==hash(snapshots.created.spec[k])),
  annotationChangedKeys:[...new Set([...Object.keys(snapshots.ready.annotations||{}),...Object.keys(snapshots.created.annotations||{})])].filter(k=>hash(snapshots.ready.annotations?.[k])!==hash(snapshots.created.annotations?.[k]))}));
 const rows=read(['logging','read',`resource.type="cloud_run_revision" AND resource.labels.service_name="${serviceName}" AND resource.labels.revision_name="${revisions.created}"`,'--freshness=8h','--limit=200']);
 console.log(JSON.stringify({component,revision:revisions.created,logCount:rows.length,logNames:[...new Set(rows.map(r=>r.logName))]}));
}
