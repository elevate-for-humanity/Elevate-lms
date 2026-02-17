"use client";

import React from 'react';
/**
 * Transfer Hours Approval Component
 *
 * Displays transfer hours records and allows admin to approve/reject
 */

import { useState } from 'react';
import { approveTransferHours, rejectTransferHours } from '@/lib/actions/enrollments';
import { useRouter } from 'next/navigation';

interface TransferHour {
  id: string;
  source_school_name: string;
  source_state: string;
  license_type?: string;
  hours_theory_submitted: number;
  hours_practical_submitted: number;
  hours_other_submitted: number;
  hours_theory_accepted: number;
  hours_practical_accepted: number;
  hours_other_accepted: number;
  status: 'pending' | 'approved' | 'rejected';
  proof_doc_path?: string;
  notes?: string;
  effective_date?: string;
  created_at: string;
}

interface TransferHoursApprovalProps {
  transferHours: TransferHour[];
  enrollmentId: string;
}

export default function TransferHoursApproval({
  transferHours,
  enrollmentId
}: TransferHoursApprovalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  async function handleApprove(transferHour: TransferHour) {
    const theoryAccepted = prompt(
      `Theory hours to accept (max ${transferHour.hours_theory_submitted}):`,
      transferHour.hours_theory_submitted.toString()
    );

    if (theoryAccepted === null) return;

    const practicalAccepted = prompt(
      `Practical hours to accept (max ${transferHour.hours_practical_submitted}):`,
      transferHour.hours_practical_submitted.toString()
    );

    if (practicalAccepted === null) return;

    const notes = prompt('Approval notes (optional):');

    setProcessing(transferHour.id);

    const result = await approveTransferHours({
      transfer_hours_id: transferHour.id,
      hours_theory_accepted: parseFloat(theoryAccepted),
      hours_practical_accepted: parseFloat(practicalAccepted),
      hours_other_accepted: transferHour.hours_other_submitted,
      effective_date: new Date().toISOString().split('T')[0],
      notes: notes || undefined
    });

    setProcessing(null);

    if (result.success) {
      alert(result.message);
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  async function handleReject(transferHourId: string) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setProcessing(transferHourId);

    const result = await rejectTransferHours(transferHourId, reason);

    setProcessing(null);

    if (result.success) {
      alert(result.message);
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  if (transferHours.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No transfer hours submitted</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transferHours.map((th) => (
        <div
          key={th.id}
          className={`border rounded-lg overflow-hidden transition-all ${
            th.status === 'approved' ? 'border-brand-green-500/30 bg-brand-green-500/5' :
            th.status === 'rejected' ? 'border-brand-red-500/30 bg-brand-orange-500/5' :
            'border-slate-600 bg-slate-800/30'
          }`}
        >
          {/* Header */}
          <div
            className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
            onClick={() => setExpandedId(expandedId === th.id ? null : th.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-white font-semibold">
                    {th.source_school_name}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {th.source_state}
                  </span>
                  {th.license_type && (
                    <span className="text-xs px-2 py-2 bg-slate-700 rounded text-slate-300">
                      {th.license_type}
                    </span>
                  )}
                </div>

                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-slate-400">Theory:</span>
                    <span className="text-white ml-2 font-medium">
                      {th.status === 'approved'
                        ? `${th.hours_theory_accepted} / ${th.hours_theory_submitted}`
                        : th.hours_theory_submitted
                      } hrs
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Practical:</span>
                    <span className="text-white ml-2 font-medium">
                      {th.status === 'approved'
                        ? `${th.hours_practical_accepted} / ${th.hours_practical_submitted}`
                        : th.hours_practical_submitted
                      } hrs
                    </span>
                  </div>
                  {th.hours_other_submitted > 0 && (
                    <div>
                      <span className="text-slate-400">Other:</span>
                      <span className="text-white ml-2 font-medium">
                        {th.hours_other_submitted} hrs
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`badge ${
                  th.status === 'approved' ? 'badge-success' :
                  th.status === 'rejected' ? 'badge-warning' :
                  'badge-primary'
                }`}>
                  {th.status}
                </span>
                <span className="text-slate-400">
                  {expandedId === th.id ? '▼' : '▶'}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === th.id && (
            <div className="border-t border-slate-600 p-4 space-y-4">

              {/* Documentation */}
              {th.proof_doc_path && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Documentation</div>
                  <a
                    href={th.proof_doc_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue-400 hover:text-brand-blue-300 text-sm underline"
                  >
                    View Document →
                  </a>
                </div>
              )}

              {/* Notes */}
              {th.notes && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Notes</div>
                  <p className="text-sm text-slate-300">{th.notes}</p>
                </div>
              )}

              {/* Dates */}
              <div className="flex gap-6 text-xs">
                <div>
                  <span className="text-slate-400">Submitted:</span>
                  <span className="text-slate-300 ml-2">
                    {new Date(th.created_at).toLocaleDateString()}
                  </span>
                </div>
                {th.effective_date && (
                  <div>
                    <span className="text-slate-400">Effective:</span>
                    <span className="text-slate-300 ml-2">
                      {new Date(th.effective_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {th.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-600">
                  <button
                    onClick={() => handleApprove(th)}
                    disabled={processing === th.id}
                    className="glow-btn flex-1"
                  >
                    {processing === th.id ? 'Processing...' : 'Approve Hours'}
                  </button>
                  <button
                    onClick={() => handleReject(th.id)}
                    disabled={processing === th.id}
                    className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}

              {th.status === 'approved' && (
                <div className="bg-brand-green-500/10 border border-brand-green-500/30 rounded-lg p-3">
                  <div className="text-sm text-brand-green-400 font-medium mb-2">
                    ✓ Approved Hours Applied
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Theory: {th.hours_theory_accepted} hrs accepted</div>
                    <div>Practical: {th.hours_practical_accepted} hrs accepted</div>
                    {th.hours_other_accepted > 0 && (
                      <div>Other: {th.hours_other_accepted} hrs accepted</div>
                    )}
                  </div>
                </div>
              )}

              {th.status === 'rejected' && (
                <div className="bg-brand-orange-500/10 border border-brand-red-500/30 rounded-lg p-3">
                  <div className="text-sm text-brand-red-400 font-medium">
                    ✗ Transfer Hours Rejected
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      ))}
    </div>
  );
}
