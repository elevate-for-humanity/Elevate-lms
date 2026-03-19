'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Save, Search, Upload } from 'lucide-react';
import type {
  ExamSession, ExamProvider, ExamSessionStatus, ExamResult,
  IdType, DeliveryMethod,
} from './types';
import {
  PROVIDER_LABELS, STATUS_LABELS, RESULT_LABELS,
  EPA_EXAMS, DEFAULT_PROCTOR_NAME,
  ESCO_PROCTOR_ID, MAINSTREAM_PROCTOR_ID,
} from './types';

interface Props {
  session: ExamSession | null;
  onSaved: () => void;
  onCancel: () => void;
}

interface StudentMatch {
  id: string;
  full_name: string;
  email: string;
}

export default function NewSessionForm({ session, onSaved, onCancel }: Props) {
  const supabase = createClient();
  const isEdit = !!session;

  // Current user's tenant + profile
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (profile) setTenantId(profile.tenant_id);
      }
    })();
  }, [supabase]);

  // Student lookup
  const [studentSearch, setStudentSearch] = useState('');
  const [studentMatches, setStudentMatches] = useState<StudentMatch[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Form state
  const [studentId, setStudentId] = useState(session?.student_id || '');
  const [studentName, setStudentName] = useState(session?.student_name || '');
  const [studentEmail, setStudentEmail] = useState(session?.student_email || '');
  const [provider, setProvider] = useState<ExamProvider>(session?.provider || 'mainstream_epa608');
  const [examName, setExamName] = useState(session?.exam_name || 'EPA 608 — Universal');
  const [examCode, setExamCode] = useState(session?.exam_code || '');
  const [startCode, setStartCode] = useState(session?.start_code || '');
  const [startKey, setStartKey] = useState(session?.start_key || '');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(session?.delivery_method || 'in_person');
  const [idVerified, setIdVerified] = useState(session?.id_verified ?? false);
  const [idType, setIdType] = useState<IdType | ''>(session?.id_type || '');
  const [idNotes, setIdNotes] = useState(session?.id_notes || '');
  const [status, setStatus] = useState<ExamSessionStatus>(session?.status || 'checked_in');
  const [result, setResult] = useState<ExamResult>(session?.result || 'pending');
  const [score, setScore] = useState(session?.score?.toString() || '');
  const [durationMin, setDurationMin] = useState(session?.duration_min?.toString() || '180');
  const [startedAt, setStartedAt] = useState(session?.started_at?.slice(0, 16) || '');
  const [completedAt, setCompletedAt] = useState(session?.completed_at?.slice(0, 16) || '');
  const [proctorName, setProctorName] = useState(session?.proctor_name || DEFAULT_PROCTOR_NAME);
  const [proctorNotes, setProctorNotes] = useState(session?.proctor_notes || '');
  const [isRetest, setIsRetest] = useState(session?.is_retest ?? false);
  const [programSlug, setProgramSlug] = useState(session?.program_slug || 'hvac-technician');
  const [evidenceUrl, setEvidenceUrl] = useState(session?.evidence_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Student search
  useEffect(() => {
    if (studentSearch.length < 2) { setStudentMatches([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${studentSearch}%,email.ilike.%${studentSearch}%`)
        .limit(8);
      if (data) setStudentMatches(data as StudentMatch[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, supabase]);

  // Exam eligibility: training + quizzes must be complete before exam
  const [eligibility, setEligibility] = useState<{
    checked: boolean;
    eligible: boolean;
    lessonsComplete: string;
    quizzesPassed: string;
    message: string;
  } | null>(null);

  const checkEligibility = async (userId: string) => {
    setEligibility(null);
    if (!userId) return;

    // Check lesson completion
    const { count: totalLessons } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0');

    const { count: completedLessons } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    // Check quiz pass status
    const { data: quizLessons } = await supabase
      .from('training_lessons')
      .select('id')
      .eq('course_id', '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0')
      .eq('content_type', 'quiz');

    let quizzesPassed = 0;
    const totalQuizzes = quizLessons?.length || 0;
    if (quizLessons) {
      for (const q of quizLessons) {
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq('user_uuid', userId)
          .eq('quiz_id', q.id)
          .eq('passed', true)
          .limit(1)
          .maybeSingle();
        if (attempt) quizzesPassed++;
      }
    }

    const allLessonsDone = (completedLessons || 0) >= (totalLessons || 0);
    const allQuizzesPassed = quizzesPassed >= totalQuizzes;
    const eligible = allLessonsDone && allQuizzesPassed;

    setEligibility({
      checked: true,
      eligible,
      lessonsComplete: `${completedLessons || 0}/${totalLessons || 0}`,
      quizzesPassed: `${quizzesPassed}/${totalQuizzes}`,
      message: eligible
        ? 'Student has completed all training requirements and is eligible for the proctored exam.'
        : `Training incomplete: ${!allLessonsDone ? `${(totalLessons || 0) - (completedLessons || 0)} lessons remaining` : ''}${!allLessonsDone && !allQuizzesPassed ? ', ' : ''}${!allQuizzesPassed ? `${totalQuizzes - quizzesPassed} quizzes not passed` : ''}`,
    });
  };

  const selectStudent = (s: StudentMatch) => {
    setStudentId(s.id);
    setStudentName(s.full_name);
    setStudentEmail(s.email);
    setStudentSearch('');
    setShowStudentDropdown(false);
    checkEligibility(s.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentName.trim()) { setError('Student name is required.'); return; }
    if (!idVerified) { setError('ID verification is required before logging an exam session.'); return; }
    if (!idType) { setError('Select the ID type used for verification.'); return; }

    setSaving(true);

    const payload = {
      tenant_id: tenantId,
      student_id: studentId || null,
      student_name: studentName.trim(),
      student_email: studentEmail.trim() || null,
      provider,
      exam_name: examName,
      exam_code: examCode || null,
      start_code: startCode || null,
      start_key: startKey || null,
      delivery_method: deliveryMethod,
      id_verified: idVerified,
      id_type: idType || null,
      id_notes: idNotes || null,
      status,
      result,
      score: score ? parseFloat(score) : null,
      duration_min: parseInt(durationMin) || 180,
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
      completed_at: completedAt ? new Date(completedAt).toISOString() : null,
      proctor_id: currentUserId,
      proctor_name: proctorName,
      proctor_notes: proctorNotes || null,
      is_retest: isRetest,
      program_slug: programSlug || null,
      evidence_url: evidenceUrl || null,
    };

    let err;
    if (isEdit && session) {
      const { error: updateErr } = await supabase
        .from('exam_sessions')
        .update(payload)
        .eq('id', session.id);
      err = updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('exam_sessions')
        .insert(payload);
      err = insertErr;
    }

    setSaving(false);
    if (err) {
      setError('Failed to create session. Please try again.');
    } else {
      onSaved();
    }
  };

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {children} {required && <span className="text-brand-red-500">*</span>}
    </label>
  );

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500';
  const selectCls = inputCls;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          {isEdit ? 'Edit Exam Session' : 'Log New Exam Session'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Section 1: Student */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-800 uppercase tracking-wider">Student Information</legend>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="relative">
              <Label required>Student Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch || studentName}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setStudentName(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Search or type name..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              {showStudentDropdown && studentMatches.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {studentMatches.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectStudent(m)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-brand-blue-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium">{m.full_name}</span>
                      <span className="text-slate-400 ml-2">{m.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Email</Label>
              <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className={inputCls} placeholder="student@email.com" />
            </div>
            <div>
              <Label>Program</Label>
              <select value={programSlug} onChange={e => setProgramSlug(e.target.value)} className={selectCls}>
                <option value="hvac-technician">HVAC Technician</option>
                <option value="construction-trades-certification">Construction Trades Certification</option>
                <option value="electrical">Electrical Technician</option>
                <option value="plumbing">Plumbing Technician</option>
                <option value="">Other / Standalone</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Exam Eligibility Check */}
        {eligibility?.checked && (
          <div className={`rounded-lg border p-4 ${eligibility.eligible ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{eligibility.eligible ? '✅' : '⚠️'}</span>
              <div>
                <p className={`text-sm font-semibold ${eligibility.eligible ? 'text-green-800' : 'text-amber-800'}`}>
                  {eligibility.eligible ? 'Eligible for Proctored Exam' : 'Training Incomplete'}
                </p>
                <p className={`text-sm mt-1 ${eligibility.eligible ? 'text-green-700' : 'text-amber-700'}`}>
                  {eligibility.message}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-slate-600">
                  <span>Lessons: {eligibility.lessonsComplete}</span>
                  <span>Quizzes passed: {eligibility.quizzesPassed}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Exam Details */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-800 uppercase tracking-wider">Exam Details</legend>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label required>Provider</Label>
              <select value={provider} onChange={e => setProvider(e.target.value as ExamProvider)} className={selectCls}>
                {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label required>Exam</Label>
              <select value={examName} onChange={e => setExamName(e.target.value)} className={selectCls}>
                {EPA_EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                <option value="OSHA 10-Hour">OSHA 10-Hour</option>
                <option value="OSHA 30-Hour">OSHA 30-Hour</option>
                <option value="IC3 Digital Literacy">IC3 Digital Literacy</option>
                <option value="IT Specialist">IT Specialist</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label>Delivery Method</Label>
              <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as DeliveryMethod)} className={selectCls}>
                <option value="in_person">In-Person (proctored at site)</option>
                <option value="online_proctored">Online (proctored remotely)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Exam Code</Label>
              <input type="text" value={examCode} onChange={e => setExamCode(e.target.value)} className={inputCls} placeholder="Provider exam code" />
            </div>
            <div>
              <Label>Start Code</Label>
              <input type="text" value={startCode} onChange={e => setStartCode(e.target.value)} className={inputCls} placeholder="One-time start code" />
            </div>
            <div>
              <Label>Start Key</Label>
              <input type="text" value={startKey} onChange={e => setStartKey(e.target.value)} className={inputCls} placeholder="Start key (if applicable)" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isRetest} onChange={e => setIsRetest(e.target.checked)} className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
              <span className="text-slate-700">This is a retest</span>
            </label>
          </div>
        </fieldset>

        {/* Section 3: ID Verification */}
        <fieldset className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <legend className="text-sm font-bold text-amber-800 uppercase tracking-wider">Identity Verification</legend>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={e => setIdVerified(e.target.checked)}
                  className="rounded border-slate-300 text-brand-green-600 focus:ring-brand-green-500"
                />
                <span className="font-semibold text-slate-700">ID Verified <span className="text-brand-red-500">*</span></span>
              </label>
            </div>
            <div>
              <Label required>ID Type</Label>
              <select value={idType} onChange={e => setIdType(e.target.value as IdType)} className={selectCls}>
                <option value="">Select ID type...</option>
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="state_id">State ID</option>
                <option value="passport">Passport</option>
                <option value="military_id">Military ID</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>ID Notes</Label>
              <input type="text" value={idNotes} onChange={e => setIdNotes(e.target.value)} className={inputCls} placeholder="e.g., Name mismatch — used maiden name" />
            </div>
          </div>
        </fieldset>

        {/* Section 4: Session Tracking */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-800 uppercase tracking-wider">Session Tracking</legend>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <select value={status} onChange={e => setStatus(e.target.value as ExamSessionStatus)} className={selectCls}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Result</Label>
              <select value={result} onChange={e => setResult(e.target.value as ExamResult)} className={selectCls}>
                {Object.entries(RESULT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Score (%)</Label>
              <input type="number" min="0" max="100" step="0.1" value={score} onChange={e => setScore(e.target.value)} className={inputCls} placeholder="e.g., 84.5" />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <input type="number" min="1" value={durationMin} onChange={e => setDurationMin(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Started At</Label>
              <input type="datetime-local" value={startedAt} onChange={e => setStartedAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label>Completed At</Label>
              <input type="datetime-local" value={completedAt} onChange={e => setCompletedAt(e.target.value)} className={inputCls} />
            </div>
          </div>
        </fieldset>

        {/* Section 5: Proctor */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-800 uppercase tracking-wider">Proctor Information</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label required>Proctor Name</Label>
              <input type="text" value={proctorName} onChange={e => setProctorName(e.target.value)} className={inputCls} />
              <p className="text-xs text-slate-400 mt-1">
                Proctor ID: {provider === 'esco_epa608' ? ESCO_PROCTOR_ID : MAINSTREAM_PROCTOR_ID}
              </p>
            </div>
            <div>
              <Label>Proctor Notes</Label>
              <textarea
                value={proctorNotes}
                onChange={e => setProctorNotes(e.target.value)}
                rows={2}
                className={inputCls}
                placeholder="Any irregularities, accommodations, or observations..."
              />
            </div>
          </div>
        </fieldset>

        {/* Section 6: Evidence */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-800 uppercase tracking-wider">Evidence (Optional)</legend>
          <div>
            <Label>Evidence URL</Label>
            <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} className={inputCls} placeholder="Link to uploaded certificate, score report, or photo" />
            <p className="text-xs text-slate-400 mt-1">Upload evidence to Supabase Storage and paste the URL here, or link to an external document.</p>
          </div>
        </fieldset>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEdit ? 'Update Session' : 'Log Session'}
        </button>
      </div>
    </form>
  );
}
