'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EnrollCourseClient({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/enrollments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, idempotencyKey: `course:${courseId}` }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enrollment failed');
      router.push(`/lms/courses/${courseId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Enroll in {courseTitle}</h1>
      <p className="mt-2 text-slate-600">Confirm enrollment to add this course to your learning dashboard.</p>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={enroll}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Enrolling…' : 'Confirm Enrollment'}
      </button>
    </div>
  );
}
