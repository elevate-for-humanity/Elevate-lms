import { DemoPageShell } from '@/components/demo/DemoPageShell';

const sources = [
  { name: 'WIOA Adult', allocated: 450000, spent: 312000, students: 89 },
  { name: 'WIOA Youth', allocated: 280000, spent: 195000, students: 52 },
  { name: 'WIOA Dislocated Worker', allocated: 320000, spent: 248000, students: 41 },
  { name: 'State Workforce Grant', allocated: 175000, spent: 98000, students: 35 },
  { name: 'Employer OJT Reimbursement', allocated: 120000, spent: 87000, students: 18 },
  { name: 'Pell Grant (pass-through)', allocated: 95000, spent: 72000, students: 12 },
];

export default function DemoFundingPage() {
  return (
    <DemoPageShell title="Funding" description="Track funding sources, allocations, and expenditures." portal="admin">
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Funding Source</th>
              <th className="px-5 py-3 font-medium">Allocated</th>
              <th className="px-5 py-3 font-medium">Spent</th>
              <th className="px-5 py-3 font-medium">Remaining</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => {
              const pct = Math.round((s.spent / s.allocated) * 100);
              return (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3 text-gray-600">${s.allocated.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600">${s.spent.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600">${(s.allocated - s.spent).toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600">{s.students}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 85 ? 'bg-amber-500' : 'bg-brand-green-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
