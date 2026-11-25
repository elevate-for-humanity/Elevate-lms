import Link from 'next/link';
import type { PracticalServiceEntrySummary } from '@/lib/apprenticeship/practical-dashboard';

export type PracticalServicesCardProps = {
  heading: string;
  /** One-line totals summary, e.g. "12 of 40 required hands-on practices verified". */
  totalsLine: string;
  /** 0-100 when the program has hands-on targets; null when it does not. */
  percent: number | null;
  recentEntries: PracticalServiceEntrySummary[];
  /** Per-apprentice verified counts (Host Shop dashboard). */
  perApprentice?: { name: string; verified: number }[];
  /** Who records services and why the student view is read-only. */
  note: string;
  primaryLink: { href: string; label: string };
  unavailable?: boolean;
};

export default function PracticalServicesCard({
  heading,
  totalsLine,
  percent,
  recentEntries,
  perApprentice,
  note,
  primaryLink,
  unavailable,
}: PracticalServicesCardProps) {
  return (
    <section
      aria-label={heading}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{heading}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{totalsLine}</p>
        </div>
        <Link
          href={primaryLink.href}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          {primaryLink.label}
        </Link>
      </div>
      {unavailable ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
          Practical service progress is temporarily unavailable. Your recorded services are not
          lost — try again shortly.
        </p>
      ) : (
        <>
          {percent !== null ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-800">Hands-on practice</span>
                <span className="text-sm font-semibold text-slate-800">{percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-red-600"
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              </div>
            </div>
          ) : null}
          {perApprentice && perApprentice.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {perApprentice.map((apprentice) => (
                <li
                  key={apprentice.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-950">{apprentice.name}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {apprentice.verified} verified {apprentice.verified === 1 ? 'service' : 'services'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
              Recent verified services
            </h3>
            {recentEntries.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {recentEntries.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="border-b border-slate-100 py-2 text-sm font-medium text-slate-800">
                    {entry.performed_on} — {entry.service_name} ({entry.subject_type})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-medium text-slate-600">
                No verified services recorded yet.
              </p>
            )}
          </div>
        </>
      )}
      <p className="mt-5 text-sm font-medium leading-6 text-slate-600">{note}</p>
    </section>
  );
}
