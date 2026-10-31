'use client';
import { useContext, useState, type FormEvent } from 'react';
import { WorkspaceDemoContext } from '@/components/apps/WorkspaceDemoContext';
import { useRouter } from 'next/navigation';

type Row = Record<string, any>;
export async function workspaceRequest(app: 'sam-gov' | 'grants', body: Row | FormData) {
  const response = await fetch(`/api/apps/${app}/workspace`, {
    method: 'POST',
    ...(body instanceof FormData
      ? { body }
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || data.error || 'This action could not be completed.');
  return data;
}
const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950';
const buttonClass = 'rounded-lg bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50';
export function SamWorkspaceActions({
  entities,
  documents,
  alerts,
}: {
  entities: Row[];
  documents: Row[];
  alerts: Row[];
}) {
  const router = useRouter();
  const demo = useContext(WorkspaceDemoContext);
  const send = demo?.request || workspaceRequest;
  const refresh = demo?.refresh || router.refresh;
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const chosen = entities.find((row) => row.id === selected);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setNotice('');
    try {
      await send('sam-gov', { ...values, entity_id: selected || null });
      if (!selected) form.reset();
      setNotice('Entity record saved.');
      refresh();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setNotice('');
    try {
      await send('sam-gov', new FormData(form));
      form.reset();
      setNotice(
        demo ? 'Demo document added to this browser session.' : 'Private document uploaded.',
      );
      refresh();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">Manage registration records</h2>
      <label className="block text-sm font-bold">
        Record
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={inputClass}
        >
          <option value="">Add an entity</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.legal_business_name || 'Entity record'}
            </option>
          ))}
        </select>
      </label>
      <form key={selected} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold sm:col-span-2">
          Legal business name
          <input
            name="legal_business_name"
            required
            minLength={2}
            maxLength={200}
            defaultValue={chosen?.legal_business_name || ''}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-bold">
          UEI (if assigned)
          <input
            name="uei"
            maxLength={12}
            pattern="[A-Z0-9]{12}|"
            defaultValue={chosen?.uei || ''}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-bold">
          CAGE code (if assigned)
          <input
            name="cage_code"
            maxLength={5}
            pattern="[A-Z0-9]{5}|"
            defaultValue={chosen?.cage_code || ''}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-bold">
          Registration status
          <select
            name="registration_status"
            defaultValue={chosen?.registration_status || 'draft'}
            className={inputClass}
          >
            {['draft', 'in_progress', 'submitted', 'active', 'expired'].map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Registration renewal date
          <input
            name="registration_expires_on"
            type="date"
            defaultValue={chosen?.registration_expires_on || ''}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Registration notes
          <textarea
            name="notes"
            maxLength={4000}
            defaultValue={chosen?.notes || ''}
            className={inputClass}
          />
        </label>
        <button disabled={busy} className={buttonClass}>
          Save entity record
        </button>
      </form>
      <details className="border-t pt-4">
        <summary className="cursor-pointer font-bold">Private documents and reminders</summary>
        <form onSubmit={upload} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold">
            Entity
            <select name="entity_id" required className={inputClass}>
              <option value="">Select an entity</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.legal_business_name || 'Entity'}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Document (up to 10 MB)
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className={inputClass}
            />
          </label>
          <button disabled={busy || entities.length === 0} className={buttonClass}>
            Upload document
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              {doc.storage_path ? (
                <a
                  className="font-semibold underline"
                  href={
                    demo
                      ? demo.documentHref(doc.id)
                      : `/api/apps/sam-gov/workspace?document=${encodeURIComponent(doc.id)}`
                  }
                >
                  {doc.file_name}
                </a>
              ) : (
                <span>{doc.file_name || 'Supporting document'}</span>
              )}
            </li>
          ))}
        </ul>
        <ul className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-3"
            >
              <span>
                {alert.title} {alert.due_date ? `· ${alert.due_date}` : ''}
              </span>
              <button
                disabled={busy}
                className="font-bold underline"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await send('sam-gov', { action: 'read-alert', id: alert.id });
                    refresh();
                  } catch (error) {
                    setNotice((error as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Mark reviewed
              </button>
            </li>
          ))}
        </ul>
      </details>
      {notice && (
        <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm">
          {notice}
        </p>
      )}
    </section>
  );
}
export function GrantsSearchActions({ onResults }: { onResults: (rows: Row[]) => void }) {
  const demo = useContext(WorkspaceDemoContext);
  const send = demo?.request || workspaceRequest;
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">
        {demo ? 'Explore the federal opportunity snapshot' : 'Search current federal opportunities'}
      </h2>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const keyword = String(new FormData(event.currentTarget).get('keyword') || '');
          setBusy(true);
          setNotice('');
          try {
            const data = await send('grants', { action: 'search', keyword });
            onResults(data.opportunities);
            setNotice(
              `${data.total} matching opportunities. ${data.remaining} searches remain this month.`,
            );
          } catch (error) {
            setNotice((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="min-w-48 flex-1 text-sm font-bold">
          Funding keywords
          <input
            name="keyword"
            required
            minLength={2}
            maxLength={180}
            placeholder="Search by topic or program"
            className={inputClass}
          />
        </label>
        <button disabled={busy} className={buttonClass}>
          {busy ? 'Searching…' : demo ? 'Search demo snapshot' : 'Search Grants.gov'}
        </button>
      </form>
      {notice && (
        <p role="status" className="mt-3 text-sm">
          {notice}
        </p>
      )}
    </section>
  );
}
export function GrantRecordActions({
  grantId,
  saved = false,
  tracking = false,
}: {
  grantId: string;
  saved?: boolean;
  tracking?: boolean;
}) {
  const router = useRouter();
  const demo = useContext(WorkspaceDemoContext);
  const send = demo?.request || workspaceRequest;
  const refresh = demo?.refresh || router.refresh;
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(action: string) {
    setBusy(true);
    try {
      await send('grants', { action, grant_id: grantId });
      setNotice(
        action === 'draft'
          ? 'Application tracker created.'
          : action === 'save'
            ? 'Grant saved.'
            : 'Grant removed from saved items.',
      );
      refresh();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <button
        disabled={busy}
        onClick={() => act(saved ? 'unsave' : 'save')}
        className="font-bold underline"
      >
        {saved ? 'Remove saved grant' : 'Save grant'}
      </button>
      {tracking && (
        <button disabled={busy} onClick={() => act('draft')} className="font-bold underline">
          Track application
        </button>
      )}
      {notice && <span role="status">{notice}</span>}
    </div>
  );
}
export function GrantApplicationActions({ application }: { application: Row }) {
  const router = useRouter();
  const demo = useContext(WorkspaceDemoContext);
  const send = demo?.request || workspaceRequest;
  const refresh = demo?.refresh || router.refresh;
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-bold">Update tracker</summary>
      <form
        className="mt-3 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          setBusy(true);
          try {
            await send('grants', {
              ...values,
              action: 'application',
              id: application.id,
            });
            setNotice('Tracker saved.');
            refresh();
          } catch (error) {
            setNotice((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm font-bold">
          Application status
          <select name="status" defaultValue={application.status || 'draft'} className={inputClass}>
            {['draft', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold">
          Amount requested
          <input
            name="amount_requested"
            type="number"
            min="0"
            max="1000000000000"
            step="0.01"
            defaultValue={application.amount_requested ?? ''}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-bold">
          Budget narrative
          <textarea
            name="budget_narrative"
            maxLength={10000}
            defaultValue={application.budget_narrative || ''}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-bold">
          Notes
          <textarea
            name="notes"
            maxLength={10000}
            defaultValue={application.notes || ''}
            className={inputClass}
          />
        </label>
        <p className="text-xs text-slate-600">
          This records your progress; it does not submit a federal application.
        </p>
        <button disabled={busy} className={buttonClass}>
          Save tracker
        </button>
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
      </form>
    </details>
  );
}
