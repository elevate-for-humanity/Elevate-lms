'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react';

type FactoryResult = {
  success?: boolean;
  courseId?: string | null;
  title?: string;
  modulesGenerated?: number;
  lessonsGenerated?: number;
  lessonsWithQuizzes?: number;
  videosQueued?: number;
  errors?: string[];
  dryRun?: boolean;
};

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

export default function AutomaticCourseBuilder() {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [state, setState] = useState('Indiana');
  const [credential, setCredential] = useState('');
  const [programSlug, setProgramSlug] = useState('');
  const [programId, setProgramId] = useState('');
  const [modules, setModules] = useState('');
  const [lessonsPerModule, setLessonsPerModule] = useState('');
  const [includeVideos, setIncludeVideos] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [result, setResult] = useState<FactoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!title.trim()) return setError('Course title is required.');
    if (!programId.trim() && !programSlug.trim()) return setError('Program ID or program slug is required so Course Factory can resolve the canonical program.');

    setGenerating(true);
    setError(null);
    setResult(null);
    setProgress([]);

    try {
      const response = await fetch('/api/admin/course-builder/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim() || title.trim(),
          programId: programId.trim() || undefined,
          programSlug: programSlug.trim() || undefined,
          moduleCount: modules ? Number(modules) : undefined,
          lessonsPerModule: lessonsPerModule ? Number(lessonsPerModule) : undefined,
          credential: credential.trim() || undefined,
          state: state || undefined,
          includeVideos,
          dryRun,
        }),
      });

      if (!response.ok || !response.body) {
        const body = await response.text();
        throw new Error(body || `Course Factory request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: FactoryResult | null = null;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';

        for (const frame of frames) {
          const line = frame.split('\n').find((part) => part.startsWith('data: '));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));
          if (event.message) setProgress((current) => [...current, `${event.stage ?? 'factory'}: ${event.message}`]);
          if (event.result) finalResult = event.result as FactoryResult;
        }
        if (done) break;
      }

      if (!finalResult) throw new Error('Course Factory completed without a result payload.');
      setResult(finalResult);
      if (!finalResult.success) setError((finalResult.errors || ['Course Factory validation failed.']).join('; '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Course Factory request failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Sparkles className="h-5 w-5 text-brand-blue-600" />AI Course Factory</h2>
        <p className="mt-1 text-sm text-slate-700">This Studio surface calls the same canonical Course Factory used by program automation. Dry run is on by default so you can validate a build without replacing an existing course.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-900">Course Title *<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prestige Cosmetology Apprenticeship" /></label>
        <label className="block text-sm font-medium text-slate-900">Topic / build instructions<textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Indiana cosmetology apprenticeship curriculum, RTI, practical skills, safety, sanitation, state licensing preparation..." /></label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-900">Program slug<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" value={programSlug} onChange={(e) => setProgramSlug(e.target.value)} placeholder="cosmetology-apprenticeship" /></label>
          <label className="block text-sm font-medium text-slate-900">Program UUID<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" value={programId} onChange={(e) => setProgramId(e.target.value)} placeholder="optional when slug is supplied" /></label>
          <label className="block text-sm font-medium text-slate-900">State<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={state} onChange={(e) => setState(e.target.value)}><option value="">Any</option>{US_STATES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-900">Credential / exam<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={credential} onChange={(e) => setCredential(e.target.value)} placeholder="Indiana cosmetology licensure" /></label>
          <label className="block text-sm font-medium text-slate-900">Module count<input type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={modules} onChange={(e) => setModules(e.target.value)} placeholder="Factory / blueprint default" /></label>
          <label className="block text-sm font-medium text-slate-900">Lessons per module<input type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={lessonsPerModule} onChange={(e) => setLessonsPerModule(e.target.value)} placeholder="Factory / blueprint default" /></label>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-slate-800">
          <label className="flex items-center gap-2"><input type="checkbox" checked={includeVideos} onChange={(e) => setIncludeVideos(e.target.checked)} />Queue media after a real build</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />Dry run (no persistence)</label>
        </div>

        {error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        <button onClick={() => void generate()} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue-600 py-3 font-bold text-white disabled:opacity-60">{generating ? <><Loader2 className="h-4 w-4 animate-spin" />Running Course Factory…</> : <><Sparkles className="h-4 w-4" />{dryRun ? 'Validate with Course Factory' : 'Build with Course Factory'}</>}</button>
      </div>

      {progress.length > 0 && <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-bold text-slate-900">Factory execution trace</div><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{progress.join('\n')}</pre></div>}

      {result && <div className={`mt-5 rounded-lg border p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><div className="flex items-center gap-2 font-bold text-slate-900">{result.success ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}{result.dryRun ? 'Course Factory dry run complete' : 'Course Factory build complete'}</div><dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-800"><div>Title: <strong>{result.title || title}</strong></div><div>Course ID: <strong>{result.courseId || (result.dryRun ? 'not persisted' : 'none')}</strong></div><div>Modules: <strong>{result.modulesGenerated ?? 0}</strong></div><div>Lessons: <strong>{result.lessonsGenerated ?? 0}</strong></div><div>Assessments: <strong>{result.lessonsWithQuizzes ?? 0}</strong></div><div>Videos queued: <strong>{result.videosQueued ?? 0}</strong></div></dl></div>}
    </div>
  );
}
