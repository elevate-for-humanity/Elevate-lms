import Link from 'next/link';
import { getWorkforceTool, type WorkforceTool } from '@/lib/workforce/tools';
import { verifyPlacement, completeFollowUp } from '@/lib/workforce/actions';

const inputClass = 'min-h-11 rounded border border-slate-300 bg-white px-3 py-2 text-slate-950';
const titles = {
  placements: 'Employment Placements',
  'follow-ups': 'Participant Follow-Ups',
  eligibility: 'Eligibility Records',
  'supportive-services': 'Supportive Services',
};

export async function WorkforceToolPage({
  tool,
  params,
}: {
  tool: WorkforceTool;
  params: { filter?: string; saved?: string; error?: string };
}) {
  const { rows: all, names } = await getWorkforceTool(tool);
  const rows = params.filter
    ? all.filter(
        (row) =>
          String(row.status ?? row.request_status ?? row.eligibility_status ?? '').toLowerCase() ===
          params.filter?.toLowerCase(),
      )
    : all;
  const headings =
    tool === 'placements'
      ? ['Participant', 'Employer', 'Job title', 'Start date', 'Status', 'Verification']
      : tool === 'follow-ups'
        ? ['Participant', 'Follow-up', 'Due date', 'Status', 'Outcome']
        : tool === 'eligibility'
          ? ['Participant', 'Recorded eligibility', 'Approved date', 'Expiration']
          : [
              'Participant',
              'Service',
              'Description',
              'Requested',
              'Approved',
              'Status',
              'Request date',
            ];
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{titles[tool]}</h1>
        <p>{rows.length} records within your authorized workspace.</p>
      </div>
      <Link className="underline" href="/workforce/dashboard">
        Back to dashboard
      </Link>
      {params.saved && <p role="status">Record saved.</p>}
      {params.error && (
        <p role="alert">
          Unable to save the record. Refresh and try again, or contact an administrator.
        </p>
      )}
      {tool === 'eligibility' && (
        <p>
          These are recorded review outcomes. A missing record means eligibility has not been
          recorded here. Funding eligibility must be reviewed by an authorized person.
        </p>
      )}
      {tool === 'supportive-services' && (
        <p>
          Amounts and statuses come from recorded WIOA service requests. Approved and paid amounts
          remain separate.
        </p>
      )}
      {params.filter && (
        <Link className="block underline" href={`/workforce/${tool}`}>
          Show all statuses
        </Link>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {headings.map((label) => (
                <th className="p-3 text-left" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t" key={row.id}>
                <td className="p-3">
                  {tool === 'supportive-services'
                    ? (names.get(row.participant?.user_id) ??
                      row.participant?.participant_name ??
                      ([row.participant?.first_name, row.participant?.last_name]
                        .filter(Boolean)
                        .join(' ') ||
                        'Name not recorded'))
                    : (names.get(row.learner_id ?? row.user_id) ?? 'Learner identity not linked')}
                </td>
                {tool === 'placements' && (
                  <>
                    <td className="p-3">{row.employer_name}</td>
                    <td className="p-3">{row.job_title}</td>
                    <td className="p-3">{row.start_date ?? 'Not recorded'}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3">
                      {row.status === 'pending' ? (
                        <form action={verifyPlacement} className="flex flex-col gap-2">
                          <input type="hidden" name="id" value={row.id} />
                          <label>
                            Evidence method
                            <select className={inputClass} required name="method">
                              <option value="employer_contact">Employer contact</option>
                              <option value="pay_stub">Pay stub</option>
                              <option value="offer_letter">Offer letter</option>
                              <option value="self_report">Self report</option>
                            </select>
                          </label>
                          <label>
                            Verification note
                            <input className={inputClass} required maxLength={2000} name="note" />
                          </label>
                          <button className={inputClass} type="submit">
                            Confirm verified placement
                          </button>
                        </form>
                      ) : (
                        (row.verification_method ?? 'Not recorded')
                      )}
                    </td>
                  </>
                )}
                {tool === 'follow-ups' && (
                  <>
                    <td className="p-3">{row.follow_up_type ?? row.followup_type}</td>
                    <td className="p-3">{row.scheduled_date}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3">
                      {row.status !== 'completed' ? (
                        <form action={completeFollowUp} className="flex flex-col gap-2">
                          <input type="hidden" name="id" value={row.id} />
                          <label>
                            Outcome note
                            <input className={inputClass} required maxLength={2000} name="note" />
                          </label>
                          <button className={inputClass} type="submit">
                            Record completed follow-up
                          </button>
                        </form>
                      ) : (
                        (row.outcome_notes ?? 'Not recorded')
                      )}
                    </td>
                  </>
                )}
                {tool === 'eligibility' && (
                  <>
                    <td className="p-3">{row.eligibility_status ?? 'Not recorded'}</td>
                    <td className="p-3">{row.approved_at ?? 'Not recorded'}</td>
                    <td className="p-3">{row.expires_at ?? 'Not recorded'}</td>
                  </>
                )}
                {tool === 'supportive-services' && (
                  <>
                    <td className="p-3">{row.service_type}</td>
                    <td className="p-3">{row.service_description}</td>
                    <td className="p-3">${Number(row.amount_requested ?? 0).toFixed(2)}</td>
                    <td className="p-3">
                      {row.amount_approved == null
                        ? 'Not recorded'
                        : `$${Number(row.amount_approved).toFixed(2)}`}
                    </td>
                    <td className="p-3">{row.request_status}</td>
                    <td className="p-3">{row.requested_date}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p>No records found in this authorized workspace.</p>}
    </section>
  );
}
