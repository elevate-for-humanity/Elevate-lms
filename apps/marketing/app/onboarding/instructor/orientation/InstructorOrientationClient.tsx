'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

type Props = {
  userId: string;
  alreadyDone: boolean;
  completedAt: string | null;
};

export default function InstructorOrientationClient({ userId, alreadyDone, completedAt }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (alreadyDone) {
    return (
      <div className="border-t border-slate-200 bg-emerald-50 px-8 py-6 text-emerald-900">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Orientation complete</p>
            <p className="mt-1 text-sm">{completedAt ? `Completed ${new Date(completedAt).toLocaleString()}` : 'Completion is recorded.'}</p>
          </div>
        </div>
      </div>
    );
  }

  async function complete() {
    setSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) throw new Error('Authentication could not be verified.');

      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from('orientation_completions').insert({
        user_id: user.id,
        name: 'Instructor Orientation',
        description: 'Instructor onboarding orientation completed',
        status: 'completed',
        completed_at: now,
      });
      if (insertError) throw insertError;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record orientation completion.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-8 py-6">
      <p className="text-sm leading-6 text-slate-700">By continuing, you confirm that you reviewed the instructor orientation above and understand the recordkeeping, privacy, communication, and escalation expectations.</p>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      <button type="button" onClick={complete} disabled={saving} className="mt-5 rounded-lg bg-brand-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-60">
        {saving ? 'Recording…' : 'Mark Orientation Complete'}
      </button>
    </div>
  );
}
