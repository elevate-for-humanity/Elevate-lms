'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

type Student = {
  placementId: string;
  studentId: string;
  name: string;
  email?: string | null;
  programSlug?: string | null;
};

type AttendanceRow = Student & {
  status: AttendanceStatus;
  notes: string;
};

export default function AttendanceRecordForm({ students }: { students: Student[] }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AttendanceRow[]>(
    students.map((student) => ({ ...student, status: 'present', notes: '' })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  function updateRow(index: number, patch: Partial<AttendanceRow>) {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSavedCount(null);

    try {
      const response = await fetch('/api/host-shop/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceDate: date,
          records: rows.map((row) => ({
            placementId: row.placementId,
            studentId: row.studentId,
            status: row.status,
            notes: row.notes,
          })),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Attendance could not be saved.');
      }

      setSavedCount(Number(body.saved ?? rows.length));
      router.refresh();
      window.setTimeout(() => router.push('/host-shop/dashboard/attendance'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attendance could not be saved.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="max-w-xs">
        <label htmlFor="attendance-date" className="mb-2 block text-sm font-black text-slate-900">
          Attendance date
        </label>
        <input
          id="attendance-date"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950"
        />
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <fieldset key={row.placementId} className="rounded-2xl border border-slate-200 p-5">
            <legend className="absolute left-0 top-0 h-8 w-8 opacity-0">Attendance for {row.name}</legend>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="font-black text-slate-950">{row.name}</p>
                {row.email ? <p className="truncate text-sm text-slate-500">{row.email}</p> : null}
                {row.programSlug ? (
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {row.programSlug.replace(/[-_]/g, ' ')}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                {(['present', 'absent', 'excused', 'late'] as AttendanceStatus[]).map((status) => (
                  <label
                    key={status}
                    className={`relative cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-bold capitalize ${
                      row.status === status
                        ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`status-${row.placementId}`}
                      value={status}
                      checked={row.status === status}
                      onChange={() => updateRow(index, { status })}
                      className="sr-only"
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes (optional)</span>
              <textarea
                value={row.notes}
                maxLength={2000}
                onChange={(event) => updateRow(index, { notes: event.target.value })}
                rows={2}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
                placeholder="Add an attendance note if needed"
              />
            </label>
          </fieldset>
        ))}
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {savedCount !== null ? (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{savedCount} attendance record{savedCount === 1 ? '' : 's'} saved.</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || savedCount !== null}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 font-black text-white hover:bg-brand-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <Save className="h-5 w-5" />
        {submitting ? 'Saving attendance…' : 'Save attendance'}
      </button>
    </form>
  );
}
