import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_RECENT_ACTIVITY } from '@/lib/demo/sandbox-data';

export default function DemoAuditLogsPage() {
  return (
    <DemoPageShell title="Audit Logs" description="System activity and change history">
      <div className="bg-white rounded-lg border divide-y">
        {DEMO_RECENT_ACTIVITY.map((a) => (
          <div key={a.id} className="p-4 flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              a.type === 'enrollment' ? 'bg-brand-blue-500' :
              a.type === 'hours' ? 'bg-green-500' :
              a.type === 'completion' ? 'bg-purple-500' :
              'bg-gray-400'
            }`} />
            <div>
              <p className="text-sm text-gray-900">{a.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(a.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
