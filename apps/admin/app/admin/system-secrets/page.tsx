'use client';
import {useEffect,useState} from 'react';

type KeyStatus={key:string;provisioning:string;versions?:number;latestVersion?:string|null;bound?:boolean;ownershipValid?:boolean};
type Inventory={ok:boolean;component:string;service:string;region:string;revision:string|null;secretStatuses:KeyStatus[];secretRefs:{key:string;secret:string;version:string}[];verifiedAt:string;error?:string};
const components=['admin','lms','marketing','store'] as const;

export default function SystemSecretsPage(){
  const [component,setComponent]=useState<string>('admin');
  const [inventory,setInventory]=useState<Inventory|null>(null);
  const [error,setError]=useState('');
  const [audit,setAudit]=useState<{timestamp:string|null;action:string;status:number;resource:string}[]|null>(null);
  const [auditError,setAuditError]=useState('');
  const [loading,setLoading]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    const ctrl=new AbortController();
    setLoading(true);setError('');setInventory(null);setAudit(null);setAuditError('');
    fetch('/api/admin/system-secrets/audit',{cache:'no-store',signal:ctrl.signal})
      .then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Audit unavailable');return body;})
      .then(body=>setAudit(body.history??[]))
      .catch(e=>{if(e.name!=='AbortError')setAuditError(e.message);});
    fetch(`/api/admin/system-secrets?component=${encodeURIComponent(component)}&v=${refresh}`,{cache:'no-store',signal:ctrl.signal})
    .then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||'Verification unavailable');return body;})
    .then(setInventory).catch(e=>{if(e.name!=='AbortError')setError(e.message);})
    .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
    return()=>ctrl.abort();
  },[component,refresh]);
  return <main className="mx-auto max-w-5xl p-6 space-y-6">
    <header><h1 className="text-2xl font-semibold">Infrastructure Credential Manager</h1>
      <p className="mt-2 text-sm text-slate-600">Live, read-only Google Secret Manager and Cloud Run verification. No secret values are displayed.</p>
    </header>
    <section className="flex flex-wrap gap-3 items-center">
      <label htmlFor="service" className="font-medium">Cloud Run service</label>
      <select id="service" className="border rounded p-2" value={component} onChange={e=>setComponent(e.target.value)}>
        {components.map(v=><option key={v} value={v}>{v}</option>)}
      </select>
      <button className="rounded bg-slate-900 px-4 py-2 text-white" type="button" onClick={()=>setRefresh(n=>n+1)}>Verify live</button>
    </section>
    {loading&&<p role="status">Checking Google Cloud…</p>}
    {error&&<p role="alert" className="rounded border border-amber-400 p-3">Inconclusive: {error}. No configuration was changed.</p>}
    {inventory&&<><section className="rounded border p-4">
      <h2 className="font-semibold">{inventory.service}</h2>
      <p>Region: {inventory.region}</p>
      <p>Latest ready revision: {inventory.revision||'Unverified'}</p>
      <p>Verified: {inventory.verifiedAt}</p>
    </section><section className="overflow-x-auto">
      <h2 className="mb-2 font-semibold">Internal token inventory</h2>
      <table className="w-full border-collapse text-left"><thead><tr>
        <th className="border p-2">Key</th><th className="border p-2">Secret</th>
        <th className="border p-2">Enabled versions</th><th className="border p-2">Bound to service</th>
        <th className="border p-2">Ownership</th>
      </tr></thead><tbody>{inventory.secretStatuses.map(s=><tr key={s.key}>
        <td className="border p-2">{s.key}</td><td className="border p-2">{s.provisioning}</td>
        <td className="border p-2">{s.versions??'—'}</td>
        <td className="border p-2">{s.bound===undefined?'—':s.bound?'Yes':'No'}</td>
        <td className="border p-2">{s.ownershipValid===undefined?'Unverified':s.ownershipValid?'Verified':'Mismatch'}</td>
      </tr>)}</tbody></table></section>
      <p className="text-sm text-slate-600">An unverified secret may exist. No automatic rotation or traffic changes occur from this page.</p>
    </>}
    <section className="rounded border p-4 space-y-2"><h2 className="font-semibold">Google Cloud audit history</h2>
      {auditError&&<p role="alert">Inconclusive: {auditError}</p>}
      {audit&&<><p>{audit.length} recent audit entries returned (limited to 30).</p>
        <ul className="space-y-1">{audit.map((a,i)=><li key={i} className="text-sm border-b py-1">
          {a.timestamp??'Unknown time'} — {a.action} — {a.resource||'Resource unavailable'} — {a.status===0?'OK':`Status ${a.status}`}
        </li>)}</ul></>}
    </section>
    <section className="rounded border p-4"><h2 className="font-semibold">Provisioning and rotation</h2>
      <p className="mt-2 text-sm">Creation is limited to Elevate-owned internal keys through the protected GitHub workflow. Binding, rotation, rollback, and audit history require separate verified controls and are not enabled on this page.</p>
    </section>
  </main>;
}
