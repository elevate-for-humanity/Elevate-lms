import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_METRICS } from '@/lib/demo/sandbox-data';

const reports = [
  { name: 'Enrollment Report', description: 'Active and historical enrollment data' },
  { name: 'Completion Report', description: 'Program completion rates and outcomes' },
  { name: 'WIOA Compliance', description: 'Federal workforce compliance metrics' },
  { name: 'Financial Summary', description: 'Funding received and expenditures' },
  { name: 'Partner Activity', description: 'Employer partner engagement metrics' },
  { name: 'Placement Report', description: 'Job placement rates and wage data' },
];

export default function DemoReportsPage() {
  const m = DEMO_METRICS;
  return (
    <DemoPageShell title="Reports" description="Analytics and reporting dashboard">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{m.totalStudents}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{m.placementRate}%</p>
          <p className="text-xs text-gray-500">Placement Rate</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">${m.averageWage}/hr</p>
          <p className="text-xs text-gray-500">Avg Wage</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">${(m.fundingReceived / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-500">Funding</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {reports.map((r) => (
          <div key={r.name} className="bg-white rounded-lg border p-4 hover:shadow-sm transition">
            <h3 className="font-bold text-gray-900">{r.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{r.description}</p>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
