'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  alreadyDone: boolean;
  completedAt: string | null;
}

export default function InstructorOrientationClient({ userId, alreadyDone, completedAt }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (alreadyDone) {
    return (
      <div className="px-8 py-6 border-t border-slate-100 bg-brand-green-50">
        <div className="flex items-center gap-3 text-brand-green-700">
          <span className="w-5 h-5 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Orientation complete</p>
            {completedAt && (
              <p className="text-sm text-brand-green-600">
                Completed{' '}
                {new Date(completedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push('/onboarding/instructor')}
          className="mt-4 px-5 py-2 bg-brand-blue-700 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-800 transition-colors"
        >
          Back to Onboarding
        </button>
      </div>
    );
  }

  async function handleComplete() {
    if (!checked) {
      setError('Please confirm you have read all sections before completing orientation.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/instructor/complete-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record completion');
      }
      router.push('/onboarding/instructor?step=orientation&done=1');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-6 border-t border-slate-100">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-blue-700 focus:ring-brand-blue-500"
        />
        <span className="text-sm text-slate-700">
          I have read all sections of this orientation and understand my responsibilities as an
          Elevate instructor.
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-800 disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving…' : 'Complete Orientation'}
        </button>
        <button
          onClick={() => router.push('/onboarding/instructor')}
          className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
