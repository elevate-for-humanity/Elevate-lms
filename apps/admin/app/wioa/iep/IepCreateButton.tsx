'use client';

import { useState } from 'react';
import { Plus, Loader2, X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Milestone {
  title: string;
  due_date: string;
  completed: boolean;
}

const BARRIER_OPTIONS = [
  'Transportation',
  'Childcare',
  'Housing instability',
  'Limited English proficiency',
  'Disability',
  'Criminal record / justice-involved',
  'Lack of work history',
  'Low basic skills',
  'Domestic violence',
  'Substance use recovery',
  'Mental health',
  'Other',
];

const EDUCATION_LEVELS = [
  'Less than high school',
  'High school diploma / GED',
  'Some college',
  "Associate's degree",
  "Bachelor's degree",
  'Graduate degree',
  'Vocational / trade certificate',
];

const EMPLOYMENT_STATUSES = [
  'Unemployed — looking for work',
  'Unemployed — not looking',
  'Employed part-time',
  'Employed full-time',
  'Underemployed',
];

export default function IepCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Form state
  const [userId, setUserId] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [employmentGoal, setEmploymentGoal] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [targetOccupation, setTargetOccupation] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetWage, setTargetWage] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [strengths, setStrengths] = useState('');
  const [trainingNeeds, setTrainingNeeds] = useState('');
  const [supportServices, setSupportServices] = useState('');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', due_date: '', completed: false },
  ]);

  function toggleBarrier(b: string) {
    setSelectedBarriers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, { title: '', due_date: '', completed: false }]);
  }

  function updateMilestone(i: number, field: keyof Milestone, value: string | boolean) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  function removeMilestone(i: number) {
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));
  }

  function splitLines(val: string): string[] {
    return val
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function submit() {
    if (!userId.trim()) { setError('Participant user ID is required'); return; }
    if (!careerGoal.trim()) { setError('Career goal is required'); return; }

    setSaving(true);
    setError('');

    const body = {
      userId:                userId.trim(),
      careerGoal:            careerGoal.trim(),
      employmentGoal:        employmentGoal.trim() || null,
      educationLevel:        educationLevel || null,
      workExperience:        employmentStatus ? [employmentStatus] : [],
      skills:                splitLines(skills),
      barriers:              selectedBarriers,
      strengths:             splitLines(strengths),
      trainingNeeds:         splitLines(trainingNeeds),
      supportServicesNeeded: splitLines(supportServices),
      targetOccupation:      targetOccupation.trim() || null,
      targetIndustry:        targetIndustry.trim() || null,
      targetWage:            targetWage ? parseFloat(targetWage) : null,
      completionDate:        completionDate || null,
      milestones:            milestones.filter((m) => m.title.trim()),
      notes:                 notes.trim() || null,
    };

    const res = await fetch('/api/wioa/iep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json() as { success?: boolean; error?: { message?: string } | string };

    if (!res.ok || !json.success) {
      const msg = typeof json.error === 'object' ? json.error?.message : json.error;
      setError(msg ?? 'Failed to create IEP');
      setSaving(false);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  function close() {
    setOpen(false);
    setStep(1);
    setError('');
  }

  const STEPS = ['Participant & Goals', 'Background', 'Plan Details', 'Milestones'];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
      >
        <Plus className="w-4 h-4" /> New IEP
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">New Individual Employment Plan</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step {step} of {STEPS.length} — {STEPS[step - 1]}
                </p>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex px-6 pt-4 gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div
                    className={`h-1 rounded-full transition-colors ${
                      i + 1 <= step ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* ── Step 1: Participant & Goals ── */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Participant user ID <span className="text-red-500">*</span>
                      <span className="text-slate-400 font-normal ml-1 text-xs">
                        (UUID from profiles table)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Career goal <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      rows={2}
                      placeholder="Participant's primary career objective…"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Employment goal
                    </label>
                    <textarea
                      value={employmentGoal}
                      onChange={(e) => setEmploymentGoal(e.target.value)}
                      rows={2}
                      placeholder="Specific employment outcome the participant is working toward…"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}

              {/* ── Step 2: Background ── */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Education level
                      </label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select…</option>
                        {EDUCATION_LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Employment status at entry
                      </label>
                      <select
                        value={employmentStatus}
                        onChange={(e) => setEmploymentStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select…</option>
                        {EMPLOYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Identified barriers
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BARRIER_OPTIONS.map((b) => (
                        <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBarriers.includes(b)}
                            onChange={() => toggleBarrier(b)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {b}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Skills <span className="text-slate-400 font-normal text-xs">(one per line)</span>
                    </label>
                    <textarea
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      rows={3}
                      placeholder="Customer service&#10;Basic computer skills&#10;Forklift certified"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Strengths <span className="text-slate-400 font-normal text-xs">(one per line)</span>
                    </label>
                    <textarea
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      rows={2}
                      placeholder="Reliable&#10;Strong work ethic"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}

              {/* ── Step 3: Plan Details ── */}
              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Target occupation
                      </label>
                      <input
                        type="text"
                        value={targetOccupation}
                        onChange={(e) => setTargetOccupation(e.target.value)}
                        placeholder="HVAC Technician"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Target industry
                      </label>
                      <input
                        type="text"
                        value={targetIndustry}
                        onChange={(e) => setTargetIndustry(e.target.value)}
                        placeholder="Construction / Trades"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Target wage ($/hr)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={targetWage}
                        onChange={(e) => setTargetWage(e.target.value)}
                        placeholder="22.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Target completion date
                      </label>
                      <input
                        type="date"
                        value={completionDate}
                        onChange={(e) => setCompletionDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Training needs <span className="text-slate-400 font-normal text-xs">(one per line)</span>
                    </label>
                    <textarea
                      value={trainingNeeds}
                      onChange={(e) => setTrainingNeeds(e.target.value)}
                      rows={2}
                      placeholder="EPA 608 certification&#10;OSHA 10"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Support services needed <span className="text-slate-400 font-normal text-xs">(one per line)</span>
                    </label>
                    <textarea
                      value={supportServices}
                      onChange={(e) => setSupportServices(e.target.value)}
                      rows={2}
                      placeholder="Transportation assistance&#10;Childcare subsidy"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Case notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Additional context for this IEP…"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}

              {/* ── Step 4: Milestones ── */}
              {step === 4 && (
                <>
                  <p className="text-sm text-slate-500">
                    Add measurable milestones. These appear in the participant&apos;s progress
                    view and are tracked for WIOA measurable skill gains reporting.
                  </p>

                  <div className="space-y-3">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                            placeholder={`Milestone ${i + 1}`}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <input
                            type="date"
                            value={m.due_date}
                            onChange={(e) => updateMilestone(i, 'due_date', e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <button
                            onClick={() => removeMilestone(i)}
                            className="text-slate-400 hover:text-red-500 transition mt-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addMilestone}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
                  >
                    <Plus className="w-4 h-4" /> Add milestone
                  </button>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Back
                </button>
              )}
              {step < STEPS.length ? (
                <button
                  onClick={() => { setError(''); setStep((s) => s + 1); }}
                  disabled={step === 1 && (!userId.trim() || !careerGoal.trim())}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Create IEP</>
                  )}
                </button>
              )}
              {step === 1 && (
                <button
                  onClick={close}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
