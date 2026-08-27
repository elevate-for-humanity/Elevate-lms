'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, GitBranch, Loader2, PackageOpen, RefreshCw, RotateCcw, Send, ShieldCheck } from 'lucide-react';

type Course = {
  id: string;
  title: string;
  slug?: string;
  status?: string | null;
  review_status?: string | null;
  version?: number | null;
};

type VersionRow = {
  id: string;
  version: number;
  label: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  hasSnapshot: boolean;
};

type ScormPackage = {
  id: string;
  title?: string | null;
  course_id?: string | null;
  active?: boolean | null;
  launch_url?: string | null;
  scorm_version?: string | null;
  version?: string | null;
};

function rowsFrom(payload: any): Course[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  return [];
}

export default function CourseLifecycleWorkspace() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [blockers, setBlockers] = useState<string[]>([]);

  const linkedPackages = useMemo(() => packages.filter((pkg) => pkg.course_id === courseId), [packages, courseId]);
  const availablePackages = useMemo(() => packages.filter((pkg) => pkg.course_id !== courseId), [packages, courseId]);

  async function loadCourses() {
    const response = await fetch('/api/admin/courses', { cache: 'no-store' });
    const payload = await response.json().catch(() => []);
    const rows = rowsFrom(payload);
    setCourses(rows);
    if (!courseId && rows[0]?.id) setCourseId(rows[0].id);
  }

  async function loadCourse(id = courseId) {
    if (!id) return;
    const response = await fetch(`/api/admin/course-builder/course?courseId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || 'Unable to load course');
    setCourse(payload.course ?? null);
  }

  async function loadVersions(id = courseId) {
    if (!id) return;
    const response = await fetch(`/api/admin/course-builder/versions?courseId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || 'Unable to load versions');
    setVersions(Array.isArray(payload.versions) ? payload.versions : []);
  }

  async function loadScorm() {
    const response = await fetch('/api/admin/course-builder/scorm', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || 'Unable to load SCORM packages');
    setPackages(Array.isArray(payload.packages) ? payload.packages : []);
  }

  async function refresh() {
    if (!courseId) return;
    setBusy('refresh');
    setMessage('');
    setBlockers([]);
    try {
      await Promise.all([loadCourse(courseId), loadVersions(courseId), loadScorm()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to refresh course lifecycle data');
    } finally {
      setBusy('');
    }
  }

  useEffect(() => { void loadCourses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (courseId) void refresh(); }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function review(action: 'submit' | 'approve' | 'reject' | 'revert_to_draft') {
    if (!courseId) return;
    setBusy(action);
    setMessage('');
    setBlockers([]);
    try {
      const response = await fetch('/api/admin/course-builder/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, action }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setBlockers(Array.isArray(payload.blockers) ? payload.blockers : []);
        throw new Error(payload.error || 'Review action failed');
      }
      setMessage(`Course review state changed to ${payload.review_status}.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review action failed');
    } finally {
      setBusy('');
    }
  }

  async function publish() {
    if (!courseId) return;
    setBusy('publish');
    setMessage('');
    setBlockers([]);
    try {
      const response = await fetch('/api/admin/course-builder/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setBlockers(Array.isArray(payload.blockers) ? payload.blockers : []);
        throw new Error(payload.error || 'Publish failed');
      }
      setMessage(`Published course version ${payload.version}.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setBusy('');
    }
  }

  async function rollback(version: number) {
    if (!courseId) return;
    if (!window.confirm(`Restore version ${version} as a draft? Learner progress will not be deleted.`)) return;
    setBusy(`rollback-${version}`);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, version }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Rollback failed');
      setMessage(`Restored version ${version} to draft.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Rollback failed');
    } finally {
      setBusy('');
    }
  }

  async function exportScorm(format: '1.2' | '2004') {
    if (!courseId) return;
    setBusy(`export-scorm-${format}`);
    setMessage('');
    try {
      const response = await fetch(
        `/api/admin/course-builder/scorm/export?courseId=${encodeURIComponent(courseId)}&format=${encodeURIComponent(format)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'SCORM export failed');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `course-scorm-${format.replace('.', '')}.zip`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`SCORM ${format} package downloaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'SCORM export failed');
    } finally {
      setBusy('');
    }
  }

  async function linkScorm() {
    if (!courseId || !selectedPackageId) return;
    setBusy('scorm');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/scorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, scormPackageId: selectedPackageId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'SCORM link failed');
      setSelectedPackageId('');
      setMessage('SCORM package linked to the canonical course.');
      await loadScorm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'SCORM link failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-5 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-400"><ShieldCheck className="h-4 w-4" /> Course lifecycle</div>
              <h1 className="mt-1 text-2xl font-black text-white">Governance, publishing, rollback and SCORM</h1>
              <p className="mt-1 text-sm text-slate-400">Controls the canonical course record. Publishing requires review approval and readiness checks.</p>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="min-h-10 min-w-[300px] rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                <option value="">Select a course…</option>
                {courses.map((row) => <option key={row.id} value={row.id}>{row.title} — {row.status ?? 'draft'}</option>)}
              </select>
              <button onClick={() => void refresh()} disabled={!courseId || busy === 'refresh'} className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 disabled:opacity-40" title="Refresh"><RefreshCw className={`h-4 w-4 ${busy === 'refresh' ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>
        </header>

        {message && <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">{message}</div>}
        {blockers.length > 0 && <div className="rounded-xl border border-red-900 bg-red-950/40 p-4"><div className="font-bold text-red-200">Resolve these blockers before advancing:</div><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100">{blockers.map((item) => <li key={item}>{item}</li>)}</ul></div>}

        {!course ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">Select a course to manage its lifecycle.</div> : (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-cyan-400" /><h2 className="text-lg font-bold">Review state</h2></div>
                <div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Status" value={course.status ?? 'draft'} /><Metric label="Review" value={course.review_status ?? 'draft'} /><Metric label="Version" value={course.version ?? '—'} /></div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <ActionButton label="Submit for review" icon={<Send className="h-4 w-4" />} busy={busy === 'submit'} disabled={!!busy} onClick={() => review('submit')} />
                  <ActionButton label="Approve" icon={<CheckCircle2 className="h-4 w-4" />} busy={busy === 'approve'} disabled={!!busy} onClick={() => review('approve')} />
                  <ActionButton label="Reject" busy={busy === 'reject'} disabled={!!busy} onClick={() => review('reject')} />
                  <ActionButton label="Return to draft" busy={busy === 'revert_to_draft'} disabled={!!busy} onClick={() => review('revert_to_draft')} />
                  <ActionButton label="Publish version" icon={<GitBranch className="h-4 w-4" />} busy={busy === 'publish'} disabled={!!busy} onClick={publish} primary />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2"><PackageOpen className="h-5 w-5 text-cyan-400" /><h2 className="text-lg font-bold">SCORM attachment</h2></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton label="Export SCORM 1.2" icon={<PackageOpen className="h-4 w-4" />} busy={busy === 'export-scorm-1.2'} disabled={!courseId || !!busy} onClick={() => exportScorm('1.2')} />
                  <ActionButton label="Export SCORM 2004" icon={<PackageOpen className="h-4 w-4" />} busy={busy === 'export-scorm-2004'} disabled={!courseId || !!busy} onClick={() => exportScorm('2004')} />
                </div>
                <div className="mt-4 flex gap-2"><select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)} className="min-h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"><option value="">Choose an available SCORM package…</option>{availablePackages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.title || pkg.id} — {pkg.scorm_version || pkg.version || 'SCORM'}</option>)}</select><button onClick={linkScorm} disabled={!selectedPackageId || !!busy} className="rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-40">{busy === 'scorm' ? 'Linking…' : 'Link'}</button></div>
                <div className="mt-4 space-y-2">{linkedPackages.length ? linkedPackages.map((pkg) => <div key={pkg.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="font-semibold">{pkg.title || 'Untitled SCORM package'}</div><div className="text-xs text-slate-500">{pkg.scorm_version || pkg.version || 'SCORM'} · {pkg.active === false ? 'inactive' : 'active'}</div>{pkg.launch_url ? <a className="mt-2 inline-block text-xs font-bold text-cyan-400 hover:underline" href={pkg.launch_url} target="_blank" rel="noreferrer">Open launch URL</a> : null}</div>) : <p className="text-sm text-slate-500">No SCORM packages are linked to this course.</p>}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-cyan-400" /><h2 className="text-lg font-bold">Published versions</h2></div>
              <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Version</th><th className="px-3 py-2">Label</th><th className="px-3 py-2">Published</th><th className="px-3 py-2">Snapshot</th><th className="px-3 py-2 text-right">Action</th></tr></thead><tbody>{versions.map((version) => <tr key={version.id} className="border-t border-slate-800"><td className="px-3 py-3 font-bold">v{version.version}</td><td className="px-3 py-3">{version.label || '—'}</td><td className="px-3 py-3 text-slate-400">{version.publishedAt ? new Date(version.publishedAt).toLocaleString() : '—'}</td><td className="px-3 py-3">{version.hasSnapshot ? 'Yes' : 'Legacy'}</td><td className="px-3 py-3 text-right"><button onClick={() => rollback(version.version)} disabled={!version.hasSnapshot || !!busy} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 font-semibold hover:bg-slate-800 disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" /> Restore draft</button></td></tr>)}{versions.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">No versions recorded yet.</td></tr>}</tbody></table></div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 font-bold text-white">{String(value)}</div></div>;
}

function ActionButton({ label, icon, busy, disabled, onClick, primary = false }: { label: string; icon?: React.ReactNode; busy: boolean; disabled: boolean; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40 ${primary ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'border border-slate-700 text-slate-200 hover:bg-slate-800'}`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{label}</button>;
}
