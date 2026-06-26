'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  opportunities: { id: string; title: string; agency_name: string | null }[];
}

export default function GrantIntakeClient({ opportunities }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, asDraft: boolean) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      opportunity_title: fd.get('opportunity_title') as string,
      agency_name: fd.get('agency_name') as string,
      award_ceiling: fd.get('award_ceiling') ? Number(fd.get('award_ceiling')) : undefined,
      deadline: fd.get('deadline') as string || undefined,
      project_title: fd.get('project_title') as string || undefined,
      target_population: fd.get('target_population') as string || undefined,
      executive_summary: fd.get('executive_summary') as string || undefined,
      notes: fd.get('notes') as string || undefined,
      status: asDraft ? 'draft' : 'in_progress',
    };

    // Link to existing opportunity if selected
    const oppId = fd.get('opportunity_id') as string;
    if (oppId) body.opportunity_id = oppId;

    try {
      const res = await fetch('/api/admin/grants/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      router.push('/admin/grants');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="bg-white rounded-lg shadow divide-y divide-slate-200"
    >
      {/* Grant Information */}
      <div className="px-6 py-5 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">Grant Information</h2>

        {opportunities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link to Existing Opportunity <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              name="opportunity_id"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
            >
              <option value="">— None —</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}{o.agency_name ? ` — ${o.agency_name}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Grant / Opportunity Title <span className="text-brand-red-500">*</span>
          </label>
          <input
            required
            name="opportunity_title"
            type="text"
            placeholder="e.g., WIOA Youth Program Grant 2025"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Funding Agency</label>
            <input
              name="agency_name"
              type="text"
              placeholder="e.g., Indiana DWD"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Award Ceiling ($)</label>
            <input
              name="award_ceiling"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
            <input
              name="deadline"
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
            <input
              name="project_title"
              type="text"
              placeholder="Internal project name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div className="px-6 py-5 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">Narrative</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Population</label>
          <textarea
            name="target_population"
            rows={2}
            placeholder="Who will this grant serve? (e.g., Youth ages 16–24, justice-involved individuals)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Executive Summary</label>
          <textarea
            name="executive_summary"
            rows={4}
            placeholder="Brief overview of the project, goals, and expected outcomes..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Staff notes, action items, contacts..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex items-center justify-between gap-3">
        {error && (
          <p className="text-sm text-brand-red-600">{error}</p>
        )}
        <div className="flex gap-3 ml-auto">
          <Link
            href="/admin/grants"
            className="px-4 py-2 text-sm border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => {
              const form = (e.currentTarget as HTMLButtonElement).closest('form') as HTMLFormElement;
              handleSubmit({ preventDefault: () => {}, currentTarget: form } as React.FormEvent<HTMLFormElement>, true);
            }}
            className="px-4 py-2 text-sm border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </form>
  );
}
