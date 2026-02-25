export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DollarSign, Clock } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoIncentivesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('employer_incentives').select('*').limit(50);
const incentives = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Incentives" description="OJT reimbursements, WOTC tax credits, and hiring incentives." portal="employer">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-brand-green-600" /><span className="text-xs text-gray-500">Total Earned</span></div>
          <div className="text-2xl font-bold text-gray-900">$18,425</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-slate-400 flex-shrink-0">•</span><span className="text-xs text-gray-500">Paid Out</span></div>
          <div className="text-2xl font-bold text-gray-900">$13,025</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-gray-500">Pending</span></div>
          <div className="text-2xl font-bold text-gray-900">$5,400</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Apprentice</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {incentives.map((inc, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{inc.type}</td>
                <td className="px-5 py-3 text-gray-600">{inc.apprentice}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{inc.amount}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    inc.status === 'Paid' ? 'bg-brand-green-100 text-brand-green-800' :
                    inc.status === 'Approved' ? 'bg-brand-blue-100 text-brand-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>{inc.status}</span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{inc.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
