'use client';

import {useCallback, useEffect, useState} from 'react';

type RepairAction = {
  id: string;
  target_service: string;
  status: string;
  approval_status: string;
  error_message?: string | null;
  parameters?: {incident_id?: string};
  incident?: {title: string; description?: string | null; status: string} | null;
  result?: {repairId?: string; status?: string; verified?: boolean} | null;
};

const endpoint = '/api/admin/dev-studio/workflows';

export default function WorkflowRepairReview({embedded = false}: {embedded?: boolean}) {
  const [actions, setActions] = useState<RepairAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}?view=workflow-repairs`, {credentials: 'same-origin', cache: 'no-store'});
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(body.workflowRepairs)) throw new Error('Workflow repair records could not be loaded.');
      setActions(body.workflowRepairs);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Workflow repair records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {void load();}, [load]);

  async function approve(action: RepairAction) {
    setBusyId(action.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'approve-workflow-repair', actionId: action.id}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || typeof body.repairId !== 'string') {
        throw new Error(typeof body.error === 'string' ? body.error : 'The repair could not be queued. Refresh its status before retrying.');
      }
      setNotice(body.verified === true
        ? `Code repair ${body.repairId} is verified. The affected workflow still needs a user retry.`
        : body.status === 'blocked'
          ? `Repair ${body.repairId} is blocked and needs administrator attention.`
          : `Repair ${body.repairId} was accepted. Independent checks and deployment verification are still required.`);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The repair could not be queued.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-label="PARIS workflow repairs" className={`mb-6 rounded-xl border p-4 ${embedded ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">PARIS workflow repairs</h2>
        <button type="button" onClick={() => void load()} disabled={loading || busyId !== null}
          className="rounded-lg border border-slate-400 px-3 py-2 text-sm disabled:opacity-50">
          Refresh repairs
        </button>
      </div>
      <p className="mt-2 text-sm">Review reported problems before approving a code repair. PARIS must validate and verify the repair before it is marked complete.</p>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-400 p-3 text-sm">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg border border-blue-400 p-3 text-sm break-words">{notice}</p>}
      {loading && <p role="status" className="mt-3 text-sm">Loading workflow repairs…</p>}
      {!loading && !error && actions.length === 0 && <p className="mt-3 text-sm">No workflow repairs are awaiting review.</p>}
      <ul className="mt-3 space-y-3">
        {actions.map(action => {
          const pending = action.approval_status === 'pending' && action.status === 'pending';
          const retryQueue = action.approval_status === 'approved' && action.status === 'failed' && !action.result?.repairId;
          return (
            <li key={action.id} className="rounded-lg border border-slate-400 p-3">
              <h3 className="font-medium">{action.incident?.title ?? `Reported ${action.target_service.replaceAll('_', ' ')} problem`}</h3>
              {action.incident?.description && <p className="mt-1 text-sm break-words">{action.incident.description}</p>}
              <p className="mt-2 text-sm">{pending ? 'Awaiting administrator approval' : `Repair status: ${action.result?.status ?? action.status}`}</p>
              {action.parameters?.incident_id && <p className="mt-1 text-xs break-all">Incident: {action.parameters.incident_id}</p>}
              {action.result?.repairId && <p className="mt-1 text-xs break-all">Repair: {action.result.repairId}</p>}
              {action.error_message && <p className="mt-2 text-sm">Administrator attention required: {action.error_message}</p>}
              {action.result?.verified && <p className="mt-2 text-sm">Code verification passed. Confirm the affected workflow by retrying it.</p>}
              {(pending || retryQueue) && (
                <button type="button" onClick={() => void approve(action)} disabled={busyId !== null}
                  className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {busyId === action.id ? 'Saving repair…' : retryQueue ? 'Retry queueing approved repair' : 'Approve code repair'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
