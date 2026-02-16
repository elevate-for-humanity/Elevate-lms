import { DemoPageShell } from '@/components/demo/DemoPageShell';

const logs = [
  { time: '2 min ago', user: 'Admin (You)', action: 'Viewed compliance dashboard', ip: '192.168.1.x' },
  { time: '15 min ago', user: 'Sarah Williams', action: 'Submitted WIOA eligibility documents', ip: '10.0.0.x' },
  { time: '1 hour ago', user: 'Admin (You)', action: 'Generated Q4 PIRL report', ip: '192.168.1.x' },
  { time: '2 hours ago', user: 'Marcus Johnson', action: 'Completed CDL Module 3 assessment', ip: '10.0.0.x' },
  { time: '3 hours ago', user: 'Admin (You)', action: 'Approved application for David Chen', ip: '192.168.1.x' },
  { time: '5 hours ago', user: 'Midwest Manufacturing', action: 'Signed OJT agreement', ip: '172.16.0.x' },
  { time: 'Yesterday', user: 'Admin (You)', action: 'Updated CNA program curriculum', ip: '192.168.1.x' },
  { time: 'Yesterday', user: 'System', action: 'Automated attendance compliance check', ip: '—' },
];

export default function DemoAuditLogsPage() {
  return (
    <DemoPageShell title="Audit Logs" description="System activity log for compliance and security auditing." portal="admin">
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
