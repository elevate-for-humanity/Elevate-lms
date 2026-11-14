'use client';

import Link from 'next/link';
import { ChevronLeft, FileText, Loader2 } from 'lucide-react';
import { ADMIN_WIOA_COMPLIANCE, WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';
import { useWioaEtplProgramForm } from './useWioaEtplProgramForm';

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'completed'
      ? 'bg-brand-green-50 text-brand-green-800'
      : status === 'draft'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-slate-100 text-slate-600';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

export function WioaEtplProgramHubClient({ programId }: { programId: string }) {
  const { loading, program, ieapStatus, section188Status, error } = useWioaEtplProgramForm(programId);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!program) {
    return <p className="text-red-700 px-4 py-8">Program not found.</p>;
  }

  const needsIeap = program.etpl_requires_initial_eligibility;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={ADMIN_WIOA_COMPLIANCE.hub}
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-blue-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> All programs
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">{program.title}</h1>
      <p className="text-slate-600 mb-8">WIOA / INTraining ETPL compliance — separate form for each requirement.</p>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <div className="space-y-4">
        {needsIeap && (
          <Link
            href={ADMIN_WIOA_COMPLIANCE.programIeap(programId)}
            className="flex items-start gap-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-brand-blue-300 hover:shadow-sm transition"
          >
            <FileText className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">
                  {FORM_LABELS.initial_eligibility_aggregate_performance}
                </span>
                <StatusPill status={ieapStatus} />
              </div>
              <p className="text-sm text-slate-500 mt-1">New programs only — initial ETPL listing</p>
            </div>
          </Link>
        )}

        <Link
          href={ADMIN_WIOA_COMPLIANCE.programSection188(programId)}
          className="flex items-start gap-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-brand-blue-300 hover:shadow-sm transition"
        >
          <FileText className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">{FORM_LABELS.section_188_checklist}</span>
              <StatusPill status={section188Status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">Required for every program</p>
          </div>
        </Link>
      </div>

      <p className="text-sm text-slate-500 mt-8">
        Public reference pages (crawlable):{' '}
        <Link href={WIOA_COMPLIANCE.programHub(program.slug)} className="text-brand-blue-600 hover:underline">
          {WIOA_COMPLIANCE.programHub(program.slug)}
        </Link>
      </p>
    </div>
  );
}
