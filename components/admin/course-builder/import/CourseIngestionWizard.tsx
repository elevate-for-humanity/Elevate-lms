'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, Loader2, MessageSquare, Upload, Video } from 'lucide-react';
import type { CourseBlueprint, SourceType } from '@/lib/ai/course-ingestion';
import BlueprintReview from './BlueprintReview';

type Program = { id: string; title: string };
interface Props { programs: Program[] }
type Phase = 'input' | 'processing' | 'review' | 'saving' | 'resumable';

const INPUT_MODES: Array<{
  id: SourceType;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
}> = [
  { id: 'prompt', label: 'Describe it', description: 'Tell the AI what course you want built', icon: MessageSquare, placeholder: 'Describe the course, audience, standards, modules, assessments, practicals, and credentials.' },
  { id: 'syllabus', label: 'Upload syllabus', description: 'Paste or upload a syllabus, outline, or curriculum map', icon: FileText, placeholder: 'Paste your syllabus here — weekly structure, objectives, topics, assignments, grading criteria...' },
  { id: 'script', label: 'Upload script', description: 'Paste a video script or lesson narration draft', icon: Video, placeholder: 'Paste your script or narration draft. The builder will structure it into lessons.' },
  { id: 'document', label: 'Upload document', description: 'Paste a standards document, manual, or reference source', icon: BookOpen, placeholder: 'Paste policy, standards, credential requirements, training manuals, or source material...' },
];

const ACCEPTED = '.txt,.md,.pdf,.docx,.doc';
const INGEST_API = '/api/admin/course-builder/import/ingest';
const PARSE_API = '/api/admin/course-builder/import/parse-file';

export default function CourseIngestionWizard({ programs }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [mode, setMode] = useState<SourceType>('prompt');
  const [sourceText, setSourceText] = useState('');
  const [programId, setProgramId] = useState('');
  const [certEnabled, setCertEnabled] = useState(true);
  const [compileLessons, setCompileLessons] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<CourseBlueprint | null>(null);
  const [resumeJobId, setResumeJobId] = useState<string | null>(null);
  const selectedMode = INPUT_MODES.find((item) => item.id === mode)!;

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileWarning(null);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const needsServerParse = ['.pdf', '.docx', '.doc'].includes(ext);
    try {
      if (needsServerParse) {
        const form = new FormData();
        form.append('file', file);
        const response = await fetch(PARSE_API, { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'File parsing failed');
        setSourceText(data.text || '');
        if (data.warning) setFileWarning(data.warning);
      } else {
        setSourceText(await file.text());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed. Paste the content instead.');
    } finally {
      event.target.value = '';
    }
  }

  async function requestBlueprint(previewOnly: boolean, override?: CourseBlueprint) {
    const response = await fetch(INGEST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_type: mode,
        source_text: sourceText,
        course_mode: programId ? 'program-linked' : 'standalone',
        program_id: programId || null,
        certificate_enabled: override?.certificate_enabled ?? certEnabled,
        preview_only: previewOnly,
        compile_lessons: previewOnly ? undefined : compileLessons,
        blueprint_override: override,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || (previewOnly ? 'Generation failed' : 'Failed to save draft'));
    return data;
  }

  async function handleGenerate() {
    if (sourceText.trim().length < 20) return setError('Enter at least 20 characters of source material.');
    setError(null);
    setPhase('processing');
    try {
      const data = await requestBlueprint(true);
      if (data.resumable && data.job_id) {
        setResumeJobId(data.job_id);
        setPhase('resumable');
        return;
      }
      setBlueprint(data.blueprint);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setPhase('input');
    }
  }

  async function handleSaveDraft(edited: CourseBlueprint) {
    setError(null);
    setPhase('saving');
    try {
      const data = await requestBlueprint(false, edited);
      if (!data.courseId) throw new Error('Draft saved but no course ID was returned');
      router.push(`/course-builder?courseId=${encodeURIComponent(data.courseId)}&tab=build`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
      setPhase('review');
    }
  }

  async function handleResume() {
    if (!resumeJobId) return;
    setError(null);
    setPhase('processing');
    try {
      const response = await fetch(`${INGEST_API}?job_id=${encodeURIComponent(resumeJobId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Resume failed');
      setBlueprint(data.blueprint);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume failed');
      setPhase('resumable');
    }
  }

  if (phase === 'resumable') {
    return <StateCard title="Processing paused" message="The source was too large for one request. Its summarized state was saved and can resume without starting over." error={error}>
      <button onClick={handleResume} className="rounded-lg bg-brand-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-700">Resume generation</button>
      <button onClick={() => { setPhase('input'); setResumeJobId(null); setError(null); }} className="rounded-lg border px-6 py-2.5 text-sm text-slate-900 hover:bg-slate-50">Start over</button>
    </StateCard>;
  }

  if (phase === 'processing') return <LoadingCard title="Compiling course…" message="Classifying source material, extracting structure, and generating a reviewable blueprint." />;
  if (phase === 'saving') return <LoadingCard title="Saving draft…" message="Creating the canonical course, modules, lessons, and review metadata." />;

  if (phase === 'review' && blueprint) {
    return <BlueprintReview initial={blueprint} error={error} onBack={() => setPhase('input')} onSave={handleSaveDraft} />;
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INPUT_MODES.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return <button key={item.id} onClick={() => { setMode(item.id); setSourceText(''); setError(null); setFileWarning(null); }} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-colors ${active ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
            <Icon className="h-6 w-6" /><span className="text-sm font-medium">{item.label}</span><span className="text-xs leading-tight text-slate-600">{item.description}</span>
          </button>;
        })}
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selectedMode.label}</h2>
          {mode !== 'prompt' && <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700"><Upload className="h-4 w-4" />Upload file<input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileUpload} /></label>}
        </div>

        <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder={selectedMode.placeholder} rows={11} className="w-full resize-y rounded-lg border px-4 py-3 text-sm focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-500" />
        <div className="flex items-center justify-between text-xs text-slate-600"><span>{sourceText.length.toLocaleString()} / 80,000 characters</span>{sourceText.length > 80000 && <span className="text-red-600">Too long — split the source into sections</span>}</div>

        <div className="grid gap-4 border-t pt-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium">Link to program</label><select value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">Stand-alone course</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></div>
          <div className="space-y-2 pt-1 sm:pt-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={certEnabled} onChange={(e) => setCertEnabled(e.target.checked)} />Generate certificate configuration</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={compileLessons} onChange={(e) => setCompileLessons(e.target.checked)} />Compile full lesson content when saving</label>
          </div>
        </div>

        {fileWarning && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">⚠️ {fileWarning}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button onClick={handleGenerate} disabled={sourceText.trim().length < 20 || sourceText.length > 80000} className="w-full rounded-lg bg-brand-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Build reviewable draft</button>
      </div>
    </div>
  );
}

function LoadingCard({ title, message }: { title: string; message: string }) {
  return <div className="flex flex-col items-center gap-4 rounded-xl border bg-white p-12 text-center text-slate-900 shadow-sm"><Loader2 className="h-10 w-10 animate-spin text-brand-blue-600" /><h2 className="text-lg font-semibold">{title}</h2><p className="max-w-md text-sm text-slate-600">{message}</p></div>;
}

function StateCard({ title, message, error, children }: { title: string; message: string; error: string | null; children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-4 rounded-xl border bg-white p-10 text-center text-slate-900 shadow-sm"><h2 className="text-lg font-semibold">{title}</h2><p className="max-w-md text-sm text-slate-600">{message}</p>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex gap-3">{children}</div></div>;
}
