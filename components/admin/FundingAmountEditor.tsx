"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
/**
 * Funding Amount Editor Component
 *
 * Allows admin to set/update wage, stipend, and tuition amounts
 */

import { useState } from 'react';
import { updateFundingAmounts } from '@/lib/actions/enrollments';
import { useRouter } from 'next/navigation';

interface FundingAmountEditorProps {
  enrollmentId: string;
  currentValues?: {
    wage_rate_hour?: number;
    stipend_total_amount?: number;
    tuition_covered_amount?: number;
    external_case_id?: string;
  };
}

export default function FundingAmountEditor({
  enrollmentId,
  currentValues
}: FundingAmountEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Log funding amount changes for audit
  const logFundingChange = async (oldValues: any, newValues: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('funding_change_audit')
      .insert({
        admin_id: user?.id,
        enrollment_id: enrollmentId,
        old_values: oldValues,
        new_values: newValues,
        changed_at: new Date().toISOString()
      });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const wageRate = formData.get('wage_rate_hour') as string;
    const stipend = formData.get('stipend_total_amount') as string;
    const tuition = formData.get('tuition_covered_amount') as string;
    const caseId = formData.get('external_case_id') as string;

    const result = await updateFundingAmounts({
      enrollment_id: enrollmentId,
      wage_rate_hour: wageRate ? parseFloat(wageRate) : undefined,
      stipend_total_amount: stipend ? parseFloat(stipend) : undefined,
      tuition_covered_amount: tuition ? parseFloat(tuition) : undefined,
      external_case_id: caseId || undefined
    });

    setSaving(false);

    if (result.success) {
      alert(result.message);
      setIsEditing(false);
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="glow-btn-secondary w-full"
      >
        Edit Funding Amounts
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-slate-700">

      <div className="text-sm text-slate-300 mb-4">
        💡 Leave fields blank if amounts are not yet determined
      </div>

      {/* Hourly Wage */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Hourly Wage Rate
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            $
          </span>
          <input
            type="number"
            name="wage_rate_hour"
            step="0.01"
            min="0"
            max="100"
            defaultValue={currentValues?.wage_rate_hour}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-blue-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            /hour
          </span>
        </div>
      </div>

      {/* Stipend Amount */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Total Stipend Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            $
          </span>
          <input
            type="number"
            name="stipend_total_amount"
            step="0.01"
            min="0"
            defaultValue={currentValues?.stipend_total_amount}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-blue-500"
          />
        </div>
      </div>

      {/* Tuition Coverage */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Tuition Coverage Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            $
          </span>
          <input
            type="number"
            name="tuition_covered_amount"
            step="0.01"
            min="0"
            defaultValue={currentValues?.tuition_covered_amount}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-blue-500"
          />
        </div>
      </div>

      {/* External Case ID */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          External Case ID (WorkOne, etc.)
        </label>
        <input
          type="text"
          name="external_case_id"
          defaultValue={currentValues?.external_case_id}
          placeholder="e.g., WO-2024-12345"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="glow-btn flex-1"
        >
          {saving ? 'Saving...' : 'Save Amounts'}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={saving}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
