import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_STUDENTS } from '@/lib/demo/sandbox-data';

export default function DemoApprenticeshipsPage() {
  const apprentices = DEMO_STUDENTS.filter(s => s.hours_required && s.hours_required > 500);
  return (
    <DemoPageShell title="Apprenticeships" description="Active apprenticeship progress tracking">
      <div className="space-y-3">
        {apprentices.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">{s.full_name}</h3>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">{s.status}</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{s.program} — Started {s.start_date}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.round((s.hours_completed / s.hours_required) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{s.hours_completed}/{s.hours_required} hrs</span>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
