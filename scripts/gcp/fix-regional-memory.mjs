import {google,PROJECT} from './runtime-config.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
const scope=['--project='+PROJECT,'--region=us-central1'];
const read=args=>JSON.parse(google([...args,...scope,'--format=json']));
const state=name=>read(['run','services','describe',name]);
const serving=s=>(s.status.traffic||[]).filter(t=>t.percent>0).map(t=>[t.revisionName,t.percent]).sort();
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function main() {
  for(const name of ['elevate-admin-migration','elevate-studio-browser','elevate-marketing-migration','elevate-lms-migration','elevate-store-migration']) {
    const before=state(name);
    const stale=(before.status.traffic||[]).filter(t=>t.tag&&!t.percent&&t.revisionName!==before.status.latestCreatedRevisionName&&(/^(c-[a-f0-9]{12}|runtime-check|host-shop-verify)$/.test(t.tag)));
    if(stale.length) {
      google(['run','services','update-traffic',name,...scope,'--remove-tags='+stale.map(t=>t.tag).join(','),'--quiet']);
      if(!equal(serving(before),serving(state(name))))throw Error('Concurrent traffic change; stop');
    }
    console.log(JSON.stringify({service:name,removedUnusedTags:stale.map(t=>t.tag)}));
  }
  const job=read(['run','jobs','describe','elevate-course-builder']);
  google(['run','jobs','update','elevate-course-builder',...scope,'--tasks=1','--parallelism=1','--quiet']);
  const afterJob=read(['run','jobs','describe','elevate-course-builder']);
  if(Number(afterJob.spec.template.spec.taskCount)!==1||Number(afterJob.spec.template.spec.parallelism)!==1||afterJob.spec.template.spec.template.spec.containers[0].image!==job.spec.template.spec.template.spec.containers[0].image)throw Error('Worker concurrency readback failed');
  console.log(JSON.stringify({job:'elevate-course-builder',tasks:1,parallelism:1,imagePreserved:true}));
  for(const [component,name,origin,heap] of [
    ['store','elevate-store-migration','https://store.elevateforhumanity.org',3072],
    ['lms','elevate-lms-migration','https://app.elevateforhumanity.org',6144]]) {
    const before=state(name),live=(before.status.traffic||[]).find(t=>t.percent===100);
    if(!live)throw Error('Single serving revision required');
    const revision=read(['run','revisions','describe',live.revisionName]);
    const image=revision.spec.containers[0].image;
    if(!/@sha256:[a-f0-9]{64}$/.test(image))throw Error('Immutable serving image required');
    if(before.spec.template.spec.containers[0].image!==image)throw Error('New image candidate exists; retry after release completes');
    const response=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(30000)});
    const health=await response.json();
    const commit=health.commit||health.commitSha;
    if(!response.ok||!health.healthy||health.revision!==live.revisionName||!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Serving health or identity unavailable');
    const suffix='heap-'+Date.now().toString(36),candidate=name+'-'+suffix;
    const flags=component==='store'?['--command=node','--args=--max-old-space-size=3072,apps/marketing/server.js']:['--update-env-vars=NODE_OPTIONS=--max-old-space-size=6144'];
    google(['run','services','update',name,...scope,'--image='+image,'--revision-suffix='+suffix,'--no-traffic','--min=0','--min-instances=0','--max-instances=1','--no-cpu-boost',...flags,'--quiet']);
    const created=state(name);
    if(created.status.latestCreatedRevisionName!==candidate||!equal(serving(before),serving(created)))throw Error('Concurrent release; no promotion');
    await activateTestedRevision({service:name,revision:candidate,commit});
    const result=state(name),spec=read(['run','revisions','describe',candidate]).spec;
    const c=spec.containers[0];
    if(c.image!==image||!result.status.traffic.some(t=>t.revisionName===candidate&&t.percent===100))throw Error('Heap revision verification failed');
    const heapVerified=component==='store'?c.args?.includes('--max-old-space-size=3072'):c.env?.some(e=>e.name==='NODE_OPTIONS'&&e.value==='--max-old-space-size=6144');
    if(!heapVerified)throw Error('Heap setting readback failed');
    console.log(JSON.stringify({component,heapMiB:heap,memory:c.resources.limits.memory,cpu:c.resources.limits.cpu,revision:candidate,imagePreserved:true,healthVerified:true}));
  }
}
main().catch(e=>{console.error(JSON.stringify({fixed:false,reason:e.code||'fix_failed',detail:e.message}));process.exitCode=1;});
