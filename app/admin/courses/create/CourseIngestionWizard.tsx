'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, FileText, Video, BookOpen, Upload, Loader2 } from 'lucide-react';
import type { CourseBlueprint, SourceType } from '@/lib/ai/course-ingestion';
import BlueprintReview from './BlueprintReview';

interface Props {
  programs: { id: string; title: string }[];
}

type Phase = 'input' | 'processing' | 'review' | 'saving' | 'resumable';

const INPUT_MODES: {
  id: SourceType;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
}[] = [
  {
    id: 'prompt',
    label: 'Describe it',
    description: 'Tell the AI what course you want built',
    icon: MessageSquare,
    placeholder:
      'e.g. Build a 6-week beginner HVAC course for adults entering the trades. Include safety, tools, refrigerant handling, and a final certification prep module. Add a certificate of completion.',
  },
  {
    id: 'syllabus',
    label: 'Upload syllabus',
    description: 'Paste or upload a syllabus, outline, or curriculum map',
    icon: FileText,
    placeholder:
      'Paste your syllabus here — weekly structure, objectives, topics, assignments, grading criteria...',
  },
  {
    id: 'script',
    label: 'Upload script',
    description: 'Paste a video script or lesson narration draft',
    icon: Video,
    placeholder:
      'Paste your script or narration draft here. The AI will chunk it into lessons and generate structure around it.',
  },
  {
    id: 'document',
    label: 'Upload document',
    description: 'Paste a policy manual, standards doc, or reference material',
    icon: BookOpen,
    placeholder:
      'Paste your source document here — policy manual, compliance guide, standards document, training manual...',
  },
];

const ACCEPTED = '.txt,.md,.pdf,.docx,.doc';

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

  const selectedMode = INPUT_MODES.find((m) => m.id === mode)!;

  // Server-side file parsing for PDF/DOCX; browser text() for txt/md
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const needsServerParse = ext === '.pdf' || ext === '.docx' || ext === '.doc';

    if (needsServerParse) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/admin/courses/parse-file', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'File parsing failed.'); return; }
        setSourceText(json.text);
        // Surface OCR warnings as non-blocking notices
        if (json.warning) setFileWarning(json.warning);
        else setFileWarning(null);
      } catch {
        setError('File upload failed. Try copying and pasting the content instead.');
      }
    } else {
      setSourceText(await file.text());
    }
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleGenerate = async () => {
    if (!sourceText.trim() || sourceText.trim().length < 20) {
      setError('Please enter at least 20 characters of content.');
      return;
    }
    setError(null);
    setPhase('processing');

    try {
      const res = await fetch('/api/admin/courses/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: mode,
          source_text: sourceText,
          course_mode: programId ? 'program-linked' : 'standalone',
          program_id: programId || null,
          certificate_enabled: certEnabled,
          preview_only: true,
        }),
      });
      const json = await res.json();
      if (json.resumable && json.job_id) {
        setResumeJobId(json.job_id);
        setPhase('resumable');
        return;
      }
      if (!res.ok) { setError(json.error || 'Generation failed.'); setPhase('input'); return; }
      setBlueprint(json.blueprint);
      setPhase('review');
    } catch {
      setError('Network error. Please try again.');
      setPhase('input');
    }
  };

  const handleSaveDraft = async (edited: CourseBlueprint) => {
    setError(null);
    setPhase('saving');
    try {
      const res = await fetch('/api/admin/courses/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: mode,
          source_text: sourceText,
          course_mode: programId ? 'program-linked' : 'standalone',
          program_id: programId || null,
          certificate_enabled: edited.certificate_enabled,
          preview_only: false,
          compile_lessons: compileLessons,
          // Pass edited blueprint so we don't re-run the blueprint AI step
          blueprint_override: edited,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to save draft.'); setPhase('review'); return; }
      router.push(`/admin/courses/${json.courseId}/content`);
    } catch {
      setError('Network error. Please try again.');
      setPhase('review');
    }
  };

  const handleResume = async () => {
    if (!resumeJobId) return;
    setError(null);
    setPhase('processing');
    try {
      const res = await fetch(`/api/admin/courses/ingest?job_id=${resumeJobId}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Resume failed.'); setPhase('resumable'); return; }
      setBlueprint(json.blueprint);
      setPhase('review');
    } catch {
      setError('Network error during resume. Please try again.');
      setPhase('resumable');
    }
  };

  if (phase === 'resumable') {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-10 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-yellow-600 text-xl">⏸</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Processing paused</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your document was too large to process in one request. The summarized content was saved.
          Click Resume to complete the course generation — it will pick up where it left off.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleResume}
            className="bg-brand-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-blue-700 font-medium text-sm"
          >
            Resume generation
          </button>
          <button
            onClick={() => { setPhase('input'); setResumeJobId(null); setError(null); }}
            className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-10 h-10 text-brand-blue-600 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900">Compiling course…</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Classifying input, extracting structure, generating modules and lessons.
          This takes 15–45 seconds depending on document length.
        </p>
      </div>
    );
  }

  if (phase === 'saving') {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-10 h-10 text-brand-blue-600 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900">Saving draft…</h2>
        <p className="text-sm text-gray-500">Creating course, modules, and lessons in the database.</p>
      </div>
    );
  }

  if (phase === 'review' && blueprint) {
    return (
      <BlueprintReview
        initial={blueprint}
        error={error}
        onBack={() => setPhase('input')}
        onSave={handleSaveDraft}
      />
    );
  }

  // ── Input phase ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INPUT_MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setSourceText(''); setError(null); setFileWarning(null); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-colors ${
                active
                  ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-gray-500 leading-tight">{m.description}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{selectedMode.label}</h2>
          {mode !== 'prompt' && (
            <label className="flex items-center gap-2 text-sm text-brand-blue-600 cursor-pointer hover:text-brand-blue-700">
              <Upload className="w-4 h-4" />
              Upload file
              <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>

        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder={selectedMode.placeholder}
          rows={10}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 resize-y"
        />

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{sourceText.length.toLocaleString()} / 80,000 characters</span>
          {sourceText.length > 80000 && <span className="text-red-500">Too long — split into sections</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to program (optional)</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Stand-alone course</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="cert_enabled"
              checked={certEnabled}
              onChange={(e) => setCertEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <label htmlFor="cert_enabled" className="text-sm text-gray-700">
              Generate certificate of completion
            </label>
          </div>
        </div>

        {fileWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ {fileWarning}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!sourceText.trim() || sourceText.length > 80000}
          className="w-full bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
        >
          Build draft course
        </button>
      </div>
    </div>
  );
}
