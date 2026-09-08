'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Mic, MicOff, Save } from 'lucide-react';

type Student = {
  enrollmentId: string;
  studentId: string;
  name: string;
  email: string;
  programId: string;
  programName: string;
  enrollmentStatus: string;
  reportedHours: number;
};

type VoiceField = 'classroom_topics' | 'hands_on_activities' | 'instructor_notes';

export function ProgressReportClient({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState(students[0]?.enrollmentId ?? '');
  const [hours, setHours] = useState('');
  const [classroomTopics, setClassroomTopics] = useState('');
  const [handsOnActivities, setHandsOnActivities] = useState('');
  const [competencies, setCompetencies] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [progressStatus, setProgressStatus] = useState('on_track');
  const [readyForTesting, setReadyForTesting] = useState(false);
  const [notes, setNotes] = useState('');
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [listening, setListening] = useState<VoiceField | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const selected = useMemo(
    () => students.find((student) => student.enrollmentId === studentId),
    [studentId, students],
  );

  function setVoiceText(field: VoiceField, text: string) {
    const append = (current: string) => `${current}${current ? ' ' : ''}${text}`.trim();
    if (field === 'classroom_topics') setClassroomTopics(append);
    if (field === 'hands_on_activities') setHandsOnActivities(append);
    if (field === 'instructor_notes') setNotes(append);
  }

  function toggleVoice(field: VoiceField) {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(null);
      return;
    }
    const Recognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setMessage(
        'Voice input is not supported on this browser. You can type the same information.',
      );
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      if (text) {
        setVoiceText(field, text);
        setVoiceUsed(true);
      }
    };
    recognition.onerror = () =>
      setMessage('Voice input stopped. You can try again or type the entry.');
    recognition.onend = () => setListening(null);
    recognitionRef.current = recognition;
    setListening(field);
    setMessage('');
    recognition.start();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/instructor/progress-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program_enrollment_id: studentId,
        instructional_hours: Number(hours),
        classroom_topics: classroomTopics,
        hands_on_activities: handsOnActivities,
        competencies_covered: competencies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        attendance_status: attendanceStatus,
        progress_status: readyForTesting ? 'completed' : progressStatus,
        ready_for_testing: readyForTesting,
        instructor_notes: notes,
        input_method: voiceUsed ? 'mixed' : 'manual',
      }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error || 'The progress form could not be saved.');
      return;
    }
    setMessage(
      readyForTesting
        ? 'Progress saved. Elevate was notified that the student is ready for testing.'
        : 'Progress saved to the student record.',
    );
    setHours('');
    setClassroomTopics('');
    setHandsOnActivities('');
    setCompetencies('');
    setNotes('');
    setReadyForTesting(false);
    setVoiceUsed(false);
  }

  if (!students.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 font-semibold text-amber-950">
        No students are assigned to this instructor account yet.
      </div>
    );
  }

  const textarea =
    'mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="block text-sm font-black text-slate-800">
          Student
          <select
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            {students.map((student) => (
              <option key={student.enrollmentId} value={student.enrollmentId}>
                {student.name} — {student.programName} ({student.enrollmentStatus})
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Student</p>
              <p className="font-bold text-slate-950">{selected.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Program</p>
              <p className="font-bold text-slate-950">{selected.programName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Hours documented</p>
              <p className="font-bold text-slate-950">{selected.reportedHours.toFixed(1)} of 48</p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <label className="text-sm font-black text-slate-800">
          Hours covered in this report
          <input
            required
            type="number"
            min="0.25"
            max="48"
            step="0.25"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          />
        </label>
        <label className="text-sm font-black text-slate-800">
          Attendance
          <select
            value={attendanceStatus}
            onChange={(event) => setAttendanceStatus(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            <option value="present">Present</option>
            <option value="partial">Partial day</option>
            <option value="excused_absence">Excused absence</option>
            <option value="unexcused_absence">Unexcused absence</option>
          </select>
        </label>
      </section>

      <ProgressTextArea
        label="What the student learned"
        value={classroomTopics}
        onChange={setClassroomTopics}
        field="classroom_topics"
        listening={listening}
        onVoice={toggleVoice}
        className={textarea}
        required
      />
      <ProgressTextArea
        label="What the student completed hands-on"
        value={handsOnActivities}
        onChange={setHandsOnActivities}
        field="hands_on_activities"
        listening={listening}
        onVoice={toggleVoice}
        className={textarea}
        required
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="block text-sm font-black text-slate-800">
          Skills or competencies checked off{' '}
          <span className="font-medium text-slate-500">(separate with commas)</span>
          <input
            value={competencies}
            onChange={(event) => setCompetencies(event.target.value)}
            placeholder="Example: safety, tool identification, system diagnosis"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          />
        </label>
        <label className="mt-5 block text-sm font-black text-slate-800">
          Current progress
          <select
            value={progressStatus}
            onChange={(event) => setProgressStatus(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            <option value="on_track">On track</option>
            <option value="needs_support">Needs support</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </section>

      <ProgressTextArea
        label="Instructor notes (optional)"
        value={notes}
        onChange={setNotes}
        field="instructor_notes"
        listening={listening}
        onVoice={toggleVoice}
        className={textarea}
      />

      <label className="flex items-start gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
        <input
          type="checkbox"
          checked={readyForTesting}
          onChange={(event) => setReadyForTesting(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span>
          <span className="block font-black">
            Student completed training and is ready for testing
          </span>
          <span className="mt-1 block text-sm font-medium">
            Checking this sends Elevate a testing-readiness notice after the progress form saves.
          </span>
        </span>
      </label>
      <button
        disabled={saving}
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Saving…' : 'Save progress form'}
      </button>
      {message && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl p-4 text-sm font-bold ${message.startsWith('Progress saved') ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
    </form>
  );
}

function ProgressTextArea({
  label,
  value,
  onChange,
  field,
  listening,
  onVoice,
  className,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  field: VoiceField;
  listening: VoiceField | null;
  onVoice: (field: VoiceField) => void;
  className: string;
  required?: boolean;
}) {
  const active = listening === field;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={field} className="text-sm font-black text-slate-800">
          {label}
        </label>
        <button
          type="button"
          onClick={() => onVoice(field)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black ${active ? 'border-red-600 bg-red-600 text-white' : 'border-blue-300 bg-blue-50 text-blue-900'}`}
        >
          {active ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {active ? 'Stop listening' : 'Speak this part'}
        </button>
      </div>
      <textarea
        id={field}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={className}
        placeholder={active ? 'Listening…' : 'Type here or tap “Speak this part”'}
      />
    </section>
  );
}
