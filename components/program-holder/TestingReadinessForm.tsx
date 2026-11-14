'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TESTING_REPORT_FIELDS, evidenceEnrollment } from '@/lib/program-holder/testing-report';
export function TestingReadinessForm({
  students,
  documents,
}: {
  students: any[];
  documents: any[];
}) {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(form: FormData) {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/program-holder/testing-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          hours: Number(form.get('hours')),
          certified: form.get('certified') === 'true',
          evidenceIds: form.getAll('evidenceIds'),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Report could not be submitted.');
      setMessage(
        result.alreadySubmitted
          ? 'This student already has a testing report awaiting review.'
          : `Exit report saved. ${result.invoiceMessage || 'Second-payment invoice requires review.'} ${result.adminAlertSaved ? 'Admin has been alerted.' : 'Admin alert could not be saved; contact Office Mail with your report reference.'} Report: ${result.reportId}`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      action={submit}
      className="grid gap-4 rounded-2xl border bg-white p-5 sm:p-6 md:grid-cols-2"
    >
      <h2 className="text-xl font-black md:col-span-2">
        Student exit and testing readiness report
      </h2>
      <p className="text-sm text-slate-700 md:col-span-2">
        Submit actual completion evidence. Admin verifies the program requirements before testing
        approval. This report starts the second-payment invoice review using your individual
        agreement.
      </p>
      <label className="text-sm font-bold">
        Student
        <select
          required
          name="enrollmentId"
          value={enrollmentId}
          onChange={(event) => setEnrollmentId(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border p-2"
        >
          <option value="">Select student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name || 'Student'}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Actual completed training hours
        <input
          required
          type="number"
          min="0"
          max="100000"
          step="0.25"
          name="hours"
          className="mt-1 min-h-11 w-full rounded-lg border p-2"
        />
      </label>
      {['start', 'end'].map((key) => (
        <label key={key} className="text-sm font-bold">
          Training {key} date
          <input
            required
            type="date"
            name={key}
            className="mt-1 min-h-11 w-full rounded-lg border p-2"
          />
        </label>
      ))}
      {TESTING_REPORT_FIELDS.map(([key, label]) => (
        <label key={key} className="text-sm font-bold md:col-span-2">
          {label}
          <textarea
            name={key}
            required
            minLength={3}
            maxLength={4000}
            rows={3}
            className="mt-1 w-full rounded-lg border p-3 font-normal"
          />
        </label>
      ))}
      <fieldset className="rounded-xl border p-4 md:col-span-2">
        <legend className="text-sm font-bold">Supporting student evidence</legend>
        <p className="text-sm text-slate-600">
          Upload assessment results, competency records, or a lab tracker in Documents, then select
          the records for this student.
        </p>
        {documents
          .filter(
            (row) =>
              [
                'testing_evidence',
                'lab_tracker',
                'student_completion',
                'assessment_results',
              ].includes(row.document_type) &&
              row.status !== 'rejected' &&
              evidenceEnrollment(row.description) === enrollmentId,
          )
          .map((row) => (
            <label key={row.id} className="flex min-h-11 items-center gap-3 break-all text-sm">
              <input type="checkbox" name="evidenceIds" value={row.id} />
              {row.file_name}
            </label>
          ))}
        <a
          className="inline-flex min-h-11 items-center font-bold text-blue-800 underline"
          href="/program-holder/documents"
        >
          Upload supporting records
        </a>
      </fieldset>
      <label className="flex items-start gap-3 text-sm md:col-span-2">
        <input className="mt-1" type="checkbox" required name="certified" value="true" />I certify
        that this report is accurate and the selected records belong to this student. I recommend
        this student for testing review.
      </label>
      <button
        disabled={saving || !students.length}
        className="min-h-11 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50 md:col-span-2"
      >
        {saving ? 'Submitting…' : 'Submit exit report and start second-payment invoice'}
      </button>
      {message && (
        <p role="status" className="break-words text-sm font-bold md:col-span-2">
          {message}
        </p>
      )}
    </form>
  );
}
