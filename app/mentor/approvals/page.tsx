import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Mentor Approvals',
  description: 'Mentor Approvals - Elevate for Humanity workforce training and career development programs in Indianapolis.',
  path: '/mentor/approvals',
});

export const dynamic = 'force-dynamic';



type Profile = { id: string; full_name: string | null };

type Entry = {
  id: string;
  enrollment_id: string;
  log_date: string;
  start_at: string;
  end_at: string;
  minutes: number;
  hour_type: 'RTI' | 'OJT';
  funding_phase: 'PRE_WIOA' | 'WIOA' | 'POST_CERT';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  milady_module_ref?: string | null;
  activity_note?: string | null;
  location_note?: string | null;
  submitted_at?: string | null;
  student_enrollments?: {
    student_id: string;
    program_id: string;
    student_profile?: Profile | null;
  };
  program_holders?: {
    business_name: string;
    mentor_barber_name: string;
  };
};

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function postJSON<T>(url: string, data: any): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function actionServer(
  action: 'APPROVE' | 'REJECT' | 'LOCK',
  entry_id: string
) {
  'use server';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  await postJSON(`${baseUrl}/api/time/approve`, { action, entry_id });
}

function minutesToHrsMin(m: number) {
  const hrs = Math.floor(m / 60);
  const min = m % 60;
  if (hrs <= 0) return `${min}m`;
  if (min === 0) return `${hrs}h`;
  return `${hrs}h ${min}m`;
}

export default async function MentorApprovalsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    funding_phase?: string;
    hour_type?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const status = params?.status ?? 'SUBMITTED';
  const funding_phase = params?.funding_phase ?? '';
  const hour_type = params?.hour_type ?? '';
  const from = params?.from ?? '';
  const to = params?.to ?? '';

  const qs = new URLSearchParams();
  qs.set('status', status);
  if (funding_phase) qs.set('funding_phase', funding_phase);
  if (hour_type) qs.set('hour_type', hour_type);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);

  // Use absolute URL for server-side fetch
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  let entries: Entry[] = [];
  try {
    const result = await fetchJSON<{ entries: Entry[] }>(
      `${baseUrl}/api/time/approve?${qs.toString()}`
    );
    entries = result.entries;
  } catch {
    // API may fail if user is not authenticated or table doesn't exist
    entries = [];
  }

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentor", href: "/mentor" }, { label: "Approvals" }]} />
      </div>
<div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-black">Mentor Approvals</h1>
        <p className="text-sm text-black">
          Review submitted hours, approve/reject, and lock once finalized.
          Locked entries cannot be modified.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-3 items-end bg-slate-50 p-4 rounded-lg"
        action="/mentor/approvals"
        method="get"
      >
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1 text-black">
            Status
          </label>
          <select
            name="status"
            defaultValue={status}
            className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="LOCKED">LOCKED</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1 text-black">
            Funding Phase
          </label>
          <select
            name="funding_phase"
            defaultValue={funding_phase}
            className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="PRE_WIOA">PRE_WIOA</option>
            <option value="WIOA">WIOA</option>
            <option value="POST_CERT">POST_CERT</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1 text-black">
            Hour Type
          </label>
          <select
            name="hour_type"
            defaultValue={hour_type}
            className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="RTI">RTI</option>
            <option value="OJT">OJT</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1 text-black">
            From
          </label>
          <input
            name="from"
            defaultValue={from}
            placeholder="YYYY-MM-DD"
            className="border border-slate-300 rounded px-3 py-2 text-sm bg-white w-40"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1 text-black">
            To
          </label>
          <input
            name="to"
            defaultValue={to}
            placeholder="YYYY-MM-DD"
            className="border border-slate-300 rounded px-3 py-2 text-sm bg-white w-40"
          />
        </div>

        <button
          className="border border-slate-300 rounded px-4 py-2 text-sm font-semibold bg-white hover:bg-slate-50 transition"
          type="submit"
        >
          Filter
        </button>

        <a
          className="border border-slate-300 rounded px-4 py-2 text-sm font-semibold bg-brand-green-600 text-white hover:bg-green-700 transition"
          href={`/api/time/export?${qs.toString()}`}
          title="Download CSV export"
        >
          Export CSV
        </a>
      </form>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-14 gap-2 px-4 py-3 text-xs font-bold bg-slate-100 text-black border-b border-slate-200">
          <div className="col-span-3">Apprentice</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Phase</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Notes</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500 text-center">
            No entries match your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {entries.map((e) => {
              const apprenticeName =
                e.student_enrollments?.student_profile?.full_name?.trim() ||
                `Student ${e.enrollment_id.slice(0, 8)}`;

              return (
                <div
                  key={e.id}
                  className="grid grid-cols-14 gap-2 px-4 py-3 text-sm items-start hover:bg-slate-50 transition"
                >
                  <div className="col-span-3">
                    <div className="font-semibold text-black">
                      {apprenticeName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {e.enrollment_id.slice(0, 8)}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-semibold text-black">
                      {e.log_date}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(e.start_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      →{' '}
                      {new Date(e.end_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-semibold text-black">
                      {e.hour_type}
                    </div>
                    <div
                      className={`text-xs inline-block px-2 py-0.5 rounded ${
                        e.status === 'SUBMITTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : e.status === 'APPROVED'
                            ? 'bg-brand-green-100 text-green-800'
                            : e.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-black'
                      }`}
                    >
                      {e.status}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div
                      className={`font-semibold inline-block px-2 py-0.5 rounded text-xs ${
                        e.funding_phase === 'WIOA'
                          ? 'bg-brand-blue-100 text-brand-blue-800'
                          : e.funding_phase === 'PRE_WIOA'
                            ? 'bg-slate-100 text-black'
                            : 'bg-brand-blue-100 text-brand-blue-800'
                      }`}
                    >
                      {e.funding_phase}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-semibold text-black">
                      {minutesToHrsMin(e.minutes)}
                    </div>
                  </div>

                  <div className="col-span-2">
                    {e.milady_module_ref ? (
                      <div className="text-xs mb-1">
                        <span className="font-semibold text-black">
                          Milady:
                        </span>{' '}
                        {e.milady_module_ref}
                      </div>
                    ) : null}
                    {e.activity_note ? (
                      <div className="text-xs text-black">
                        {e.activity_note}
                      </div>
                    ) : null}
                    {!e.milady_module_ref && !e.activity_note ? (
                      <div className="text-xs text-slate-400">—</div>
                    ) : null}
                  </div>

                  <div className="col-span-1 flex flex-col gap-1.5 items-end">
                    <form
                      action={async () => {
                        'use server';
                        await actionServer('APPROVE', e.id);
                      }}
                    >
                      <button
                        className="px-3 py-2 border border-brand-green-600 text-brand-green-600 rounded text-xs font-semibold hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={e.status !== 'SUBMITTED'}
                      >
                        Approve
                      </button>
                    </form>

                    <form
                      action={async () => {
                        'use server';
                        await actionServer('REJECT', e.id);
                      }}
                    >
                      <button
                        className="px-3 py-2 border border-red-600 text-brand-orange-600 rounded text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={e.status !== 'SUBMITTED'}
                      >
                        Reject
                      </button>
                    </form>

                    <form
                      action={async () => {
                        'use server';
                        await actionServer('LOCK', e.id);
                      }}
                    >
                      <button
                        className="px-3 py-2 border border-slate-600 text-black rounded text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={e.status !== 'APPROVED'}
                        title="Lock after approval so it can't be changed"
                      >
                        Lock
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
        <strong>Policy reminders:</strong> No backdated WIOA hours, weekly caps
        enforced by API, lock entries after approval for audit safety.
      </div>
    </div>
  );
}
