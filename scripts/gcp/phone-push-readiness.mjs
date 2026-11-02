import {createECDH} from 'node:crypto';
import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';
const names=['VAPID_PUBLIC_KEY','NEXT_PUBLIC_VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'];
function validPair(publicKey,privateKey){try{const e=createECDH('prime256v1');e.setPrivateKey(Buffer.from(privateKey||'','base64url'));return e.getPublicKey().equals(Buffer.from(publicKey||'','base64url'));}catch{return false;}}
try{
 const config=loadGoogleConfig('admin'),env=config.runtimeEnvironment;
 const flags=['--project',PROJECT,'--region','us-central1','--format=json'];
 const service=JSON.parse(google(['run','services','describe','elevate-admin-migration',...flags]));
 const active=(service.status?.traffic||[]).filter(t=>t.percent===100);
 if(active.length!==1||!/^elevate-admin-migration-[a-z0-9-]+$/.test(active[0].revisionName||''))throw Error('PHONE_PUSH_TRAFFIC_UNVERIFIED');
 const revision=active[0].revisionName;
 const state=JSON.parse(google(['run','revisions','describe',revision,...flags]));
 const rows=new Map((state.spec?.containers?.[0]?.env||[]).map(row=>[row.name,row]));
 const values={},bindings={};
 for(const name of names){
  const row=rows.get(name);let value='';const ref=row?.valueFrom?.secretKeyRef;
  const pinned=Boolean(ref&&/^elevate-[A-Za-z0-9_-]+$/.test(ref.name||'')&&/^[1-9][0-9]*$/.test(ref.key||''));
  if(typeof row?.value==='string')value=row.value;
  else if(pinned)value=google(['secrets','versions','access',ref.key,'--secret',ref.name,'--project',PROJECT]);
  values[name]=value;
  bindings[name]={bound:Boolean(row),pinnedSecret:pinned,valuePresent:Boolean(value),unresolvedSecret:Boolean(ref&&!pinned)};
 }
 console.log(JSON.stringify({phonePushReadiness:true,readOnly:true,messagesSent:0,revision,googleRuntimeAuthority:rows.get('ELEVATE_RUNTIME_CONFIG_PROVIDER')?.value==='google-secret-manager',bindings,deployedVapidKeyPairMatches:validPair(values.VAPID_PUBLIC_KEY,values.VAPID_PRIVATE_KEY),bundledConfigVapidPresent:Boolean(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY),bundledConfigVapidKeyPairMatches:validPair(env.VAPID_PUBLIC_KEY,env.VAPID_PRIVATE_KEY),deployedMatchesBundledPublicKey:Boolean(values.VAPID_PUBLIC_KEY&&values.VAPID_PUBLIC_KEY===env.VAPID_PUBLIC_KEY),bundledPublicKeyAliasesMatch:Boolean(env.VAPID_PUBLIC_KEY&&env.NEXT_PUBLIC_VAPID_PUBLIC_KEY&&env.VAPID_PUBLIC_KEY===env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),credentialsEmitted:false}));
}catch(e){console.error(JSON.stringify({phonePushReadiness:true,error:/^PHONE_PUSH_[A-Z_]+$/.test(e.message)?e.message:'PHONE_PUSH_READINESS_UNAVAILABLE',messagesSent:0,credentialsEmitted:false}));process.exitCode=1;}
