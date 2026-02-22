export const dynamic = 'force-dynamic';

import { DemoPageShell } from '@/components/demo/DemoPageShell';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoAuditLogsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('audit_logs').select('*').limit(50);
const logs = (dbRows as any[]) || [];

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
