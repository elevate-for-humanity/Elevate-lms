'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface GenerateResult {
  ok: boolean;
  course_id?: string;
  title?: string;
  modules_inserted?: number;
  lessons_generated?: number;
  lessons_published?: number;
  compliance_status?: string;
  compliance_profile_key?: string;
  generation_attempt?: number;
  review_required?: boolean;
  error?: string;
  errors_per_attempt?: string[][];
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const COMPLIANCE_PROFILES = [
  { value: '', label: 'Auto-detect from course' },
  { value: 'internal_basic', label: 'Internal Basic' },
  { value: 'state_board_strict', label: 'State Board / Licensure' },
  { value: 'dol_apprenticeship', label: 'DOL Registered Apprenticeship' },
  { value: 'naadac_peer_support', label: 'NAADAC / Peer Support' },
  { value: 'custom_regulated', label: 'Custom Regulated Credential' },
];

export default function AutomaticCourseBuilder() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('');
  const [hours, setHours] = useState('');
  const [state, setState] = useState('Indiana');
  const [credential, setCredential] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');
  const [prompt, setPrompt] = useState('');
  const [programId, setProgramId] = useState('');
  const [complianceProfileKey, setComplianceProfileKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!title.trim()) return setError('Course title is required.');
    if (!audience.trim()) return setError('Target audience is required.');

    setError(null);
    setResult(null);
    setGenerating(true);

    try {
      const res = await fetch('/api/admin/course-builder/automatic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          audience: audience.trim(),
          hours: hours ? Number(hours) : undefined,
          state: state || undefined,
          credentialOrExam: credential.trim() || undefined,
          deliveryFormat: deliveryFormat.trim() || undefined,
          prompt: prompt.trim() || undefined,
          programId: programId.trim() || undefined,
          complianceProfileKey: complianceProfileKey || undefined,
        }),
      });

      const data: GenerateResult = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));
      setResult(data);
      if (!res.ok && !data.error) setError(`Generation failed (${res.status}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Sparkles className="h-5 w-5 text-brand-blue-600" /> AI Course Generator
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          Generates a complete workforce course, validates the structure, assigns a compliance profile,
          and saves it as a draft for human review. Publishing remains behind the canonical Course Builder compliance gate.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Course Title" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CNA Certification Prep — Indiana NATCEP" className="input" />
        </Field>
        <Field label="Target Audience" required>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Adults seeking entry-level healthcare employment" className="input" />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Total Hours">
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} min={1} placeholder="e.g. 144" className="input" />
          </Field>
          <Field label="State">
            <select value={state} onChange={(e) => setState(e.target.value)} className="input">
              <option value="">Any state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Credential or Exam">
            <input value={credential} onChange={(e) => setCredential(e.target.value)} placeholder="e.g. EPA 608, NHA CCMA, Indiana Barber License" className="input" />
          </Field>
          <Field label="Compliance Profile">
            <select value={complianceProfileKey} onChange={(e) => setComplianceProfileKey(e.target.value)} className="input">
              {COMPLIANCE_PROFILES.map((profile) => <option key={profile.value || 'auto'} value={profile.value}>{profile.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Delivery Format">
          <input value={deliveryFormat} onChange={(e) => setDeliveryFormat(e.target.value)} placeholder="e.g. Hybrid — online theory + in-person lab" className="input" />
        </Field>
        <Field label="Additional Instructions">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Specific topics, standards, competencies, practicals, assessment rules, or content requirements..." className="input resize-y" />
        </Field>
        <Field label="Program ID" hint="Optional — links the generated course to an existing program">
          <input value={programId} onChange={(e) => setProgramId(e.target.value)} placeholder="Program UUID" className="input font-mono" />
        </Field>

        {error && <Notice tone="error">{error}</Notice>}

        <button onClick={generate} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue-600 py-3 font-bold text-white hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating + validating…</> : <><Sparkles className="h-4 w-4" />Generate Draft Course</>}
        </button>
      </div>

      {result && (
        <div className={`mt-6 rounded-lg border p-4 ${result.ok ? 'border-brand-green-200 bg-brand-green-50' : 'border-red-200 bg-red-50'}`}>
          {result.ok ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-brand-green-600" />
                <span className="font-bold text-brand-green-800">Draft course generated successfully</span>
              </div>
              <dl className="space-y-1 text-sm text-brand-green-900">
                <Row label="Title" value={result.title} />
                <Row label="Modules" value={result.modules_inserted} />
                <Row label="Lessons generated" value={result.lessons_generated ?? result.lessons_published} />
                <Row label="Generation attempt" value={result.generation_attempt ? `${result.generation_attempt} / 3` : undefined} />
                <Row label="Compliance profile" value={result.compliance_profile_key} />
                <Row label="Review status" value={result.compliance_status} />
              </dl>
              {result.course_id && (
                <button onClick={() => router.push(`/course-builder?courseId=${encodeURIComponent(result.course_id!)}&tab=compliance`)} className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-green-700 hover:text-brand-green-900">
                  Review in Course Builder <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                AI-generated lessons remain draft content until the Course Builder audit and publish gates pass.
              </p>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /><span className="font-bold text-red-800">Generation failed</span></div>
              <p className="mb-2 text-sm text-red-700">{result.error}</p>
              {result.errors_per_attempt && (
                <details className="text-xs text-red-600"><summary className="cursor-pointer font-medium">Validation errors per attempt</summary><pre className="mt-2 whitespace-pre-wrap rounded bg-red-100 p-2">{result.errors_per_attempt.map((errs, i) => `Attempt ${i + 1}:\n${errs.map((e) => `  • ${e}`).join('\n')}`).join('\n\n')}</pre></details>
              )}
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .input { width: 100%; border: 1px solid rgb(203 213 225); border-radius: .5rem; padding: .55rem .75rem; font-size: .875rem; color: rgb(15 23 42); background: white; }
        .input:focus { outline: none; border-color: rgb(59 130 246); box-shadow: 0 0 0 2px rgb(191 219 254); }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-sm font-medium text-slate-900">{label}{required && <span className="text-red-500"> *</span>}{hint && <span className="ml-2 font-normal text-slate-500">({hint})</span>}</label>{children}</div>;
}

function Notice({ children }: { tone: 'error'; children: React.ReactNode }) {
  return <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>;
}

function Row({ label, value }: { label: string; value: unknown }) {
  return <div className="flex justify-between gap-4"><dt>{label}</dt><dd className="text-right font-medium">{value === undefined || value === null || value === '' ? '—' : String(value)}</dd></div>;
}
