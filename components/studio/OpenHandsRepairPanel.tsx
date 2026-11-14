'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import type {repairDashboardReceipt} from '@/lib/devstudio/repair-dashboard';

type Repair = ReturnType<typeof repairDashboardReceipt>;

export default function OpenHandsRepairPanel(){
 const [goal,setGoal]=useState(''),[repairs,setRepairs]=useState<Repair[]>([]);
 const [sending,setSending]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const request=useRef<{goal:string;key:string}|null>(null);
 const refresh=useCallback(async(signal?:AbortSignal)=>{
  try{
   const response=await fetch('/api/admin/dev-studio/engineering',{cache:'no-store',signal});
   const result=await response.json();if(!response.ok)throw Error(result.error??'Repair status unavailable.');
   setRepairs(Array.isArray(result.repairs)?result.repairs:[]);
  }catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'Repair status unavailable.');}
 },[]);
 useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort();},[refresh]);
 const submit=async()=>{
  const task=goal.trim();if(!task||sending)return;
  if(request.current?.goal!==task)request.current={goal:task,key:crypto.randomUUID()};
  setSending(true);setError('');setMessage('');
  try{
   const response=await fetch('/api/admin/dev-studio/engineering',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':request.current.key},body:JSON.stringify({task})});
   const result=await response.json();if(!response.ok)throw Error(result.error??'Repair request could not be confirmed.');
   setMessage(`Repair ${result.repairId} saved. Check execution and release status below.`);
   setGoal('');request.current=null;await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Repair request could not be confirmed. Check status before retrying.');}
  finally{setSending(false);}
 };
 return <section className="mt-4 rounded-md border border-[#3c3c3c] bg-[#252526] p-4 text-sm text-white" aria-label="OpenHands repairs and releases">
  <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">OpenHands repairs &amp; releases</h3>
   <button type="button" className="min-h-11 rounded border border-gray-500 px-3" onClick={()=>{setError('');void refresh();}}>Refresh status</button></div>
  <p className="my-3 text-gray-300">Send website, Studio, or Course Builder code repairs from Admin. PARIS validates the commits and opens a protected pull request before the Google release.</p>
  <label className="block" htmlFor="openhands-repair-goal">What needs repair?</label>
  <textarea id="openhands-repair-goal" className="mt-2 min-h-24 w-full rounded border border-gray-500 bg-[#1e1e1e] p-3 text-base" maxLength={12000} value={goal} onChange={e=>setGoal(e.target.value)} disabled={sending}/>
  <button type="button" className="mt-3 min-h-11 rounded bg-blue-600 px-4 font-semibold disabled:opacity-50" disabled={sending||!goal.trim()} onClick={()=>void submit()}>{sending?'Saving repair…':'Send repair to OpenHands'}</button>
  {message&&<p className="mt-3 text-gray-200" role="status">{message}</p>}
  {error&&<p className="mt-3 text-amber-200" role="alert">{error}</p>}
  <ul className="mt-4 space-y-3">{repairs.map(repair=><li key={repair.repairId} className="rounded border border-[#3c3c3c] p-3">
   <p className="break-all">{repair.area} · {repair.repairId}</p>
   <p className="mt-1 break-all text-gray-300">{repair.operation} · {repair.repository}</p>
   {repair.sourceJobId&&<p className="mt-1 break-all text-gray-300">Original job: {repair.sourceJobId}</p>}
   <p className="mt-1 text-gray-300">Risk: {repair.riskClassification}</p>
   <p className="mt-1 text-gray-300">Task approval: {repair.approvalStatus.replaceAll('_',' ')} · Authority: {repair.approvalAuthority}</p>
   {repair.blockerCode&&<p className="mt-1 break-all text-amber-200">Blocker: {repair.blockerCode}</p>}
   <p className="mt-1 text-gray-300">{repair.status.replaceAll('_',' ')}{repair.verifiedLive?' · production verified':' · production not yet verified'}</p>
   {repair.conversationId&&<p className="mt-1 break-all text-gray-300">Existing conversation: {repair.conversationId}</p>}
   {repair.branch&&<p className="mt-1 break-all text-gray-300">Branch: {repair.branch}</p>}
   {repair.changedFiles.length>0&&<details className="mt-2"><summary className="cursor-pointer">Proposed files ({repair.changedFiles.length})</summary><ul className="mt-2 space-y-1">{repair.changedFiles.map(path=><li key={path} className="break-all">{path}</li>)}</ul></details>}
   {repair.taskId&&<p className="mt-1 break-all text-gray-300">OpenHands task: {repair.taskId}</p>}
   <div className="mt-2 flex flex-wrap gap-4">{repair.pullRequest&&<a className="inline-flex min-h-11 items-center underline" href={repair.pullRequest.url} target="_blank" rel="noreferrer">Review PR #{repair.pullRequest.number}</a>}
    {repair.workflowUrl&&<a className="inline-flex min-h-11 items-center underline" href={repair.workflowUrl} target="_blank" rel="noreferrer">Validation &amp; release</a>}</div>
   {repair.releaseSha&&<p className="break-all text-gray-300">Release: {repair.releaseSha}</p>}
  </li>)}</ul>
 </section>;
}
