'use client';
import {useCallback,useEffect,useState} from 'react';

type Snapshot = {
  observedAt:string;
  events:Array<{id:string;operation:string;status:string;created_at:string;next_action:string|null}>;
  courses:Array<{id:string;status:string;heartbeat_at:string|null;monitor:{state?:string}}>;
};

export default function ParisSupervisionPanel() {
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const refresh=useCallback(async()=>{
    setLoading(true);
    try {
      const response=await fetch('/api/paris/supervision',{cache:'no-store'});
      if(!response.ok) throw new Error(`Supervision records unavailable (HTTP ${response.status}).`);
      setSnapshot(await response.json());setError('');
    } catch(e) {setError(e instanceof Error?e.message:'Supervision records unavailable.');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  const failures=snapshot?.events.filter(event=>['failed','blocked','approval_required'].includes(event.status)) ?? [];
  return <section className="mb-4 rounded-2xl border border-slate-300 bg-white p-5 text-slate-950" aria-label="PARIS supervision">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold">PARIS</h1>
        <p className="text-sm text-slate-700">Admissions, learning, production, operations, and compliance in one AI.</p></div>
      <button type="button" disabled={loading} onClick={()=>void refresh()} className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold disabled:opacity-50">{loading?'Checking…':'Refresh supervision'}</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error} Previous results may be out of date.</p>}
    {snapshot && <div className="mt-3 text-sm">
      <p>Checked {new Date(snapshot.observedAt).toLocaleString()}. {snapshot.courses.filter(job=>job.status==='running' && job.heartbeat_at && Date.now()-Date.parse(job.heartbeat_at)<90_000).length} course workers with a fresh heartbeat.</p>
      <p className="mt-1 text-slate-700">{snapshot.events.length} recent execution observations; {failures.length} failure or approval observations. These are historical records, not a claim of current service health.</p>
      {failures.length>0 && <details className="mt-3"><summary className="cursor-pointer font-semibold">Review recent failures and next actions</summary>
        <ul className="mt-2 space-y-2">{failures.slice(0,10).map(event=><li key={event.id} className="rounded-lg bg-amber-50 p-3"><strong>{event.operation}</strong> · {event.status}<p>{event.next_action}</p><time>{new Date(event.created_at).toLocaleString()}</time></li>)}</ul>
      </details>}
    </div>}
  </section>;
}
