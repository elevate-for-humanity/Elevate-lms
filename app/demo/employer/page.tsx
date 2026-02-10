import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_EMPLOYERS, DEMO_STUDENTS } from '@/lib/demo/sandbox-data';

export default function DemoEmployerPage() {
  const employer = DEMO_EMPLOYERS[0];
  const apprentices = DEMO_STUDENTS.filter(s => s.status === 'active').slice(0, 3);

  return (
    <DemoPageShell title="Employer Dashboard" description={`${employer.name} — Partner Portal`}>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{employer.apprentices}</p>
          <p className="text-xs text-gray-500">Active Apprentices</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">2</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">3</p>
          <p className="text-xs text-gray-500">Open Positions</p>
        </div>
      </div>
      <h2 className="font-bold text-gray-900 mb-3">Current Apprentices</h2>
      <div className="bg-white rounded-lg border divide-y">
        {apprentices.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{s.full_name}</p>
              <p className="text-sm text-gray-500">{s.program}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {s.hours_completed}/{s.hours_required} hrs
              </p>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.round((s.hours_completed / s.hours_required) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
