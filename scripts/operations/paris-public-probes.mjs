#!/usr/bin/env node
/**
 * PARIS read-only operational surface probes.
 * These are public unauthenticated reachability checks ONLY, not authenticated
 * acceptance, payment delivery, login success, or a claim of live Cloud Run identity.
 */
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';

export const SURFACES = Object.freeze([
 {name:'marketing', url:'https://www.elevateforhumanity.org/', expected:[200,301,302,307,308]},
 {name:'admin-health', url:'https://admin.elevateforhumanity.org/api/health', expected:[200]},
 {name:'lms-entry', url:'https://www.elevateforhumanity.org/login', expected:[200,302,307,308]},
]);
export function classifyProbe({name,url,expected},status,error,elapsedMs){
 const ok=!error && expected.includes(status);
 return {name,origin:new URL(url).origin,status:status??null,
   elapsedMs:Math.round(elapsedMs),healthy:ok,
   category:error?'request_failed':ok?'reachable':'unexpected_http_status'};
}
export async function probeAll({request=fetch,surfaces=SURFACES,now=Date.now}={}){
 const results=[];
 for(const surface of surfaces){
   const parsed=new URL(surface.url);
   if(parsed.protocol!=='https:' || !SURFACES.some(s=>s.url===surface.url))
     throw Error('PROBE_TARGET_NOT_ALLOWLISTED');
   const start=now();
   try{
     const response=await request(surface.url,{method:'GET',redirect:'manual',
       cache:'no-store',signal:AbortSignal.timeout(15000)});
     results.push(classifyProbe(surface,response.status,null,now()-start));
   }catch(e){
     results.push(classifyProbe(surface,null,'request_failed',now()-start));
   }
 }
 return {checkedAt:new Date().toISOString(),classification:'unauthenticated-reachability-only',
   results,allReachable:results.every(x=>x.healthy)};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
   const report=await probeAll();
   mkdirSync('audit-output',{recursive:true});
   writeFileSync('audit-output/paris-public-probes.json',JSON.stringify(report,null,2));
   console.log(JSON.stringify(report));
   // A live outage is an incident, not a failure to collect evidence.
 }catch(e){
   console.error('PARIS_PROBE_CONFIGURATION_ERROR:'+String(e.message).slice(0,100));
   process.exitCode=2;
 }
}
