import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';

// Inspect only the nominated disposable QA checkpoint. Never emit its owner,
// URLs, cookies, storage values, encrypted envelope or key.
export function checkpointMetadata(envelope,owner,secret,domains){
 const key=crypto.createHash('sha256').update(secret+'\0studio-browser-workspace-v1').digest();
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
 decipher.setAAD(Buffer.from(owner));decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
 const state=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]).toString('utf8'));
 const allowed=value=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&(!u.port||['80','443'].includes(u.port))&&domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}};
 return {authenticatedEncryption:true,ownerMatches:state.owner===owner,version:state.version,
  tabs:Array.isArray(state.tabs)?state.tabs.length:null,
  blockedTabs:state.tabs?.filter(url=>url!=='about:blank'&&!allowed(url)).length,
  storageOrigins:state.storageState?.origins?.length,
  blockedStorageOrigins:state.storageState?.origins?.filter(entry=>!allowed(entry.origin)).length,
  viewportValid:Number.isInteger(state.viewport?.width)&&Number.isInteger(state.viewport?.height)&&state.viewport.width>=320&&state.viewport.width<=1920&&state.viewport.height>=480&&state.viewport.height<=1080,
  credentialValuesReturned:false};
}
export function diagnoseStudioCheckpoint(owner,{run=google}={}){
 if(!/^[a-f0-9-]{36}$/.test(owner||''))throw Error('QA_CHECKPOINT_OWNER_REQUIRED');
 const service=JSON.parse(run(['run','services','describe','elevate-studio-browser','--project',PROJECT,'--region','us-central1','--format=json']));
 const env=service.spec?.template?.spec?.containers?.[0]?.env||[];
 const domains=(env.find(e=>e.name==='STUDIO_BROWSER_ALLOWED_DOMAINS')?.value||'elevateforhumanity.org,envato.com,accounts.google.com,console.cloud.google.com,shell.cloud.google.com').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 const secret=run(['secrets','versions','access','latest','--secret=studio-browser-shared-secret','--project',PROJECT]);
 const filename=crypto.createHash('sha256').update(owner).digest('hex')+'.json';
 const envelope=JSON.parse(run(['storage','cat','gs://'+PROJECT+'-studio-browser-auth/browser-workspaces/'+filename]));
 return {readOnly:true,...checkpointMetadata(envelope,owner,secret,domains)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(diagnoseStudioCheckpoint(process.argv[2])));}
 catch(error){console.error(JSON.stringify({readOnly:true,error:error.code||'QA_CHECKPOINT_DIAGNOSTIC_FAILED'}));process.exitCode=1;}
}
