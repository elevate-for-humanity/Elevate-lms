'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Gauge, RefreshCw, ShieldCheck } from 'lucide-react';

type Claim = {
  claim_key: string;
  claim_type: string;
  display_label: string;
  status: string;
  value_numeric: number | string | null;
  value_text: string | null;
  evidence_summary: string | null;
  evidence_url: string | null;
  verified_at: string | null;
};

type Payload = {
  languageCount: number;
  claims: Claim[];
  benchmarks: { sampleCount: number; medianSpeedup: number | null; maxSpeedup: number | null };
};

export default function DevStudioClaimsPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scenario, setScenario] = useState('');
  const [baseline, setBaseline] = useState('');
  const [studio, setStudio] = useState('');

  const load = useCallback(async () => {
    setError('');
    const response = await fetch('/api/admin/dev-studio/claims', { cache: 'no-store', credentials: 'include' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error ?? 'Unable to load claim evidence.');
    setData(payload);
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : 'Unable to load claim evidence.'));
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/dev-studio/claims', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Claim operation failed.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim operation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-slate-950">
            <ClipboardCheck className="h-7 w-7" /> Claims & Evidence
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Public Dev Studio claims are evidence-gated. Code claims come from CI, performance claims come from measured benchmarks, runtime claims require deployment evidence, and certifications require external documentation.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 font-bold text-slate-800">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-bold text-slate-500">Maintained language modes</div>
          <div className="mt-2 text-3xl font-black text-slate-950">{data?.languageCount ?? '—'}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-bold text-slate-500">Benchmark samples</div>
          <div className="mt-2 text-3xl font-black text-slate-950">{data?.benchmarks?.sampleCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-bold text-slate-500">Median measured speedup</div>
          <div className="mt-2 text-3xl font-black text-slate-950">
            {data?.benchmarks?.medianSpeedup ? `${data.benchmarks.medianSpeedup.toFixed(2)}x` : 'Not measured'}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Evidence registry</h2>
            <p className="text-sm text-slate-600">Only verified, non-expired rows can appear on the public Dev Studio page.</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post({ action: 'sync_code_claims' })}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Sync code evidence
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(data?.claims ?? []).map((claim) => (
            <article key={claim.claim_key} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-slate-950">{claim.display_label}</div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${claim.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {claim.status}
                </span>
              </div>
              {claim.value_text ? <p className="mt-2 text-sm font-semibold text-slate-700">{claim.value_text}</p> : null}
              {claim.evidence_summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{claim.evidence_summary}</p> : null}
              {claim.evidence_url ? <a className="mt-3 inline-flex text-sm font-bold text-blue-700" href={claim.evidence_url} target="_blank" rel="noopener noreferrer">Open evidence</a> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="flex items-center gap-2 text-xl font-black"><Gauge className="h-5 w-5" /> Record productivity benchmark</h2>
        <p className="mt-1 text-sm text-slate-600">The 10x claim requires at least 10 real samples and a median speedup of at least 10x.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="Scenario" className="rounded-lg border px-3 py-2" />
          <input value={baseline} onChange={(e) => setBaseline(e.target.value)} inputMode="decimal" placeholder="Baseline seconds" className="rounded-lg border px-3 py-2" />
          <input value={studio} onChange={(e) => setStudio(e.target.value)} inputMode="decimal" placeholder="Studio seconds" className="rounded-lg border px-3 py-2" />
        </div>
        <button
          type="button"
          disabled={busy || !scenario || !baseline || !studio}
          onClick={() => void post({ action: 'record_benchmark', scenario, baseline_seconds: Number(baseline), studio_seconds: Number(studio) })}
          className="mt-4 rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Record benchmark
        </button>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5" /> SOC 2 certification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The system can store, expire, audit, and publish certification evidence. It cannot create the independent auditor report required to make the certification claim.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> Zero-downtime evidence</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Readiness/startup probes and controlled deployment architecture are in source. The public claim stays gated until deployment evidence verifies no failed availability checks during release.</p>
        </div>
      </section>
    </main>
  );
}
