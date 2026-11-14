import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Calendar | Elevate Admin', robots: { index: false } };

export default async function AdminCalendarPage() {
  await requireRole(['admin', 'super_admin']);
  const account = 'elevateforhumanity@www.elevateforhumanity.org';
  const source = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(account)}&ctz=America%2FNew_York&mode=MONTH&showPrint=0`;
  return (
    <main className="space-y-5 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Calendar</h1><p className="mt-2 text-slate-700">Elevate appointments and meetings · Eastern time</p></div>
        <div className="flex flex-wrap gap-3">
          <a href={`https://calendar.google.com/calendar/u/?authuser=${encodeURIComponent(account)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-700 px-4 py-3 font-bold text-white">Open Google Calendar</a>
          <Link href="/phone/meetings" className="rounded-lg border bg-white px-4 py-3 font-bold">Team meetings</Link>
        </div>
      </div>
      <p className="text-sm text-slate-600">Sign in to Google as {account} to view this private calendar. If your browser blocks Google inside the dashboard, use Open Google Calendar. This view does not make your calendar public or copy meetings into Elevate records.</p>
      <iframe title="Elevate private Google Calendar" src={source} className="h-[750px] w-full rounded-xl border bg-white" referrerPolicy="strict-origin-when-cross-origin" />
      <Link href="/settings/notifications" className="inline-flex font-bold text-blue-700 underline">Set up cellphone alerts</Link>
    </main>
  );
}
