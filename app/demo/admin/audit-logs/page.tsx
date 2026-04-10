import type { Metadata } from 'next';
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'Audit Logs | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_LOGS = [
  { time: 'Today 9:14 AM', user: 'Elizabeth Greene', action: 'Approved enrollment — Marcus Johnson (Barber)', ip: '72.14.1.xx' },
  { time: 'Today 8:52 AM', user: 'Staff Portal', action: 'Generated RAPIDS export — Q1 2026', ip: '72.14.1.xx' },
  { time: 'Today 8:31 AM', user: 'System', action: 'Auto clock-out triggered — geofence exit (15 min)', ip: 'internal' },
  { time: 'Yesterday 4:45 PM', user: 'Elizabeth Greene', action: 'Updated program fee — Barber Apprenticeship', ip: '72.14.1.xx' },
  { time: 'Yesterday 2:10 PM', user: 'Staff Portal', action: 'MOU sent to Downtown Barber Shop', ip: '72.14.1.xx' },
  { time: 'Yesterday 11:03 AM', user: 'System', action: 'Certificate issued — EFH-0D6MXKGD (Wellington Mercedes)', ip: 'internal' },
  { time: 'Apr 8 3:22 PM', user: 'Elizabeth Greene', action: 'Revoked enrollment — funding verification failed', ip: '72.14.1.xx' },
  { time: 'Apr 8 1:15 PM', user: 'System', action: 'WIOA eligibility verified — 3 participants', ip: 'internal' },
];

export default function DemoAuditLogsPage() {
  const logs = DEMO_LOGS;

  return (
    <DemoPageShell title="Audit Logs" description="System activity log for compliance and security auditing." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-2.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{l.time}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{l.user}</td>
                <td className="px-5 py-3 text-gray-600">{l.action}</td>
                <td className="px-5 py-3 text-xs text-gray-400 font-mono">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
