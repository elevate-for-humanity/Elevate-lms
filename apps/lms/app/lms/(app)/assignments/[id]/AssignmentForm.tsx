'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function AssignmentForm({
  id,
  initialText,
  initialUrl,
  graded,
  closed,
}: {
  id: string;
  initialText: string;
  initialUrl: string;
  graded: boolean;
  closed?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  if (closed)
    return (
      <p className="rounded-xl border p-4">
        This enrollment is complete. Your submitted work remains available for review.
      </p>
    );
  if (graded)
    return (
      <p className="rounded-xl border p-4">
        This submission has been graded. Contact your instructor before resubmitting.
      </p>
    );
  return (
    <form
      className="space-y-4 rounded-xl border p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        setSaved(false);
        setBusy(true);
        const form = new FormData(event.currentTarget);
        try {
          const response = await fetch(`/api/assignments/${id}/submit`, {
            method: 'POST',
            body: form,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Submission could not be saved.');
          setSaved(true);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Submission could not be saved.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block font-bold">
        Your response
        <textarea
          name="submissionText"
          defaultValue={initialText}
          rows={7}
          maxLength={20000}
          className="mt-2 w-full rounded-lg border p-3 font-normal"
        />
      </label>
      <label className="block font-bold">
        Evidence link (optional)
        <input
          name="submissionUrl"
          type="url"
          defaultValue={initialUrl}
          className="mt-2 w-full rounded-lg border p-3 font-normal"
        />
      </label>
      <label className="block font-bold">
        Evidence file (optional)
        <input
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          className="mt-2 block w-full font-normal"
        />
      </label>
      <p className="text-sm text-slate-600">
        Use PDF, Word, or image evidence up to 10 MB. For video evidence, provide a secure link your
        instructor can access.
      </p>
      {error && (
        <p role="alert" className="text-red-800">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="font-bold text-emerald-800">
          Submitted to your instructor.
        </p>
      )}
      <button
        disabled={busy}
        className="min-h-12 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit assignment'}
      </button>
    </form>
  );
}
