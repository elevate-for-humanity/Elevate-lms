import {pathToFileURL} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import {google} from './runtime-config.mjs';
import {productionBrowserEnvironment,inspectServingAdminBrowserBinding} from './production-browser-binding.mjs';

// Inspect serving revisions, never a pending service template. Return only
// allowlisted evidence; workspace contents and credential values stay private.
export async function verifyStudioConnectedRuntime({run=google,request=fetch}={}) {
 const scope=['--project=elegant-racer-299721','--region=us-central1'];
 const read=args=>JSON.parse(run([...args,...scope,'--format=json']));
 const serving=name=>{
  const service=read(['run','services','describe',name]);
  const traffic=(service.status?.traffic??[]).filter(t=>t.percent>0);
  if(traffic.length!==1||traffic[0].percent!==100||!traffic[0].revisionName?.startsWith(name+'-'))throw Error('STUDIO_SERVING_TRAFFIC_UNVERIFIED');
  const revision=read(['run','revisions','describe',traffic[0].revisionName]);
  if(revision.metadata?.name!==traffic[0].revisionName||revision.metadata?.labels?.['serving.knative.dev/service']!==name)throw Error('STUDIO_SERVING_REVISION_UNVERIFIED');
  return {service,revision};
 };
 const browser=serving('elevate-studio-browser');
 const admin=serving('elevate-admin-migration');
 const url=productionBrowserEnvironment(browser.service).STUDIO_BROWSER_URL;
 const binding=inspectServingAdminBrowserBinding({url,run});
 if(!binding.verified)throw Error('STUDIO_ADMIN_BINDING_NOT_SERVING');
 const secretFor=revision=>{
  const rows=(revision.spec?.containers??[]).flatMap(c=>c.env??[]).filter(e=>e.name==='STUDIO_BROWSER_SECRET');
  if(rows.length!==1)throw Error('STUDIO_SHARED_KEY_BINDING_UNVERIFIED');
  const entry=rows[0],ref=entry.valueFrom?.secretKeyRef;
  if(typeof entry.value==='string')return entry.value;
  if(!ref||!/^studio-browser-[a-z0-9-]+$/.test(ref.name)||! /^(latest|[0-9]+)$/.test(ref.key))throw Error('STUDIO_SHARED_KEY_REFERENCE_UNVERIFIED');
  return run(['secrets','versions','access',ref.key,'--secret='+ref.name,'--project=elegant-racer-299721']);
 };
 const key=secretFor(browser.revision),adminKey=secretFor(admin.revision);
 if(typeof key!=='string'||key.length<16||Buffer.byteLength(key)!==Buffer.byteLength(adminKey)||!timingSafeEqual(Buffer.from(key),Buffer.from(adminKey)))throw Error('STUDIO_ADMIN_BROWSER_KEY_MISMATCH');
 const json=async(base,path,options={})=>{
  const response=await request(base+path,{redirect:'error',signal:AbortSignal.timeout(path==='/foundation-test'?120000:20000),...options});
  if(!response.ok)throw Error('STUDIO_CONNECTED_PROBE_HTTP_'+response.status);
  return response.json();
 };
 const health=await json(url,'/health');
 if(health.ready!==true||health.providerAuthStorage?.persistent!==true||health.workspaceRecovery?.ready!==true||health.workspaceRecovery?.storage?.persistent!==true||health.browserWorkspaceRecovery?.persistent!==true||health.terminalRecovery?.persistent!==true||!/^[a-f0-9]{40}$/.test(health.commit??'')||health.commit!==(browser.revision.spec?.containers?.[0]?.env??[]).find(e=>e.name==='GIT_SHA')?.value)throw Error('STUDIO_CONNECTED_STORAGE_OR_REVISION_UNVERIFIED');
 const adminHealth=await json('https://admin.elevateforhumanity.org','/api/health');
 if(adminHealth.ready!==true||adminHealth.healthy!==true||adminHealth.revision!==admin.revision.metadata.name||adminHealth.dependencies?.supabase?.ok!==true)throw Error('STUDIO_CONNECTED_ADMIN_HEALTH_UNVERIFIED');
 const denied=await request(url+'/workspace/files',{redirect:'error',signal:AbortSignal.timeout(20000)});
 if(denied.status!==401)throw Error('STUDIO_CONNECTED_ANONYMOUS_WORKSPACE_EXPOSED');
 const authorized=await request(url+'/workspace/files',{headers:{'x-studio-browser-secret':key},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!authorized.ok)throw Error('STUDIO_CONNECTED_WORKSPACE_UNAVAILABLE');
 // The service's existing foundation test uses an isolated temporary browser
// owner and removes its fixtures; it never uses a learner or provider login.
 const foundation=await json(url,'/foundation-test',{method:'POST',headers:{'x-studio-browser-secret':key}});
 if(foundation.passed!==true||foundation.commit!==health.commit||!Array.isArray(foundation.checks)||!foundation.checks.length||foundation.checks.some(c=>c.passed!==true))throw Error('STUDIO_CONNECTED_BROWSER_FOUNDATION_FAILED');
 return {passed:true,browserRevision:browser.revision.metadata.name,browserCommit:health.commit,adminRevision:admin.revision.metadata.name,adminBinding:true,sharedKeyMatches:true,persistentWorkspace:true,anonymousWorkspaceDenied:true,authorizedWorkspace:true,checks:foundation.checks.map(c=>({name:c.name,passed:c.passed}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 verifyStudioConnectedRuntime().then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('STUDIO_CONNECTED_RUNTIME_VERIFICATION_FAILED; inspect protected workflow diagnostics.');process.exitCode=1;});
}
