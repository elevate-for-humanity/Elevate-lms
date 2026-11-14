import { pathToFileURL } from 'node:url';
import { google } from './runtime-config.mjs';
import {isDeepStrictEqual} from 'node:util';
import {preflightWebRollout} from './preflight-web-rollout.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
const admin='elevate-admin-migration';
const scope=['--project=elegant-racer-299721','--region=us-central1'];
const keys=['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL'];
const read=(run,args)=>JSON.parse(run([...args,...scope,'--format=json']));
const adminState=run=>read(run,['run','services','describe',admin]);
function effectiveTraffic(state){
 const rows=(state.status?.traffic||[]).filter(t=>t.percent>0);
 if(!rows.length||rows.reduce((sum,t)=>sum+t.percent,0)!==100||rows.some(t=>!/^elevate-admin-migration-[a-z0-9-]+$/.test(t.revisionName||'')))throw Error('STUDIO_ADMIN_TRAFFIC_UNVERIFIED');
 return rows;
}
export function productionBrowserEnvironment(resource) {
 if(resource?.metadata?.name!=='elevate-studio-browser')throw Error('Exact primary browser service required');
 let url;try{url=new URL(resource.status?.url);}catch{throw Error('Primary browser URL unavailable');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!url.hostname.startsWith('elevate-studio-browser-')||!url.hostname.endsWith('.run.app')||url.hostname.includes('---'))throw Error('Canonical primary browser URL required');
 return {STUDIO_BROWSER_URL:url.origin,STUDIO_BROWSER_PUBLIC_URL:url.origin};
}
export function inspectServingAdminBrowserBinding({url,run=google}={}){
 const expected=productionBrowserEnvironment({metadata:{name:'elevate-studio-browser'},status:{url}});
 const rows=effectiveTraffic(adminState(run));
 const revisions=rows.map(row=>{
  const r=read(run,['run','revisions','describe',row.revisionName]);
  if(r.metadata?.name!==row.revisionName||r.metadata?.labels?.['serving.knative.dev/service']!==admin)throw Error('STUDIO_ADMIN_REVISION_UNVERIFIED');
  const env=(r.spec?.containers||[]).flatMap(c=>c.env||[]);
  const matches=keys.every(name=>{
   const values=env.filter(e=>e.name===name);
   return values.length===1&&!values[0].valueFrom&&!values[0].valueSource&&values[0].value?.replace(/\/$/,'')===expected[name];
  });
  return {revision:row.revisionName,percent:row.percent,matches};
 });
 return {verified:revisions.every(r=>r.matches),revisions};
}
// Updating a pinned service's template does not move traffic. Stage the binding
// on the same immutable Admin image, verify it, then explicitly activate it.
export async function bindProductionStudioBrowser({url,run=google,request=fetch,preflight=preflightWebRollout,activate=activateTestedRevision}={}){
 const vars=productionBrowserEnvironment({metadata:{name:'elevate-studio-browser'},status:{url}});
 const existing=inspectServingAdminBrowserBinding({url,run});
 if(existing.verified)return {adminSwitched:true,adminConfigurationUpdated:false,...existing};
 const before=adminState(run),traffic=effectiveTraffic(before);
 if(traffic.length!==1)throw Error('STUDIO_ADMIN_SPLIT_RELEASE_PROTECTED');
 const serving=read(run,['run','revisions','describe',traffic[0].revisionName]);
 const image=serving.spec?.containers?.[0]?.image;
 if(!/@sha256:[a-f0-9]{64}$/.test(image||'')||before.spec?.template?.spec?.containers?.length!==1||before.spec.template.spec.containers[0].image!==image||before.status.latestCreatedRevisionName!==before.status.latestReadyRevisionName)throw Error('STUDIO_ADMIN_PENDING_RELEASE_PROTECTED');
 const origin=new URL(before.status.url);
 if(origin.protocol!=='https:'||!origin.hostname.startsWith(admin+'-')||!origin.hostname.endsWith('.run.app')||origin.hostname.includes('---')||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('STUDIO_ADMIN_ENDPOINT_UNVERIFIED');
 const response=await request(new URL('/api/health',origin),{redirect:'error',signal:AbortSignal.timeout(20000)});
 const health=await response.json();
 if(!response.ok||health.service!=='admin'||!health.healthy||!health.ready||health.revision!==traffic[0].revisionName||!/^[a-f0-9]{40}$/.test(health.commit||'')||health.dependencies?.supabase?.ok!==true)throw Error('STUDIO_ADMIN_HEALTH_UNVERIFIED');
 await preflight({service:admin,run});
 const current=adminState(run);
 if(!isDeepStrictEqual(current.spec,before.spec)||!isDeepStrictEqual(current.status.traffic,before.status.traffic))throw Error('STUDIO_ADMIN_RELEASE_CHANGED');
 run(['run','services','update',admin,...scope,'--no-traffic','--update-env-vars='+Object.entries(vars).map(([k,v])=>k+'='+v).join(','),'--quiet']);
 const staged=adminState(run),expected=structuredClone(before.spec.template.spec);
 expected.containers[0].env=[...(expected.containers[0].env||[]).filter(e=>!keys.includes(e.name)),...Object.entries(vars).map(([name,value])=>({name,value}))];
 const normalized=spec=>{const copy=structuredClone(spec);for(const c of copy.containers||[])c.env?.sort((a,b)=>a.name.localeCompare(b.name));return copy;};
 const revision=staged.status.latestCreatedRevisionName;
 if(!/^elevate-admin-migration-[a-z0-9-]+$/.test(revision||'')||revision===traffic[0].revisionName||!isDeepStrictEqual(normalized(staged.spec.template.spec),normalized(expected))||!isDeepStrictEqual(effectiveTraffic(staged),traffic))throw Error('STUDIO_ADMIN_STAGED_BINDING_UNVERIFIED');
 await activate({service:admin,revision,commit:health.commit});
 const verified=inspectServingAdminBrowserBinding({url,run});
 if(!verified.verified||verified.revisions.length!==1||verified.revisions[0].revision!==revision)throw Error('STUDIO_ADMIN_BINDING_NOT_SERVING');
 return {adminSwitched:true,adminConfigurationUpdated:true,commit:health.commit,...verified};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const resource=JSON.parse(google(['run','services','describe','elevate-studio-browser','--region=us-central1','--project=elegant-racer-299721','--format=json']));
 console.log(Object.entries(productionBrowserEnvironment(resource)).map(([key,value])=>key+'='+value).join(','));
}
