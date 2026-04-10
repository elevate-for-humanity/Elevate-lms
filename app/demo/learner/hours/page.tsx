import type { Metadata } from 'next';
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_HOURS_LOG } from '@/lib/demo/sandbox-data';

export const metadata: Metadata = {
  title: 'Hours | Learner Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const TOTAL_HOURS = 680;
const REQUIRED_HOURS = 2000;

export default function DemoHoursPage() {
  const pct = Math.round((TOTAL_HOURS / REQUIRED_HOURS) * 100);

  return (
    <DemoPageShell title="Hours" description="Log and track your apprenticeship hours." portal="learner">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-17.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">Total Hours</div>
              <div className="text-3xl font-bold text-gray-900">{TOTAL_HOURS} <span className="text-lg font-normal text-gray-500">/ {REQUIRED_HOURS}</span></div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">+ Log Hours</button>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{pct}% complete · {REQUIRED_HOURS - TOTAL_HOURS} hours remaining</div>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Hours</th>
                <th className="px-5 py-3 font-medium">Supervisor</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(DEMO_HOURS_LOG as any[]).map((h, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">{h.date}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{h.activity}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{h.hours}h</td>
                  <td className="px-5 py-3 text-gray-600">{h.supervisor}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {h.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DemoPageShell>
  );
}
