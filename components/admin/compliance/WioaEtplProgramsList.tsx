'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ADMIN_WIOA_COMPLIANCE, WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';

type ProgramRow = {
  id: string;
  title: string;
  slug: string;
  etpl_listed: boolean;
  needs_ieap: boolean;
  ieap_status: string;
  section_188_status: string;
  ready_for_etpl: boolean;
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-700 bg-brand-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Complete
      </span>
    );
  }
  if (status === 'not_required') {
    return (
      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">N/A</span>
    );
  }
  if (status === 'draft') {
    return (
      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
        Draft
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      Missing
    </span>
  );
}

export function WioaEtplProgramsList() {
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/compliance/wioa-etpl');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load');
        setRows(json.programs ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error}
        <p className="text-xs mt-2 w-full">
          If tables are missing, apply migration{' '}
          <code className="bg-red-100 px-1 rounded">20260708000001_program_wioa_etpl_compliance_forms.sql</code>{' '}
          in Supabase SQL Editor.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Program</th>
            <th className="px-4 py-3 font-semibold">IEAP (new)</th>
            <th className="px-4 py-3 font-semibold">Section 188</th>
            <th className="px-4 py-3 font-semibold">ETPL ready</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 align-top">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{p.title}</div>
                <div className="text-xs text-slate-500">{p.slug}</div>
                <Link
                  href={WIOA_COMPLIANCE.programHub(p.slug)}
                  className="text-xs text-brand-blue-600 hover:underline mt-1 inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Public page
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.ieap_status} />
                {p.needs_ieap && (
                  <div className="mt-2 flex flex-col gap-1">
                    <Link
                      href={ADMIN_WIOA_COMPLIANCE.programIeap(p.id)}
                      className="text-xs font-semibold text-brand-blue-600 hover:underline"
                    >
                      Complete IEAP
                    </Link>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.section_188_status} />
                <div className="mt-2">
                  <Link
                    href={ADMIN_WIOA_COMPLIANCE.programSection188(p.id)}
                    className="text-xs font-semibold text-brand-blue-600 hover:underline"
                  >
                    Complete Section 188
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3">
                {p.ready_for_etpl ? (
                  <span className="text-xs font-semibold text-brand-green-700">Yes</span>
                ) : (
                  <span className="text-xs text-slate-500">No</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={ADMIN_WIOA_COMPLIANCE.programHub(p.id)}
                  className="text-brand-blue-600 font-semibold hover:underline block"
                >
                  Hub
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-center text-slate-500 py-12">No programs found.</p>
      )}
    </div>
  );
}
