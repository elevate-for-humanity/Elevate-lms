/** Reclaim only an old, identifiable execution with no live database owner.
 * Cloud cancellation is re-read by the caller before capacity is reused. */
export async function reapUnclaimedLessonExecutions({executions,role,now,request,root,headers,cancel}) {
 const cancelled=[];
 for(const execution of executions) {
  const prefix=execution.spec?.template?.spec?.containers?.[0]?.env?.find(e=>e.name==='ULTIMATE_WORKER_ID')?.value;
  const name=execution.metadata?.name,start=Date.parse(execution.status?.startTime??'');
  if(!new RegExp('^autopilot-'+role+'-[a-f0-9-]{36}$').test(prefix??'')||
     !/^[a-z][a-z0-9-]+$/.test(name??'')||!Number.isFinite(start)||now.getTime()-start<600000)continue;
  const url=new URL(root);
  url.searchParams.set('select','id');url.searchParams.set('status','eq.running');
  url.searchParams.set('lease_owner','like.'+prefix+'-*');
  url.searchParams.set('lease_expires_at','gt.'+now.toISOString());url.searchParams.set('limit','1');
  const response=await request(url,{headers,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('ULTIMATE_ORPHAN_LEASE_READ_HTTP_'+response.status);
  const owners=await response.json();if(!Array.isArray(owners))throw Error('ULTIMATE_ORPHAN_LEASE_READ_INVALID');
  if(owners.length)continue;
  await cancel(name);cancelled.push(name);
 }
 return cancelled;
}
