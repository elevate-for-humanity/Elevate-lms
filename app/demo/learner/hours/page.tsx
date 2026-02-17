import { DemoPageShell } from '@/components/demo/DemoPageShell';

const hours = [
  { date: 'Feb 14, 2026', hours: 8, activity: 'Behind-the-wheel training', supervisor: 'Tom Richards', approved: true },
  { date: 'Feb 13, 2026', hours: 6, activity: 'Yard maneuvers practice', supervisor: 'Tom Richards', approved: true },
  { date: 'Feb 12, 2026', hours: 4, activity: 'Classroom — DOT regulations', supervisor: 'Instructor Davis', approved: true },
  { date: 'Feb 11, 2026', hours: 8, activity: 'Highway driving practice', supervisor: 'Tom Richards', approved: true },
  { date: 'Feb 10, 2026', hours: 6, activity: 'Pre-trip inspection drill', supervisor: 'Tom Richards', approved: true },
  { date: 'Feb 7, 2026', hours: 8, activity: 'Behind-the-wheel training', supervisor: 'Tom Richards', approved: false },
];

export default function DemoHoursPage() {
  const totalHours = 680;
  const requiredHours = 2000;
  const pct = Math.round((totalHours / requiredHours) * 100);

  return (
    <DemoPageShell title="Hours" description="Log and track your apprenticeship hours." portal="learner">
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">Total Hours</div>
              <div className="text-3xl font-bold text-gray-900">{totalHours} <span className="text-lg font-normal text-gray-400">/ {requiredHours}</span></div>
            </div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-blue-700">
              + Log Hours
            </button>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-green-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{pct}% complete · {requiredHours - totalHours} hours remaining</div>
        </div>

        {/* Log table */}
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
              {hours.map((h, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">{h.date}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{h.activity}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{h.hours}h</td>
                  <td className="px-5 py-3 text-gray-600">{h.supervisor}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.approved ? 'bg-brand-green-100 text-brand-green-800' : 'bg-amber-100 text-amber-800'}`}>
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
