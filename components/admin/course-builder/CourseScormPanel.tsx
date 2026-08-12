'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Link2, Loader2, PackageOpen, RefreshCw } from 'lucide-react';

type ScormPackage = {
  id: string;
  title?: string | null;
  description?: string | null;
  course_id?: string | null;
  active?: boolean | null;
  launch_url?: string | null;
  package_url?: string | null;
  scorm_version?: string | null;
  version?: string | null;
  created_at?: string | null;
};

export default function CourseScormPanel({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/scorm', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to load SCORM packages');
      setPackages(Array.isArray(body.packages) ? body.packages : []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load SCORM packages');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const linked = useMemo(() => packages.filter((pkg) => pkg.course_id === courseId), [packages, courseId]);
  const available = useMemo(() => packages.filter((pkg) => pkg.course_id !== courseId), [packages, courseId]);

  async function linkPackage() {
    if (!selectedId) return;
    setLinking(true); setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/scorm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, scormPackageId: selectedId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to link SCORM package');
      setMessage('SCORM package linked to the selected course.');
      setSelectedId('');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to link SCORM package');
    } finally { setLinking(false); }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400"><PackageOpen className="h-4 w-4" />SCORM</div><h2 className="mt-1 text-xl font-bold text-white">SCORM packages for {courseTitle}</h2><p className="mt-1 text-sm text-slate-400">Attach imported SCORM packages to the canonical course without creating a parallel course record.</p></div><button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"><select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Choose a package to link…</option>{available.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.title || pkg.id} · {pkg.scorm_version || pkg.version || 'SCORM'}</option>)}</select><button onClick={linkPackage} disabled={!selectedId || linking} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}{linking ? 'Linking…' : 'Link package'}</button></div>
        {message && <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">{message}</div>}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-bold text-white">Linked packages</h3><div className="mt-4 space-y-2">{linked.length ? linked.map((pkg) => <PackageRow key={pkg.id} pkg={pkg} linked />) : <p className="text-sm text-slate-500">No SCORM packages are linked to this course.</p>}</div></section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-bold text-white">Available packages</h3><div className="mt-4 space-y-2">{available.length ? available.map((pkg) => <PackageRow key={pkg.id} pkg={pkg} />) : <p className="text-sm text-slate-500">No unlinked SCORM packages are available.</p>}</div></section>
    </div>
  );
}

function PackageRow({ pkg, linked = false }: { pkg: ScormPackage; linked?: boolean }) {
  return <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center"><div><div className="flex items-center gap-2"><span className="font-semibold text-white">{pkg.title || 'Untitled SCORM package'}</span>{linked && <span className="flex items-center gap-1 rounded-full bg-green-950 px-2 py-0.5 text-[11px] text-green-300"><CheckCircle2 className="h-3 w-3" />Linked</span>}</div><div className="mt-1 text-xs text-slate-500">{pkg.scorm_version || pkg.version || 'SCORM'} · {pkg.active === false ? 'inactive' : 'active'} · {pkg.id}</div>{pkg.description && <p className="mt-1 text-xs text-slate-400">{pkg.description}</p>}</div>{pkg.launch_url && <a href={pkg.launch_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"><ExternalLink className="h-3.5 w-3.5" />Open launch URL</a>}</div>;
}
