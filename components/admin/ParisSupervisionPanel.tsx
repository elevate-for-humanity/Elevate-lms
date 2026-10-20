'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

type Snapshot = {
  observedAt:string;
  events:Array<{id:string;operation:string;status:string;created_at:string;next_action:string|null}>;
  codeRepair?:{available:boolean;policy:{enabled:boolean;max_daily_repairs:number}|null;repairs:Array<{id:string;status:string;workflow_run_id:number|null;release_sha:string|null;error_code:string|null;verification?:{symptom?:string;resumedJobId?:string;courseExecution?:{state:string;reason:string}}}>};
  courses:Array<{id:string;status:string;heartbeat_at:string|null;lease_owner:string|null;lease_expires_at:string|null;monitor:{state?:string}}>;
};

export default function ParisSupervisionPanel({buildId,active=true}:{buildId?:string;active?:boolean}) {
  const requestVersion=useRef(0);
  const panel=useRef<HTMLElement>(null);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const refresh=useCallback(async()=>{
    const version=++requestVersion.current;
    setLoading(true);
    try {
      const response=await fetch('/api/paris/supervision'+(buildId?'?buildId='+encodeURIComponent(buildId):''),{cache:'no-store'});
      if(!response.ok) throw new Error(`Supervision records unavailable (HTTP ${response.status}).`);
      const data=await response.json();
      if(version===requestVersion.current){setSnapshot(data);setError('');}
    } catch(e) {if(version===requestVersion.current)setError(e instanceof Error?e.message:'Supervision records unavailable.');}
    finally {if(version===requestVersion.current)setLoading(false);}
  },[buildId]);
  useEffect(()=>{
    if(!active)return;
    setSnapshot(null);void refresh();
    const timer=setInterval(()=>{if(document.visibilityState==='visible' && panel.current?.getClientRects().length)void refresh();},30000);
    return ()=>{clearInterval(timer);requestVersion.current++;};
  },[refresh,active]);
  const failures=snapshot?.events.filter(event=>['failed','blocked','approval_required'].includes(event.status)) ?? [];
  return <section ref={panel} className="mb-4 rounded-2xl border border-slate-300 bg-white p-5 text-slate-950" aria-label="PARIS supervision">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold">PARIS</h1>
        <p className="text-sm text-slate-700">Admissions, learning, production, operations, and compliance in one AI.</p></div>
      <button type="button" disabled={loading} onClick={()=>void refresh()} className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold disabled:opacity-50">{loading?'Checking…':'Refresh supervision'}</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error} Previous results may be out of date.</p>}
    {snapshot && <div className="mt-3 text-sm">
      <p>Checked {new Date(snapshot.observedAt).toLocaleString()}. {snapshot.courses.filter(job=>job.status==='running' && job.lease_owner && Date.parse(job.lease_expires_at??'')>Date.now() && job.heartbeat_at && Date.now()-Date.parse(job.heartbeat_at)>=0 && Date.now()-Date.parse(job.heartbeat_at)<90_000).length} course workers with a fresh heartbeat.</p>
      <p className="mt-1 text-slate-700">{snapshot.events.length} recent execution observations; {failures.length} failure or approval observations. These are historical records, not a claim of current service health.</p>
      {snapshot.codeRepair && <div className="mt-3 rounded-lg border border-slate-300 p-3">
        <h2 className="font-bold">Code repair autopilot</h2>
        <p>{!snapshot.codeRepair.available ? 'Repair records unavailable.' : snapshot.codeRepair.policy?.enabled ? `Enabled · up to ${snapshot.codeRepair.policy.max_daily_repairs} repairs per day.` : 'Paused.'}</p>
        <p>Diagnose → patch → independent tests → main → deployment verification. Course repairs remain in verification until the correlated course execution passes quality checks and publication.</p>
        {snapshot.codeRepair.repairs.slice(0,5).map(repair=><p key={repair.id} className="mt-2"><strong>{repair.status}</strong>{repair.error_code ? ` · ${repair.error_code}` : ''}{repair.verification?.symptom && <span className="block text-slate-700">{repair.verification.symptom}</span>}{repair.workflow_run_id && <> · <a className="underline" href={`https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/${repair.workflow_run_id}`} target="_blank" rel="noreferrer">Execution log</a></>}</p>)}
      </div>}
      {failures.length>0 && <details className="mt-3"><summary className="cursor-pointer font-semibold">Review recent failures and next actions</summary>
        <ul className="mt-2 space-y-2">{failures.slice(0,10).map(event=><li key={event.id} className="rounded-lg bg-amber-50 p-3"><strong>{event.operation}</strong> · {event.status}<p>{event.next_action}</p><time>{new Date(event.created_at).toLocaleString()}</time></li>)}</ul>
      </details>}
    </div>}
  </section>;
}
