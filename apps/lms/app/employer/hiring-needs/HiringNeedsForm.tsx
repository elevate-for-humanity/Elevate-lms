'use client';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveHiringNeeds } from './actions';

export type HiringNeedsFields = {
  roles: string;
  locations: string;
  timeline: string;
  additionalInfo: string;
};

const fields: { name: keyof HiringNeedsFields; label: string; required: boolean }[] = [
  { name: 'roles', label: 'Positions or staff training needed', required: true },
  { name: 'locations', label: 'Worksite locations', required: true },
  { name: 'timeline', label: 'Hiring or training timeline', required: false },
  { name: 'additionalInfo', label: 'Additional information', required: false },
];

/** Controlled inputs preserve an employer's edits through client hydration
 * and mobile rerenders. The existing server action remains the only writer:
 * it enforces employer identity and validates persisted values. */
export function HiringNeedsForm({ initial, saved = false }: { initial: HiringNeedsFields; saved?: boolean }) {
  const [values, setValues] = useState(initial);
  const dirty = fields.some(({ name }) => values[name] !== initial[name]);
  return (
    <form action={saveHiringNeeds} className="space-y-5 rounded-xl border bg-white p-5">
      {fields.map(({ name, label, required }) => (
        <label key={name} className="block font-semibold">
          {label}
          <textarea
            name={name}
            required={required}
            maxLength={4000}
            value={values[name]}
            onChange={event => setValues(previous => ({
              ...previous,
              [name]: event.target.value,
            }))}
            rows={3}
            className="mt-2 block w-full rounded-lg border p-3 font-normal"
          />
        </label>
      ))}
      <SaveStatus saved={saved && !dirty} />
    </form>
  );
}

function SaveStatus({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      {saved && !pending && (
        <p role="status" className="rounded-lg bg-green-50 p-4">
          Your hiring and training needs are saved.
        </p>
      )}
      <button type="submit" disabled={pending} aria-busy={pending}
        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60">
        {pending ? 'Saving hiring and training needs…' : 'Save hiring and training needs'}
      </button>
    </>
  );
}
