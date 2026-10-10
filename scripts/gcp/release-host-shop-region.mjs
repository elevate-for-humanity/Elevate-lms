import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const project='elegant-racer-299721',sourceRegion='us-central1',region='us-east1',service='elevate-marketing-migration',backend='elevate-marketing-backend';
const commit='7996edf490a00d69d2de895b111b2c0b88ef2df0';
const imageBase='us-central1-docker.pkg.dev/'+project+'/elevate/marketing';
function cli(args,timeout=180000){return execFileSync('gcloud',[...args,'--project='+project,'--quiet'],{encoding:'utf8',timeout,stdio:['ignore','pipe','pipe']}).trim();}
function read(args){return JSON.parse(cli([...args,'--format=json']));}
async function version(root){const r=await fetch(root+'/api/version',{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);const v=await r.json();assert.equal(v.commitSha||v.commit||v.sha,commit);}
async function acceptance(root){
 await version(root);
 const health=await fetch(root+'/api/health',{signal:AbortSignal.timeout(45000)});assert.equal(health.status,200);assert.equal((await health.json()).healthy,true);
 const page=await fetch(root+'/',{signal:AbortSignal.timeout(45000)});assert.equal(page.status,200);const html=await page.text();
 for(const text of ['Top Shelf Barber Lounge','Grow your team','Join the Host Shop network','bg-sky-50']) assert(html.includes(text),'Missing '+text);
 assert(!html.includes('Razor’s Image Barbershop'));
 for(const path of ['/host-shops/top-shelf-barber-lounge','/partners/host-shops','/images/partners/top-shelf-barber-lounge/top-shelf-precision-fade-enhanced-2026.webp','/images/partners/generations-hair/stylist-at-work-enhanced-2026.webp']){const r=await fetch(root+path,{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path);}
 const privateRoute=await fetch(root+'/api/tax/returns',{signal:AbortSignal.timeout(30000)});assert.equal(privateRoute.status,401,'Private tax API must retain authentication');
}
const original=read(['compute','backend-services','describe',backend,'--global']);
const map=read(['compute','url-maps','describe','elevate-public-routes','--global']);
assert(map.defaultService.endsWith('/'+backend),'Homepage backend changed; inspect before cutover');
assert.equal(original.backends.length,1);
assert(original.backends[0].group.includes('/regions/us-central1/'),'Existing regional backend changed');
const source=read(['run','services','describe',service,'--region='+sourceRegion]);
const digest=cli(['artifacts','docker','images','describe',imageBase+':'+commit,'--format=value(image_summary.digest)']);
assert.match(digest,/^sha256:[a-f0-9]{64}$/);
const image=imageBase+'@'+digest;
let east;
try{east=read(['run','services','describe',service,'--region='+region]);}catch(error){if(!String(error.stderr).includes('Cannot find service')&&!String(error.stderr).includes('NOT_FOUND'))throw error;}
if(!east){
 const spec=structuredClone(source.spec);
 spec.template.metadata={annotations:{...spec.template.metadata.annotations,'autoscaling.knative.dev/minScale':'0','autoscaling.knative.dev/maxScale':'2','run.googleapis.com/startup-cpu-boost':'false','run.googleapis.com/execution-environment':'gen2'}};
 spec.template.spec.containers[0].image=image;
 spec.template.spec.containers[0].resources={limits:{cpu:'2',memory:'4Gi'}};
 spec.traffic=[{latestRevision:true,percent:100}];
 const annotations={...source.metadata.annotations};
 for(const key of ['run.googleapis.com/operation-id','run.googleapis.com/urls','run.googleapis.com/ingress-status','serving.knative.dev/creator','serving.knative.dev/lastModifier'])delete annotations[key];
 const resource={apiVersion:'serving.knative.dev/v1',kind:'Service',metadata:{name:service,namespace:source.metadata.namespace,labels:{...source.metadata.labels,'cloud.googleapis.com/location':region},annotations},spec};
 writeFileSync('/tmp/marketing-east-service.json',JSON.stringify(resource),{mode:0o600});
 cli(['run','services','replace','/tmp/marketing-east-service.json','--region='+region],900000);
 const policy=read(['run','services','get-iam-policy',service,'--region='+sourceRegion]);
 delete policy.etag;
 writeFileSync('/tmp/marketing-east-policy.json',JSON.stringify(policy),{mode:0o600});
 cli(['run','services','set-iam-policy',service,'/tmp/marketing-east-policy.json','--region='+region]);
 east=read(['run','services','describe',service,'--region='+region]);
}
assert.equal(east.spec.template.spec.containers[0].image,image,'Regional service contains a different release');
assert(east.status.conditions.some(c=>c.type==='Ready'&&c.status==='True'));
assert(east.status.url&&east.status.url.startsWith('https://'));
await acceptance(east.status.url);
console.log(JSON.stringify({regionalRuntimeVerified:true,region,url:east.status.url,commit,resources:east.spec.template.spec.containers[0].resources}));
const negName='elevate-marketing-us-east1-neg';
let neg;
try{neg=read(['compute','network-endpoint-groups','describe',negName,'--region='+region]);}catch(error){if(!String(error.stderr).includes('not found')&&!String(error.stderr).includes('NOT_FOUND'))throw error;}
if(!neg){cli(['compute','network-endpoint-groups','create',negName,'--region='+region,'--network-endpoint-type=serverless','--cloud-run-service='+service]);neg=read(['compute','network-endpoint-groups','describe',negName,'--region='+region]);}
assert.equal(neg.cloudRun.service,service);assert.equal(neg.networkEndpointType,'SERVERLESS');
const current=read(['compute','backend-services','describe',backend,'--global']);
assert.equal(current.fingerprint,original.fingerprint,'Backend changed during validation');
const token=cli(['auth','print-access-token']);
async function patch(backends,fingerprint){
 const r=await fetch('https://compute.googleapis.com/compute/v1/projects/'+project+'/global/backendServices/'+backend,{method:'PATCH',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({fingerprint,backends}),signal:AbortSignal.timeout(30000)});
 const op=await r.json();if(!r.ok)throw Error('Backend update rejected: '+JSON.stringify(op.error));if(op.error)throw Error(JSON.stringify(op.error));
 cli(['compute','operations','wait',op.name,'--global'],300000);
}
await patch([{...original.backends[0],group:neg.selfLink}],original.fingerprint);
try{
 let verified=false,last;
 for(let n=0;n<18;n++){try{await acceptance('https://www.elevateforhumanity.org');verified=true;break;}catch(error){last=error;if(n<17)await new Promise(r=>setTimeout(r,5000));}}
 if(!verified)throw last;
 const voice=await fetch('https://www.elevateforhumanity.org/api/voice/natural',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'Welcome to Elevate for Humanity.'}),signal:AbortSignal.timeout(45000)});
 assert.equal(voice.status,200);assert.match(voice.headers.get('content-type'),/^audio\/mpeg/);assert((await voice.arrayBuffer()).byteLength>1000);
 const after=read(['compute','backend-services','describe',backend,'--global']);
 assert.equal(after.backends.length,1);assert.equal(after.backends[0].group,neg.selfLink);
 console.log(JSON.stringify({publicHomepageVerified:true,commit,region,backend,regionalUrl:east.status.url,privateApiProtected:true,naturalSpeechVerified:true}));
}catch(error){
 const after=read(['compute','backend-services','describe',backend,'--global']);
 if(after.backends.length===1&&after.backends[0].group===neg.selfLink){await patch(original.backends,after.fingerprint);console.log('Public verification failed; previous Google backend restored.');}
 throw error;
}
