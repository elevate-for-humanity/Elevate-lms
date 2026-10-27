import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export async function reduceIdleCapacity(component,{read,update,activate,fetcher=fetch}) {
  if(!['lms','store'].includes(component)) throw Error('Only request-driven LMS and Store may scale to zero');
  const service='elevate-'+component+'-migration';
  const before=read(service);
  const serving=(before.status?.traffic||[]).filter(x=>x.percent>0);
  const container=before.spec?.template?.spec?.containers?.[0];
  if(serving.length!==1 || serving[0].percent!==100 ||
     before.status.latestReadyRevisionName!==before.status.latestCreatedRevisionName ||
     !before.status.conditions?.some(x=>x.type==='Ready'&&x.status==='True') ||
     container?.resources?.limits?.cpu!=='2' || container?.resources?.limits?.memory!=='4Gi' ||
     !/@sha256:[a-f0-9]{64}$/.test(container?.image||'')) throw Error('Unexpected topology; no capacity change made');
  const url=before.status.url;
  if(!url || !new URL(url).hostname.endsWith('.run.app')) throw Error('Expected Google service URL');
  const response=await fetcher(url+'/api/health',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
  const health=await response.json();
  const commit=health.commitSha||health.commit||health.sha;
  if(!response.ok || health.service!==component || health.healthy!==true ||
     health.dependencies?.supabase?.ok!==true || !/^[a-f0-9]{40}$/.test(commit||''))
    throw Error('Existing runtime unhealthy; no capacity change made');
  const min=before.spec.template.metadata.annotations?.['autoscaling.knative.dev/minScale']||'0';
  const serviceMin=before.metadata?.annotations?.['run.googleapis.com/minScale']||'0';
  if(min==='0' && serviceMin==='0') return {service,unchanged:true,commit,minimumInstances:0};
  if(!['0','1'].includes(min)||!['0','1'].includes(serviceMin)) throw Error('Unexpected minimum instance count');
  update(service);
  const candidate=read(service);
  if(JSON.stringify(candidate.spec.template.spec)!==JSON.stringify(before.spec.template.spec))
    throw Error('Runtime specification changed unexpectedly; public traffic was not promoted');
  if(candidate.spec.template.metadata.annotations?.['autoscaling.knative.dev/minScale'] &&
     candidate.spec.template.metadata.annotations['autoscaling.knative.dev/minScale']!=='0')
    throw Error('Revision minimum was not removed');
  const result=await activate({service,revision:candidate.status.latestCreatedRevisionName,commit});
  const after=read(service);
  const rows=after.status.traffic.filter(x=>x.percent>0);
  if(rows.length!==1 || rows[0].revisionName!==result.revision || rows[0].percent!==100 ||
     (after.metadata?.annotations?.['run.googleapis.com/minScale']||'0')!=='0')
    throw Error('Capacity promotion readback failed');
  return {...result,minimumInstances:0,previousMinimumInstances:Number(min),idleReservationRemovedGiB:4,
    imageUnchanged:container.image===after.spec.template.spec.containers[0].image};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const {activateTestedRevision}=await import('./activate-tested-public-revision.mjs');
  const scope=['--project=elegant-racer-299721','--region=us-central1'];
  const cli=args=>execFileSync('gcloud',args,{encoding:'utf8',timeout:180000,stdio:['ignore','pipe','pipe']}).trim();
  for(const component of ['store','lms']) {
    const result=await reduceIdleCapacity(component,{
      read:service=>JSON.parse(cli(['run','services','describe',service,...scope,'--format=json'])),
      update:service=>cli(['run','services','update',service,...scope,'--min=0','--min-instances=0','--no-traffic','--quiet']),
      activate:activateTestedRevision
    });
    console.log(JSON.stringify(result));
  }
}
