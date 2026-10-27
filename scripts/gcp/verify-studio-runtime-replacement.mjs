import crypto from 'node:crypto';
import {METADATA_PROBE} from './inventory-studio-live-state.mjs';
const uuid=()=>crypto.randomUUID();
const fingerprintProgram="const fs=require('node:fs'),c=require('node:crypto');const stat=fs.readFileSync('/proc/'+process.ppid+'/stat','utf8');const start=stat.slice(stat.lastIndexOf(')')+2).split(' ')[19];const boot=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8');console.log(c.createHash('sha256').update(boot+':'+start).digest('hex'));";
const stopProgram="console.log('candidate_restart_requested');setTimeout(()=>process.kill(process.ppid,'SIGTERM'),250);";
const fail=code=>{throw Error(code);};
/** Exact zero-traffic candidate only. Restarts its process, never a serving revision.
 * Synthetic file/browser state only; no login, payment, user-file deletion or replay.
 */
export async function verifyStudioRuntimeReplacement({url,revision,sha,candidateTag,secret,readTraffic,request=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms)),attempts=60}={}){
 let base;try{base=new URL(url);}catch{fail('STUDIO_RECOVERY_CANDIDATE_INVALID');}
 if(!/^sc-[a-f0-9]{8}-[a-f0-9]{8}$/.test(candidateTag||'')||!/^[a-f0-9]{40}$/.test(sha||'')||!candidateTag.startsWith('sc-'+sha.slice(0,8)+'-')||base.protocol!=='https:'||!base.hostname.startsWith(candidateTag+'---elevate-studio-browser-')||!base.hostname.endsWith('.run.app')||base.pathname!=='/'||base.search||base.hash||base.username||base.password||!/^elevate-studio-browser-[a-z0-9-]+$/.test(revision||'')||typeof secret!=='string'||secret.length<16||typeof readTraffic!=='function')fail('STUDIO_RECOVERY_CANDIDATE_INVALID');
 const assertCandidate=async()=>{
  const traffic=await readTraffic();
  if(!Array.isArray(traffic)||!traffic.some(t=>t.revisionName===revision&&t.tag===candidateTag&&t.url===url)||traffic.some(t=>(t.percent>0||t.latestRevision===true)&&t.revisionName===revision))fail('STUDIO_RECOVERY_SERVING_REVISION_REFUSED');
 };
 const serviceHeaders={'x-studio-browser-secret':secret,'content-type':'application/json'};
 const call=async(path,{method='GET',body,token,anonymous=false,timeoutMs=40000}={})=>{
  const response=await request(new URL(path,base),{method,headers:anonymous?{}:token?{authorization:'Bearer '+token,'content-type':'application/json'}:serviceHeaders,...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(timeoutMs),cache:'no-store'});
  if(!response.ok)fail('STUDIO_RECOVERY_REQUEST_REJECTED');try{return await response.json();}catch{fail('STUDIO_RECOVERY_RESPONSE_INVALID');}
 };
 const exec=async(program)=>{const result=await call('/workspace/exec',{method:'POST',body:{command:'node',args:['-e',program],timeoutMs:30000}});if(result.exitCode!==0||typeof result.stdout!=='string')fail('STUDIO_RECOVERY_EXEC_UNVERIFIED');return result.stdout.trim();};
 const health=async()=>{const h=await call('/health?acceptance='+uuid(),{timeoutMs:5000});if(!h.ready||h.commit!==sha||!h.workspaceRecovery?.persistent||!h.workspaceRecovery?.ready||!h.browserWorkspaceRecovery?.persistent||!h.terminalRecovery?.persistent)fail('STUDIO_RECOVERY_PERSISTENCE_UNVERIFIED');return h;};
 await assertCandidate();const before=await health();
 if(before.activeSessions!==0||before.terminalRecovery.active!==0)fail('STUDIO_RECOVERY_ACTIVE_STATE_REFUSED');
 const initialFingerprint=await exec(fingerprintProgram);if(!/^[a-f0-9]{64}$/.test(initialFingerprint))fail('STUDIO_RECOVERY_PROCESS_UNVERIFIED');
 const suffix=uuid(),owner='acceptance-'+suffix,content='Studio synthetic replacement acceptance '+suffix;
 const workspaceProgram=(action)=>"(async()=>{const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');const {WorkspaceCheckpoint}=await import('/app/workspace-checkpoint.mjs');const {GcsWorkspaceObjects}=await import('/app/gcs-workspace-objects.mjs');const root=path.join(os.tmpdir(),"+JSON.stringify('studio-replacement-'+suffix)+");const objects=new GcsWorkspaceObjects({prefix:"+JSON.stringify('workspaces/acceptance-'+suffix)+"});const store=new WorkspaceCheckpoint({root,objects,secret:process.env.STUDIO_BROWSER_SECRET});"+(action==='save'?"await store.initialize();await fs.writeFile(path.join(root,'probe.txt'),"+JSON.stringify(content)+");await store.checkpoint();console.log('fixture_saved');":"try{await fs.access(root);throw Error('temporary_workspace_survived');}catch(e){if(e.code!=='ENOENT')throw e;}await store.initialize();if(await fs.readFile(path.join(root,'probe.txt'),'utf8')!=="+JSON.stringify(content)+")throw Error('file_restore_mismatch');console.log('fixture_restored');")+"})().catch(()=>process.exitCode=1);";
 let session,fixtureWritten=false,completed=false;
 try{
  // Isolated object prefix avoids advancing the serving runtime's workspace generation.
  fixtureWritten=true;if(await exec(workspaceProgram('save'))!=='fixture_saved')fail('STUDIO_RECOVERY_CHECKPOINT_UNVERIFIED');
  const open=(restoring=false)=>call('/sessions',{method:'POST',body:{ownerId:owner,url:'https://www.elevateforhumanity.org',width:restoring?1440:390,height:restoring?900:780}});
  session=await open();if(!session.id||!session.token)fail('STUDIO_RECOVERY_SESSION_UNVERIFIED');
  await call('/sessions/'+session.id+'/actions',{method:'POST',token:session.token,body:{type:'new_tab',url:'https://www.elevateforhumanity.org/?studio_recovery_acceptance='+suffix}});
  const prior=await call('/sessions/'+session.id+'/events',{token:session.token});
  if(prior.tabs?.length!==2)fail('STUDIO_RECOVERY_BROWSER_OPERATION_UNVERIFIED');
  const activeIndex=prior.tabs.findIndex(t=>t.id===prior.activeTabId);
  await call('/sessions/'+session.id,{method:'DELETE',token:session.token});session=null;
  const saved=await call('/workspace/checkpoint',{method:'POST'});if(saved.persistent!==true)fail('STUDIO_RECOVERY_CHECKPOINT_UNVERIFIED');
  await assertCandidate();const last=await health();if(last.activeSessions!==0||last.terminalRecovery.active!==0)fail('STUDIO_RECOVERY_ACTIVE_STATE_REFUSED');
  const inventory=JSON.parse(await exec(METADATA_PROBE));
  if(!inventory.processInventoryReadable||inventory.directNonBrowserProcesses!==0||inventory.directChildShells!==0)fail('STUDIO_RECOVERY_RUNNING_PROCESS_REFUSED');
  // Explicit graceful shutdown of this non-serving candidate, never command replay.
  await exec(stopProgram).catch(()=>{});
  let replacementFingerprint;const deadline=Date.now()+180000;
  for(let n=0;n<Math.min(attempts,60)&&Date.now()<deadline;n++){
   try{await health();const value=await exec(fingerprintProgram);if(/^[a-f0-9]{64}$/.test(value)&&value!==initialFingerprint){replacementFingerprint=value;break;}}catch{}
   await sleep(1000);
  }
  if(!replacementFingerprint)fail('STUDIO_RECOVERY_PROCESS_REPLACEMENT_UNVERIFIED');
  if(await exec(workspaceProgram('restore'))!=='fixture_restored')fail('STUDIO_RECOVERY_FILE_RESTORE_FAILED');
  session=await open(true);if(session.restored!==true)fail('STUDIO_RECOVERY_BROWSER_RESTORE_FAILED');
  const after=await call('/sessions/'+session.id+'/events',{token:session.token});
  if(JSON.stringify(after.tabs?.map(t=>t.url))!==JSON.stringify(prior.tabs.map(t=>t.url))||after.tabs.findIndex(t=>t.id===after.activeTabId)!==activeIndex||after.viewport?.width!==390||after.viewport?.height!==780)fail('STUDIO_RECOVERY_BROWSER_STATE_MISMATCH');
  await assertCandidate();completed=true;
 }finally{
  let cleanupFailed=false;
  if(session)try{await call('/sessions/'+session.id,{method:'DELETE',token:session.token});}catch{cleanupFailed=true;}
  if(fixtureWritten)try{
   // Cleanup is restricted to this test's unpredictable UUID storage prefix and owner.
   const cleanup="(async()=>{const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');const {GcsWorkspaceObjects}=await import('/app/gcs-workspace-objects.mjs');const objects=new GcsWorkspaceObjects({prefix:"+JSON.stringify('workspaces/acceptance-'+suffix)+"});const record=await objects.readManifest();if(record){const archive=JSON.parse(record.data).payload.archive;await objects.file('manifest.json').delete();await objects.removeArchive(archive);}await fs.rm(path.join(os.tmpdir(),"+JSON.stringify('studio-replacement-'+suffix)+"),{recursive:true,force:true});const auth=process.env.STUDIO_BROWSER_AUTH_STATE_DIR;if(auth){const name=crypto.createHash('sha256').update("+JSON.stringify(owner)+").digest('hex');await fs.rm(path.join(auth,'browser-workspaces',name+'.json'),{force:true});await fs.rm(path.join(auth,'browser-files',name),{recursive:true,force:true});}console.log('fixture_removed');})().catch(()=>process.exitCode=1);";
   if(await exec(cleanup)!=='fixture_removed')cleanupFailed=true;
  }catch{cleanupFailed=true;}
  if(cleanupFailed)fail('STUDIO_RECOVERY_FIXTURE_CLEANUP_UNVERIFIED');
 }
 return {contract:'studio-runtime-replacement-v1',revision,commit:sha,passed:completed,isolatedWorkspaceFileRestored:true,browserTabsRestored:true,activeTabRestored:true,viewportRestored:true,runtimeReplaced:true,syntheticFixturesRemoved:true,commandsReplayed:false,trafficChanged:false,osProcessRestoration:false};
}
