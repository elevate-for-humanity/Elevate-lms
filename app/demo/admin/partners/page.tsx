export const dynamic = 'force-dynamic';

import { DemoPageShell } from '@/components/demo/DemoPageShell';

import { createClient } from '@/lib/supabase/server';

export default async function DemoPartnersPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('partners').select('*').limit(50);
const partners = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Partners" description="Employer partners, workforce boards, and training providers in your network." portal="admin">
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Organization</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Since</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-600">{p.type}</td>
                <td className="px-5 py-3 text-gray-600">{p.students}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'Active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>{p.status}</span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
