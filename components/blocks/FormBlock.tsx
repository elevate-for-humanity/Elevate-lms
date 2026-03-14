'use client';

import { useState } from 'react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface FormBlockProps {
  formId: string;
  fields: FormField[];
  heading?: string;
  submit_label?: string;
  success_message?: string;
}

export default function FormBlock({
  formId,
  fields = [],
  heading,
  submit_label = 'Submit',
  success_message = 'Thank you — your response has been received.',
}: FormBlockProps) {
  const [data, setData] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function update(name: string, value: string | boolean) {
    setData((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, payload: data }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg text-slate-700">{success_message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-xl mx-auto">
        {heading && <h2 className="text-2xl font-bold text-slate-800 mb-6">{heading}</h2>}
        <form onSubmit={submit} className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  required={field.required}
                  rows={4}
                  onChange={(e) => update(field.name, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 resize-y"
                />
              ) : field.type === 'select' ? (
                <select
                  name={field.name}
                  required={field.required}
                  onChange={(e) => update(field.name, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                >
                  <option value="">Select…</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  name={field.name}
                  required={field.required}
                  onChange={(e) => update(field.name, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-400"
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  required={field.required}
                  onChange={(e) => update(field.name, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting…' : submit_label}
          </button>
        </form>
      </div>
    </section>
  );
}
