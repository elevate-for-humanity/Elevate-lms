'use client';

import { useActionState } from 'react';
import { acknowledgeLearnerOrientation } from '@/apps/lms/app/lms/(app)/orientation/actions';

export default function OrientationAcknowledgement() {
  const [state, action, pending] = useActionState(acknowledgeLearnerOrientation, { error: '' });
  return (
    <form action={action} className="rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-bold text-slate-950">Orientation acknowledgement</h2>
      <label className="mt-3 flex items-start gap-3 text-sm text-slate-800">
        <input type="checkbox" name="reviewed" value="yes" required className="mt-1 h-4 w-4" />
        <span>I reviewed the orientation, understand how to use my dashboard and contact my program staff, and know where to request help.</span>
      </label>
      {state.error ? <p role="alert" className="mt-3 font-semibold text-red-800">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="mt-4 min-h-11 rounded-lg bg-blue-800 px-5 py-3 font-bold text-white disabled:opacity-60">
        {pending ? 'Saving orientation…' : 'Save my orientation acknowledgement'}
      </button>
      <p className="mt-3 text-xs text-slate-600">This records orientation only. Required documents, staff reviews, and course work remain separate.</p>
    </form>
  );
}
