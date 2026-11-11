'use client';
import { useState } from 'react';
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
export function HiringNeedsForm({ initial }: { initial: HiringNeedsFields }) {
  const [values, setValues] = useState(initial);
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
      <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
        Save hiring and training needs
      </button>
    </form>
  );
}
