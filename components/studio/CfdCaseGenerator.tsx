'use client';

import { useState } from 'react';
import { Download, FlaskConical, Play, CheckCircle2, AlertTriangle } from 'lucide-react';

type DictionaryFile = { path: string; content: string };
type CFDCase = {
  id?: string;
  name: string;
  caseType: string;
  solver: string;
  turbulence: string;
  systemDir?: Record<string, DictionaryFile>;
  constantDir?: Record<string, DictionaryFile>;
  zeroDir?: Record<string, DictionaryFile>;
};

type CaseResponse = { success: boolean; data?: CFDCase; error?: string };

export default function CfdCaseGenerator() {
  const [name, setName] = useState('channelFlow');
  const [solver, setSolver] = useState('simpleFoam');
  const [turbulence, setTurbulence] = useState('kEpsilon');
  const [generatedCase, setGeneratedCase] = useState<CFDCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generateCase() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cfd/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, caseType: 'incompressible', solver, turbulence }),
      });
      const payload = (await response.json()) as CaseResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'The case generator did not return a case.');
      }
      setGeneratedCase(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate CFD case.');
    } finally {
      setLoading(false);
    }
  }

  const files: DictionaryFile[] = generatedCase
    ? [
        ...Object.values(generatedCase.systemDir ?? {}),
        ...Object.values(generatedCase.constantDir ?? {}),
        ...Object.values(generatedCase.zeroDir ?? {}),
      ]
    : [];

  function downloadCase() {
    if (!generatedCase) return;
    const blob = new Blob([JSON.stringify(generatedCase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${generatedCase.name || 'openfoam'}-case.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-800 p-7 text-white shadow-lg">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cyan-100">
                <FlaskConical className="h-5 w-5" /> Engineering Studio
              </div>
              <h1 className="mt-3 text-3xl font-black">CFD Task Studio</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-cyan-50">
                Generate a typed OpenFOAM starter case, inspect the dictionaries, then download the complete case package for review.
              </p>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">Admin tool</span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Case configuration</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-bold text-slate-700">
                Case name
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Solver
                <select value={solver} onChange={(event) => setSolver(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                  {['simpleFoam', 'pisoFoam', 'pimpleFoam', 'icoFoam'].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Turbulence model
                <select value={turbulence} onChange={(event) => setTurbulence(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                  {['kEpsilon', 'kOmega', 'kOmegaSST', 'SpalartAllmaras', 'laminar'].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <button onClick={() => void generateCase()} disabled={loading || !name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-black text-white hover:bg-cyan-800 disabled:opacity-50">
                <Play className="h-4 w-4" /> {loading ? 'Generating…' : 'Generate Case'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Generated dictionaries</h2>
                <p className="text-sm text-slate-500">The generated case appears here before download.</p>
              </div>
              {generatedCase && (
                <button onClick={downloadCase} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  <Download className="h-4 w-4" /> Download
                </button>
              )}
            </div>

            {error ? (
              <div className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
              </div>
            ) : generatedCase ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {files.length} dictionary files generated</div>
                {files.map((file) => (
                  <details key={file.path} className="rounded-xl border border-slate-200 bg-slate-50">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-black text-slate-800">{file.path}</summary>
                    <pre className="overflow-x-auto border-t border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">{file.content}</pre>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm font-semibold text-slate-500">Configure a case and press Generate Case.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
