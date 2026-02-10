import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_STUDENTS } from '@/lib/demo/sandbox-data';

export default function DemoApplicationsPage() {
  return (
    <DemoPageShell title="Applications" description="Review and process student applications">
      <div className="space-y-3">
        {DEMO_STUDENTS.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{s.full_name}</p>
              <p className="text-sm text-gray-500">{s.program} — {s.status}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
