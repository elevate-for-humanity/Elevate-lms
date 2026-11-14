'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type IeapFormData,
  type Section188ChecklistData,
  IEAP_INITIAL,
  SECTION_188_INITIAL,
  mergeIeapFromProgram,
} from '@/lib/compliance/wioa-etpl-forms';

export type ProgramMeta = {
  id: string;
  title: string;
  slug: string;
  etpl_requires_initial_eligibility: boolean;
  etpl_listed: boolean;
  intraining_program_id: string | null;
  description?: string | null;
  cip_code?: string | null;
  soc_code?: string | null;
  estimated_hours?: number | null;
  estimated_weeks?: number | null;
  credential_name?: string | null;
};

type FormRow = {
  form_type: string;
  status: string;
  responses: IeapFormData | Section188ChecklistData;
};

export function useWioaEtplProgramForm(programId: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [program, setProgram] = useState<ProgramMeta | null>(null);
  const [ieap, setIeap] = useState<IeapFormData>(IEAP_INITIAL);
  const [section188, setSection188] = useState<Section188ChecklistData>(SECTION_188_INITIAL);
  const [ieapStatus, setIeapStatus] = useState('draft');
  const [section188Status, setSection188Status] = useState('draft');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/compliance/wioa-etpl/${programId}`);
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setProgram(null);
        }
        throw new Error(json.error ?? 'Failed to load forms');
      }

      const p = json.program as ProgramMeta;
      setProgram(p);

      const ieapRow = json.forms?.initial_eligibility_aggregate_performance as FormRow | null;
      const s188Row = json.forms?.section_188_checklist as FormRow | null;

      if (ieapRow?.responses) {
        setIeap({ ...IEAP_INITIAL, ...(ieapRow.responses as IeapFormData) });
        setIeapStatus(ieapRow.status);
      } else {
        setIeap(mergeIeapFromProgram(p));
        setIeapStatus('draft');
      }

      if (s188Row?.responses) {
        setSection188({ ...SECTION_188_INITIAL, ...(s188Row.responses as Section188ChecklistData) });
        setSection188Status(s188Row.status);
      } else {
        setSection188(SECTION_188_INITIAL);
        setSection188Status('draft');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(
    formType: 'initial_eligibility_aggregate_performance' | 'section_188_checklist',
    markComplete: boolean,
  ) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const responses =
        formType === 'initial_eligibility_aggregate_performance' ? ieap : section188;
      const res = await fetch(`/api/admin/compliance/wioa-etpl/${programId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_type: formType, responses, mark_complete: markComplete }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      if (formType === 'initial_eligibility_aggregate_performance') {
        setIeapStatus(json.form.status);
        if (markComplete) {
          setProgram((prev) =>
            prev ? { ...prev, etpl_requires_initial_eligibility: false } : prev,
          );
        }
      } else {
        setSection188Status(json.form.status);
      }
      setSuccess(markComplete ? 'Form marked complete and saved.' : 'Draft saved.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    saving,
    error,
    success,
    program,
    ieap,
    setIeap,
    section188,
    setSection188,
    ieapStatus,
    section188Status,
    save,
    reload: load,
  };
}
