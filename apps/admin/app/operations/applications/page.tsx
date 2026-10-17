import type {Metadata} from 'next';
import Link from 'next/link';
import {requireRole} from '@/lib/auth/require-role';
import {getApplicationInventory} from '@/lib/google/application-inventory.mjs';
import {Breadcrumbs} from '@/components/ui/Breadcrumbs';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Application Management | Admin'};
export default async function ApplicationManagementPage() {
  await requireRole(['super_admin','admin']);
  const inventory=await getApplicationInventory();
  return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumbs items={[{label:'Admin',href:'/dashboard'},{label:'Operations',href:'/operations'},{label:'Applications'}]}/>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-black text-slate-950">Application Management</h1>
          <p className="mt-2 text-sm text-slate-600">Production service inventory · {inventory.project}</p>
          <p className="mt-1 text-xs text-slate-500">Checked {inventory.observedAt}</p></div>
        <Link href="/operations/applications" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Refresh inventory</Link>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{inventory.expected.map(app=><article key={app.label} className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-950">{app.label}</h2><p className="mt-2 text-sm text-slate-600">{app.status.replaceAll('_',' ')}</p>
      </article>)}</div>
      {inventory.failures.length>0&&<section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <h2 className="font-bold">Some Google inventory reads are unavailable</h2>
        <ul className="mt-2 space-y-1">{inventory.failures.map((item,index)=><li key={index}>{item.scope}: {item.code.replaceAll('_',' ')}</li>)}</ul>
      </section>}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm"><caption className="p-4 text-left font-bold text-slate-950">Discovered Google services and jobs</caption>
          <thead className="border-y border-slate-200 bg-slate-100"><tr>{['Application / region','Readiness','Serving revision / traffic','CPU / memory','Instances / workers','Usage / billing'].map(label=><th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody>{inventory.applications.map(app=><tr key={app.kind+app.region+app.name} className="border-b border-slate-100 align-top">
            <td className="p-3"><strong>{app.name}</strong><div className="mt-1 text-xs text-slate-500">{app.region} · {app.kind}</div></td>
            <td className="p-3">{app.ready?'Google ready':'Not verified ready'}</td>
            <td className="max-w-sm break-words p-3">{app.serving.length?app.serving.map(row=><div key={row.revision} className="mb-2"><div>{row.revision} · {row.percent}%</div><div className="mt-1 text-xs text-slate-500">Commit: {row.commit?row.commit.slice(0,12):'Not verified'}</div></div>):'Not a traffic-serving service'}</td>
            <td className="p-3">{app.kind==='job'?`${app.configured.cpu??'Unknown'} CPU / ${app.configured.memory??'Unknown'}`:app.serving.map(row=><div key={row.revision}>{row.cpu??'Unknown'} CPU / {row.memory??'Unknown'}</div>)}</td>
            <td className="p-3">{app.kind==='job'?`Parallelism: ${app.configured.parallelism??'Unknown'}`:`Min: ${app.configured.minInstances??'Unknown'} / max: ${app.configured.maxInstances??'Unknown'}`}</td>
            <td className="p-3 text-slate-500">{app.observedUsage?app.observedUsage.revisions.map(row=><div key={row.revision} className="mb-3 text-xs"><strong>{row.revision}</strong><div>CPU mean: {row.cpuPercent?`${row.cpuPercent.value.toFixed(1)}%`:'Not observed'}</div><div>Memory mean: {row.memoryPercent?`${row.memoryPercent.value.toFixed(1)}%`:'Not observed'}</div><div>Active: {row.activeInstances?.value??'Unknown'} / idle: {row.idleInstances?.value??'Unknown'}</div><div>Sample: {row.cpuPercent?.sampledAt??row.memoryPercent?.sampledAt??row.activeInstances?.sampledAt??row.idleInstances?.sampledAt}</div></div>):'No recent usage samples'}<div>Billing not verified</div></td>
          </tr>)}</tbody>
        </table>
        {!inventory.applications.length&&<p className="p-4 text-sm text-slate-600">No verified application inventory is available from this runtime.</p>}
      </section>
      <p className="text-sm text-slate-600">CPU and memory allocations are configured limits. Usage percentages are recent Google Monitoring distribution means for serving revisions, with sample times; missing samples do not establish zero usage. Google readiness does not establish payment, database, or customer acceptance. This view reads infrastructure metadata; changes use the controlled release process.</p>
    </div>
  </main>;
}
