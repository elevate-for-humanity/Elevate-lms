import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_METRICS } from '@/lib/demo/sandbox-data';

export default function DemoOutcomesPage() {
  const m = DEMO_METRICS;
  return (
    <DemoPageShell title="Outcomes" description="Placement, retention, and wage outcome tracking">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{m.placementRate}%</p>
          <p className="text-sm text-gray-500">Placement Rate</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-brand-blue-600">${m.averageWage}</p>
          <p className="text-sm text-gray-500">Avg Hourly Wage</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{m.completedThisYear}</p>
          <p className="text-sm text-gray-500">Completed This Year</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-bold text-gray-900 mb-3">Outcomes by Program</h3>
        <div className="space-y-3">
          {[
            { name: 'Barber Apprenticeship', placed: 8, rate: 89 },
            { name: 'CNA Training', placed: 12, rate: 96 },
            { name: 'CDL Class A', placed: 5, rate: 100 },
            { name: 'HVAC Technician', placed: 2, rate: 100 },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-gray-900">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{p.placed} placed</span>
                <span className="text-sm font-medium text-green-600">{p.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoPageShell>
  );
}
