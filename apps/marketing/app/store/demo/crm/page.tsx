'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Users, TrendingUp, MessageSquare } from 'lucide-react';

type Stage = 'New lead' | 'Contacted' | 'Qualified' | 'Enrollment';

const initialLeads = [
  { id: 1, name: 'Taylor Sample', interest: 'Barber Apprenticeship', stage: 'New lead' as Stage },
  { id: 2, name: 'Morgan Sample', interest: 'Website Builder', stage: 'Contacted' as Stage },
  { id: 3, name: 'Casey Sample', interest: 'HVAC Training', stage: 'Qualified' as Stage },
];

const stages: Stage[] = ['New lead', 'Contacted', 'Qualified', 'Enrollment'];

export default function CrmDemoPage() {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = useMemo(
    () => leads.filter((lead) => `${lead.name} ${lead.interest}`.toLowerCase().includes(query.toLowerCase())),
    [leads, query],
  );

  function advance(id: number) {
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) return lead;
        const next = Math.min(stages.indexOf(lead.stage) + 1, stages.length - 1);
        return { ...lead, stage: stages[next] };
      }),
    );
    setNotice('Lead moved to the next stage.');
    window.setTimeout(() => setNotice(''), 2200);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-sky-950 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/store" className="rounded-lg p-2 hover:bg-white/10" aria-label="Back to Store"><ArrowLeft className="h-5 w-5" /></Link>
            <div><p className="text-xs font-black uppercase tracking-wider text-sky-200">Sample data · Interactive demo</p><h1 className="text-xl font-black">CRM & Lead Management</h1></div>
          </div>
          <Link href="/store/trial" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-sky-950">Start Trial</Link>
        </div>
      </header>

      {notice ? <div role="status" className="fixed right-4 top-24 z-50 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-xl">{notice}</div> : null}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-3xl bg-gradient-to-br from-sky-800 to-indigo-900 p-7 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-widest text-sky-200">Try the workflow</p>
          <h2 className="mt-2 text-3xl font-black">Capture, qualify, and move leads forward.</h2>
          <p className="mt-3 max-w-3xl text-sky-100">Search the sample pipeline and move a lead through each stage. Everything here stays inside this demo session.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric icon={Users} label="Active leads" value={String(leads.length)} />
            <Metric icon={TrendingUp} label="Qualified" value={String(leads.filter((lead) => lead.stage === 'Qualified').length)} />
            <Metric icon={MessageSquare} label="Follow-ups due" value="2" />
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="relative block">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample leads or interests" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4" />
          </label>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {stages.map((stage) => (
              <div key={stage} className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-black">{stage}</h3>
                <div className="mt-3 space-y-3">
                  {filtered.filter((lead) => lead.stage === stage).map((lead) => (
                    <article key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="font-black">{lead.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{lead.interest}</p>
                      {stage !== 'Enrollment' ? <button onClick={() => advance(lead.id)} className="mt-4 w-full rounded-lg bg-sky-800 px-3 py-2 text-sm font-black text-white hover:bg-sky-900">Move forward</button> : <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-center text-sm font-black text-emerald-900">Ready for enrollment</p>}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/20 bg-white/10 p-4"><Icon className="h-5 w-5 text-sky-200" /><p className="mt-3 text-3xl font-black">{value}</p><p className="text-sm text-sky-100">{label}</p></div>;
}
