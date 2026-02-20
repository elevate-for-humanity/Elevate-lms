'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, User, FileText, Shield, Key,
  AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { ExamProvider, IdType } from '@/lib/proctor/types';
import { EXAM_PROVIDERS, EXAM_PRESETS } from '@/lib/proctor/types';

type Step = 'exam' | 'student' | 'verify' | 'codes' | 'confirm';
const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'exam', label: 'Exam', icon: <FileText className="w-4 h-4" /> },
  { key: 'student', label: 'Test Taker', icon: <User className="w-4 h-4" /> },
  { key: 'verify', label: 'ID Check', icon: <Shield className="w-4 h-4" /> },
  { key: 'codes', label: 'Start Codes', icon: <Key className="w-4 h-4" /> },
  { key: 'confirm', label: 'Confirm', icon: <CheckCircle2 className="w-4 h-4" /> },
];

interface FormData {
  provider: ExamProvider;
  examName: string;
  examCode: string;
  durationMin: number;
  studentName: string;
  studentEmail: string;
  programSlug: string;
  idVerified: boolean;
  idType: IdType | '';
  idNotes: string;
  startCode: string;
  startKey: string;
  proctorNotes: string;
}

const INITIAL: FormData = {
  provider: 'esco_epa608',
  examName: '',
  examCode: '',
  durationMin: 180,
  studentName: '',
  studentEmail: '',
  programSlug: 'hvac-technician',
  idVerified: false,
  idType: '',
  idNotes: '',
  startCode: '',
  startKey: '',
  proctorNotes: '',
};

export default function NewExamSession() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('exam');
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  function update(partial: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function next() {
    const nextStep = STEPS[stepIdx + 1];
    if (nextStep) setStep(nextStep.key);
  }

  function back() {
    const prevStep = STEPS[stepIdx - 1];
    if (prevStep) setStep(prevStep.key);
  }

  function selectPreset(preset: typeof EXAM_PRESETS[number]) {
    update({
      provider: preset.provider,
      examName: preset.name,
      examCode: preset.code || '',
      durationMin: preset.duration,
    });
  }

  const filteredPresets = EXAM_PRESETS.filter((p) => p.provider === form.provider);

  function canAdvance(): boolean {
    switch (step) {
      case 'exam': return !!form.examName;
      case 'student': return !!form.studentName.trim();
      case 'verify': return form.idVerified && !!form.idType;
      case 'codes': return true; // codes optional for some providers
      case 'confirm': return true;
      default: return false;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proctor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: form.provider,
          exam_name: form.examName,
          exam_code: form.examCode || null,
          duration_min: form.durationMin,
          student_name: form.studentName.trim(),
          student_email: form.studentEmail.trim() || null,
          program_slug: form.programSlug || null,
          id_verified: form.idVerified,
          id_type: form.idType || null,
          id_notes: form.idNotes || null,
          start_code: form.startCode || null,
          start_key: form.startKey || null,
          proctor_notes: form.proctorNotes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create session');
      }
      const data = await res.json();
      router.push(`/proctor/session/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/proctor" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Sessions
      </Link>

      <h2 className="text-2xl font-black text-slate-900 mb-2">New Exam Session</h2>
      <p className="text-slate-500 mb-8">Check in a test taker for a proctored certification exam.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <button
              onClick={() => i <= stepIdx && setStep(s.key)}
              disabled={i > stepIdx}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                s.key === step
                  ? 'bg-brand-blue-600 text-white'
                  : i < stepIdx
                    ? 'bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
          <p className="text-brand-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Step 1: Exam Selection */}
          {step === 'exam' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Exam Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(EXAM_PROVIDERS) as [ExamProvider, { label: string; description: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update({ provider: key, examName: '', examCode: '' })}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        form.provider === key
                          ? 'border-brand-blue-600 bg-brand-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{val.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{val.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {filteredPresets.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Select Exam</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className={`text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                          form.examName === preset.name
                            ? 'border-brand-blue-600 bg-brand-blue-50 font-semibold'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {preset.name}
                        <span className="text-slate-400 ml-2">({preset.duration} min)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Exam Name {!form.examName && <span className="text-brand-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={form.examName}
                  onChange={(e) => update({ examName: e.target.value })}
                  placeholder="e.g. EPA 608 Universal"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Exam Code</label>
                  <input
                    type="text"
                    value={form.examCode}
                    onChange={(e) => update({ examCode: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={form.durationMin}
                    onChange={(e) => update({ durationMin: parseInt(e.target.value) || 180 })}
                    min={15}
                    max={480}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Test Taker */}
          {step === 'student' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Test Taker Name <span className="text-brand-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.studentName}
                  onChange={(e) => update({ studentName: e.target.value })}
                  placeholder="Full legal name as shown on photo ID"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">Must match the name on the photo ID presented.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
                <input
                  type="email"
                  value={form.studentEmail}
                  onChange={(e) => update({ studentEmail: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Program</label>
                <select
                  value={form.programSlug}
                  onChange={(e) => update({ programSlug: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="">Not linked to a program</option>
                  <option value="hvac-technician">HVAC Technician</option>
                  <option value="barber-apprenticeship">Barber Apprenticeship</option>
                  <option value="cna">CNA</option>
                  <option value="medical-assistant">Medical Assistant</option>
                  <option value="cdl">CDL</option>
                  <option value="business-startup">Business Startup</option>
                  <option value="tax-preparation">Tax Preparation</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: ID Verification */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  The test taker must present a valid, unexpired government-issued photo ID before the exam can begin.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  ID Type <span className="text-brand-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ['drivers_license', "Driver's License"],
                    ['state_id', 'State ID'],
                    ['passport', 'Passport'],
                    ['military_id', 'Military ID'],
                    ['other', 'Other'],
                  ] as [IdType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update({ idType: key })}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        form.idType === key
                          ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">ID Notes</label>
                <input
                  type="text"
                  value={form.idNotes}
                  onChange={(e) => update({ idNotes: e.target.value })}
                  placeholder="Optional — e.g. name mismatch, expired, etc."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.idVerified}
                  onChange={(e) => update({ idVerified: e.target.checked })}
                  className="mt-0.5 w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <div>
                  <p className="font-semibold text-slate-900">I have verified the test taker&apos;s photo ID</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    The photo matches the person present, the name matches the registration, and the ID is valid and unexpired.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Step 4: Start Codes */}
          {step === 'codes' && (
            <div className="space-y-6">
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4">
                <p className="text-sm text-brand-blue-800">
                  Enter the start code and start key provided by {EXAM_PROVIDERS[form.provider]?.label || 'the exam provider'}.
                  These are single-use codes that authorize the exam session.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Start Code</label>
                <input
                  type="text"
                  value={form.startCode}
                  onChange={(e) => update({ startCode: e.target.value })}
                  placeholder="Enter start code"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Start Key</label>
                <input
                  type="text"
                  value={form.startKey}
                  onChange={(e) => update({ startKey: e.target.value })}
                  placeholder="Enter start key"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Proctor Notes</label>
                <textarea
                  value={form.proctorNotes}
                  onChange={(e) => update({ proctorNotes: e.target.value })}
                  placeholder="Optional — any notes about this session"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Review &amp; Start Session</h3>

              <div className="divide-y divide-slate-100">
                <ConfirmRow label="Exam" value={`${form.examName} (${EXAM_PROVIDERS[form.provider]?.label})`} />
                <ConfirmRow label="Duration" value={`${form.durationMin} minutes`} />
                <ConfirmRow label="Test Taker" value={form.studentName} />
                {form.studentEmail && <ConfirmRow label="Email" value={form.studentEmail} />}
                {form.programSlug && <ConfirmRow label="Program" value={form.programSlug} />}
                <ConfirmRow label="ID Verified" value={form.idVerified ? `Yes — ${form.idType?.replace('_', ' ')}` : 'No'} />
                {form.startCode && <ConfirmRow label="Start Code" value={form.startCode} mono />}
                {form.startKey && <ConfirmRow label="Start Key" value={form.startKey} mono />}
                {form.proctorNotes && <ConfirmRow label="Notes" value={form.proctorNotes} />}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Reminder:</strong> The test taker will have {form.durationMin} minutes of uninterrupted access.
                  The timer starts when you click &quot;Start Exam Session&quot; below. Ensure the test taker is ready.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
          <div>
            {step !== 'confirm' ? (
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-1.5 text-sm bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 text-sm bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Start Exam Session</>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function ConfirmRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-slate-900 font-medium text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
