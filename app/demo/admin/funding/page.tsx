import type { Metadata } from 'next';
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'Funding | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_SOURCES = [
  { name: 'WIOA Title I Adult', allocated: 48000, spent: 31200, students: 8 },
  { name: 'WIOA Title I Dislocated Worker', allocated: 32000, spent: 18400, students: 5 },
  { name: 'Pell Grant (via partner college)', allocated: 24000, spent: 24000, students: 6 },
  { name: 'DOL ApprenticeshipUSA Grant', allocated: 75000, spent: 41250, students: 12 },
  { name: 'Indiana ETPL Voucher', allocated: 15000, spent: 9000, students: 3 },
  { name: 'Employer Co-Pay (Barber)', allocated: 12000, spent: 4800, students: 4 },
];

export default function DemoFundingPage() {

  return (
    <DemoPageShell title="Funding" description="Track funding sources, allocations, and expenditures." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-5.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
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
            {DEMO_SOURCES.map((s, i) => {
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
                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
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
