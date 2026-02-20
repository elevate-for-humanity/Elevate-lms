export const dynamic = 'force-dynamic';

import { DemoPageShell } from '@/components/demo/DemoPageShell';

import { createClient } from '@/lib/supabase/server';

export default async function DemoFundingPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('funding_sources').select('*').limit(50);
const sources = (dbRows as any[]) || [];

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
